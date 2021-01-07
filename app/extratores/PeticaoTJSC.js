require('../bootstrap');
const cheerio = require('cheerio')
const Path = require('path');
const { CredenciaisAdvogados } = require('../models/schemas/credenciaisAdvogados');
const { ExtratorBase } = require('./extratores');
const { Logger } = require('../lib/util');
const { Robo } = require('../lib/newRobo');

const estado = 'SC'

class PeticaoTJSC extends ExtratorBase {
  constructor(isDebug=false) {
    super('https://eproc1g.tjsc.jus.br/eproc', isDebug);

    this.robo = new Robo();
    this.idsUsadas = [];
    this.resultados = [];
    this.credenciais = {};
  }

  async extrair(numeroProcesso) {
    let objResponse;
    let hash;
    let processosLinks = [];
    let arquivos;
    this.numeroProcesso = numeroProcesso;
    this.resposta = { numeroProcesso: numeroProcesso };

    this.logger = new Logger('info', 'logs/TJSC/peticao.log', {
      nomeRobo: 'peticaoTJSC',
      NumeroDoProcesso: this.numeroProcesso,
      NumeroOab: null
    });

    try {
      await this.primeiraConexao();

      objResponse = await this.login();

      objResponse = await this.acessaPaginaConsulta(objResponse.responseBody);

      if(!this.isLogado(this.credenciais.nome, objResponse.responseBody))
        throw new Error('Pagina apresentou algum tipo de erro ao tentar acessar a pagina de consulta');

      hash = await this.preConsulta(objResponse.responseBody);

      objResponse = await this.consultarProcesso(hash);

      if(!this.isLogado(this.credenciais.nome, objResponse.responseBody))
        throw new Error('Pagina apresentou algum tipo de erro ao tentar consultar o processo');

      objResponse = await this.habilitarAndamentosCompletos(objResponse.responseBody);

      if(!this.isLogado(this.credenciais.nome, objResponse.responseBody))
        throw new Error("Pagina apresentou algum tipo de erro ao tentar habilitar os andamentos completos");

      processosLinks = await this.recuperarLinkDocumentos(objResponse.responseBody);

      arquivos = await this.downloadArquivos(processosLinks);

      await this.fazerMergeArquivos(arquivos);

      this.resposta.sucesso = true;
      this.logger.log('info', `Finalizando procesos de extração de documentos ${this.numeroProcesso}`);
    } catch (e) {
      console.log(e);
      this.logger.log('error', e);
      this.resposta.sucesso = false;
      this.resposta.detalhes = e.message;
    } finally {
      this.resposta.logs = this.logger.logs;
      return this.resposta;
    }
  }

  async primeiraConexao() {
    const options = {
      url: this.url,
      method: 'GET',
      proxy: true
    };
    return this.robo.acessar(options);
  }

  async login() {
    let objResponse;
    do {
      this.credenciais = await this.getCredenciais();

      objResponse = await this.fazerLogin(
        this.credenciais.login,
        this.credenciais.senha
      );

      if (this.isLogado(this.credenciais.nome, objResponse.responseBody)) {
        this.logger.info(`Logado como NOME: ${this.credenciais.nome} - CPF: ${this.credenciais.login}`);
        break;
      }
    } while (true)

    return objResponse;
  }

  async getCredenciais() {
    const credenciais = await CredenciaisAdvogados.getCredenciais(estado,this.idsUsadas);
    this.idsUsadas.push(credenciais._doc._id);

    return credenciais._doc;
  }

  async fazerLogin(usuario, senha) {
    const formData = {
      txtUsuario: usuario.replace(/\D/g, ''),
      pwdSenha: senha,
      hdnAcao: 'login',
      hdnDebug: ''
    };

    const options = {
      url: `${this.url}/index.php`,
      method: 'POST',
      formData: formData,
      proxy: true
    }

    return await this.robo.acessar(options);
  }

  isLogado(nome, body) {
    let regex = new RegExp(nome.split(' ')[0], 'gmi');
    return regex.test(body);
  }

  async acessaPaginaConsulta(body) {
    let hash = await this.buscarHash(body);

    const options = {
      url: `${this.url}/controlador.php?acao=processo_consultar&acao_origem=consultar&hash=${hash}`,
      method: 'GET',
      proxy: true,
    };

    return this.robo.acessar(options);
  }

  async buscarHash(body) {
    const $ = cheerio.load(body);
    let selector = '#menu-ul-3 > li > a';

    let link = $(selector)[0].attribs.href;

    return link.match(/hash=(\w+)\W?/)[1];
  }

  async preConsulta(body) {
    let hash = this.buscarFormHash(body);
    let objResponse;

    const formData = {
      hdnInfraTipoPagina: '1',
      txtCaptcha: '',
      acao_origem: 'consultar',
      acao_retorno: '',
      acao: 'processo_consultar',
      tipoPesquisa: 'NU',
      numNrProcesso: this.numeroProcesso,
      selIdClasseSelecionados: '',
      strChave: '',
    };

    const options = {
      url: `${this.url}/controlador_ajax.php?acao_ajax=processos_consulta_por_numprocesso&hash=${hash}`,
      method: 'POST',
      formData: formData,
      proxy: true,
    };

    objResponse = await this.robo.acessar(options);

    if (/Processo\snão\sencontrado/.test(objResponse.responseBody))
      throw new Error('Processo não encontrado');
    return this.resgataNovoHash(objResponse.responseBody);
  }

  buscarFormHash(body) {
    const selector = '#divNumNrProcesso';
    const $ = cheerio.load(body);

    let link = $(selector)[0].attribs['data-acaoassinada'];

    return link.match(/hash=(\w+)\W?/)[1];
  }

  async resgataNovoHash(body) {
    let context = body.resultados[0].linkProcessoAssinado;

    return context.match(/hash=(\w+)\W?/)[1];
  }

  /**
   * Faz a consulta do processo no site
   * @param {string} hash
   * @returns {Promise<{Object}>}
   */
  async consultarProcesso(hash) {
    let queryString = {
      acao: 'processo_selecionar',
      acao_origem: 'processo_consultar',
      acao_retorno: 'processo_consultar',
      num_processo: this.numeroProcesso.replace(/\D/g, ''),
      hash: hash,
    };

    const options = {
      url: `${this.url}/controlador.php`,
      method: 'GET',
      queryString: queryString,
      proxy: true,
    };

    return this.robo.acessar(options);
  }

  /**
   * Acessando pagina com andamentos antes bloqueados
   * @param {string} body
   * @returns {Promise<{Object}>}
   */
  async habilitarAndamentosCompletos(body) {
    const $ = cheerio.load(body);
    let link = $('#fldAcoes > center > a')[0].attribs.href;
    let hash = link.match(/hash=(\w+)\W?/)[1];

    const options = {
      url: `${this.url}/controlador.php`,
      queryString: {
        acao: 'processo_vista_sem_procuracao',
        txtNumProcesso: this.numeroProcesso.replace(/\D/g, ''),
        hash: hash,
      },
      proxy: true,
    };

    return await this.robo.acessar(options);
  }

  /**
   * Recupera links com os documentos iniciais
   * @param {string} body
   * @returns {Promise<[]>}
   */
  async recuperarLinkDocumentos(body) {
    const $ = cheerio.load(body);
    const selector = '#trEvento1 > td:nth-child(5) > a';
    let nodes = $(selector);
    let links = [];

    nodes.map((index, node) => {
      links.push($(node)[0].attribs.href);
    });

    return links;
  }

  /**
   * Entrando na pagina de download de cada arquivos e fazendo download dos arquivos, salvando eles na pasta de downloads
   * @param {[string]} links
   * @returns {Promise<[]>}
   */
  async downloadArquivos(links) {
    let arquivos = [];
    let objResponse;
    let options;
    let $;

    let path;
    let writer;

    for (let i = 0, tam = links.length; i < tam; i++) {
      options = {
        url: `${this.url}/${links[i]}`,
        method: 'GET',
        proxy: true,
      };
      objResponse = await this.robo.acessar(options);
      $ = cheerio.load(objResponse.responseBody);

      let pagina = $('#conteudoIframe')[0].attribs.src;
      path = Path.resolve(
        __dirname,
        '../downloads',
        `${this.numeroProcesso.replace(/\D/g, '')}_${i}.pdf`
      );
      writer = fs.createWriteStream(path);

      objResponse = await this.robo.acessar({
        url: `${this.url}/${pagina}`,
        method: 'GET',
        responseType: 'stream',
        proxy: true,
      });
      objResponse.responseBody.pipe(writer);
      await new Promise((resolve, reject) => {
        writer.on('close', () => {
          this.logger.info(
            `Download do arquivo ${this.numeroProcesso.replace(
              /\D/g,
              ''
            )}_${i}.pdf concluido`
          );
          resolve();
          arquivos.push(path);
        });
        writer.on('error', (err) => {
          reject(err);
          this.logger.info(
            `Download do arquivo ${this.numeroProcesso.replace(
              /\D/g,
              ''
            )}_${i}.pdf falhou`
          );
        });
      });
    }

    // await Promise.all(downloads).then(res => this.logger.info(res.length, 'Downloads concluidos'));
    return arquivos;
  }

  /**
   * Junta os arquivos os arquivos
   * @param {[string]} arquivos
   * @returns {Promise<undefined>}
   */
  async fazerMergeArquivos(arquivos) {
    let merger = new PDFMerger();

    let path = Path.resolve(
      __dirname,
      '../downloads',
      `${this.numeroProcesso.replace(/\D/g, '')}.pdf`
    );

    this.logger.info(`Preparando união de ${arquivos.length} arquivos`);
    arquivos.map((element) => {
      merger.add(element);
    });

    this.logger.info('Juntando arquivos');
    return merger.save(path);
  }
}

module.exports.PeticaoTJSC = PeticaoTJSC;

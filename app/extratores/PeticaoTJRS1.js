require('../bootstrap');
const cheerio = require('cheerio');
const Path = require('path');
const fs = require('fs');
const sleep = require('await-sleep');
const { ExtratorBase } = require('./extratores');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const { Robo } = require('../lib/newRobo');
const PDFMerger = require('pdf-merger-js');

const {
  CredenciaisAdvogados,
} = require('../models/schemas/credenciaisAdvogados');

const estado = 'RS';

class PeticaoTJRS1 extends ExtratorBase {
  constructor() {
    super('https://eproc1g.tjrs.jus.br/eproc', false);
    this.robo = new Robo();
    this.idsUsadas = [];
    this.resultados = [];
    this.credenciais = {};
  }

  async extrair(numeroProcesso) {
    let objResponse;
    let hash;
    let processosLinks = [];
    this.numeroProcesso = numeroProcesso;

    this.logger = new Logger('info', `logs/PeticaoTJRS/PeticaoTJRSInfo.log`, {
      nomeRobo: 'peticao.TJRS',
      NumeroDoProcesso: numeroProcesso,
    });

    try {
      this.logger.info('Fazendo primeira conexão ao site');
      await this.primeiraConexao();
      await sleep(100);

      this.logger.info('Fazendo tentativa de login');
      objResponse = await this.login();
      await sleep(100);

      this.logger.info('Acessando pagina de consulta');
      objResponse = await this.acessaPaginaConsulta(objResponse.responseBody);
      await sleep(100);

      this.logger.info('Capturando hash de request da pre-consulta');
      hash = await this.preConsulta(objResponse.responseBody);
      await sleep(100);

      this.logger.info('Consultando andamento');
      objResponse = await this.consultarProcesso(hash);
      await sleep(100);

      this.logger.info('Habilitando pagina completa de andamentos');
      objResponse = await this.habilitarAndamentosCompletos(
        objResponse.responseBody
      );
      await sleep(100);

      this.logger.info('Capturando link de download dos documentos');
      processosLinks = await this.recuperarLinkDocumentos(
        objResponse.responseBody
      );

      this.logger.info('Fazendo download dos documentos');
      let arquivos = await this.downloadArquivos(processosLinks);

      this.logger.info('Fazendo merge dos arquivos');
      await this.fazerMergeArquivos(arquivos);
      await sleep(100);

      this.logger.info('Deletando arquivos temporarios');
      await this.deletaArquivosTemporarios(arquivos);
      await sleep(100);

      return true;
    } catch (e) {
      this.logger.log('error', e);
    } finally {
      this.logger.info('Extração finalizada');
    }
  }

  async primeiraConexao() {
    const options = {
      url: this.url,
      method: 'GET',
    };
    return this.robo.acessar(options);
  }

  /**
   * Acessa o site, tenta fazer login com as credenciais disponiveis no banco
   * @returns {Promise<{Object}>}
   */
  async login() {
    let objResponse;
    do {
      this.credenciais = await this.getCredenciais();

      objResponse = await this.fazerLogin(
        this.credenciais.login,
        this.credenciais.senha
      );

      if (this.isLogado(this.credenciais.nome, objResponse.responseBody)) {
        this.logger.info(
          `Logado como NOME: ${this.credenciais.nome} - CPF: ${this.credenciais.login}`
        );
        break;
      }
    } while (true);

    return objResponse;
  }

  async getCredenciais() {
    const credenciais = await CredenciaisAdvogados.getCredenciais(
      estado,
      this.idsUsadas
    );
    this.idsUsadas.push(credenciais._doc._id);

    return credenciais._doc;
  }

  /**
   *
   * @param {string} usuario
   * @param {string} senha
   * @returns {Promise<{Object}>}
   */
  async fazerLogin(usuario, senha) {
    const formData = {
      txtUsuario: usuario.replace(/\D/g, ''),
      pwdSenha: senha,
      hdnAcao: 'login',
      hdnDebug: '',
    };

    const options = {
      url: `${this.url}/index.php`,
      method: 'POST',
      formData: formData,
    };

    return await this.robo.acessar(options);
  }

  isLogado(nome, body) {
    let regex = new RegExp(nome.split(' ')[0], 'gmi');
    return regex.test(body);
  }

  /**
   * Resgata a hash da pagina e acessa a pagina de consulta de processos
   * @param {string} body
   * @returns {Promise<{Object}>}
   */
  async acessaPaginaConsulta(body) {
    let hash = await this.buscarHash(body);

    const options = {
      url: `${this.url}/controlador.php?acao=processo_consultar&acao_origem=consultar&hash=${hash}`,
      method: 'GET',
    };

    return this.robo.acessar(options);
  }

  async buscarHash(body) {
    const $ = cheerio.load(body);
    let selector = '#menu-ul-3 > li > a';

    let link = $(selector)[0].attribs.href;

    return link.match(/hash=(\w+)\W?/)[1];
  }

  /**
   * Faz um acesso ao endpoint para pegar o hash mutavel da consulta do processo
   * @param {string} body
   * @returns {Promise<string>}
   */
  async preConsulta(body) {
    let hash = this.buscarFormHash(body); // TODO criar essa funcao
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
    };

    objResponse = await this.robo.acessar(options);

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

  async deletaArquivosTemporarios(arquivos) {
    this.logger.info(`Excluindo ${arquivos.length} arquivos`);
    arquivos.map((element) => fs.unlinkSync(element));
  }
}

module.exports.PeticaoTJRS1 = PeticaoTJRS1;

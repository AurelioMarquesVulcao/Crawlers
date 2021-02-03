const cheerio = require('cheerio');
const sleep = require('await-sleep');
require('../bootstrap');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { ExtratorBase } = require('./extratores');
const { Logger } = require('../lib/util');
const { LogExecucao } = require('../lib/logExecucao');
const { Processo } = require('../models/schemas/processo');
const { Robo } = require('../lib/newRobo');

const proxy = true;

class OabESAJ extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.robo = new Robo();
  }

  async extrair(numeroOab, cadastroConsultaId) {
    this.numeroOab = numeroOab;
    this.setLogger();
    this.setCadastroConsulta(numeroOab, cadastroConsultaId);

    console.log(this.cadastroConsulta);
    let objResponse;
    let primeiroAcesso;
    // let tentativa = 1;
    // let limite = 5;
    let processosList;

    try {
      primeiroAcesso = await this.fazerPrimeiroAcesso();

      if (!primeiroAcesso.sucesso) process.exit(0);

      objResponse = await this.acessarPaginaConsulta();

      let captchaExiste = this.verificaCaptcha(objResponse.responseBody);

      if (captchaExiste) {
        this.logger.info('Captcha detectado');
        // do {
        this.logger.info(`Tentativa de acesso [${this.tentativa}]`);

        let uuidCaptcha = await this.consultarUUID();
        let gResponse = await this.resolverCaptcha();

        objResponse = await this.acessarPaginaConsulta(uuidCaptcha, gResponse);

        // break;
        // } while (tentativa === limite);
      } else {
        objResponse = await this.acessarPaginaConsulta();
      }

      processosList = await this.extrairPaginas(objResponse.responseBody);
      processosList = await this.verificaNovos(processosList);

      console.log({ processosList: processosList.length });

      this.resultado = await this.enfileirarProcessos(processosList);

      this.resposta = {
        sucesso: true,
        nProcesso: this.resultados,
      };
    } catch (e) {
      console.log(e);
      this.logger.log('error', String(e));
      this.resposta = { sucesso: false, detalhes: e.message };
    } finally {
      this.resposta.logs = this.logger.logs;
      return this.resposta;
    }
  }

  verificaCaptcha(body) {
    const $ = cheerio.load(body);

    let captcha = $('.g-recaptcha').length;

    return Boolean(captcha);
  }

  setLogger() {
    this.logger = new Logger('info', `logs/${this.tribunal}/oab.log`, {
      nomeRobo: `Oab${this.tribunal}`,
      NumeroOab: this.numeroOab,
    });
  }

  setCadastroConsulta(cadastroConsultaId) {
    this.cadastroConsulta = {
      SeccionalOab: this.estado,
      TipoConsulta: 'processo',
      NumeroOab: this.numeroOab,
      Instancia: 1,
      NomeRobo: this.tribunal,
      _id: cadastroConsultaId,
    };
  }

  async fazerPrimeiroAcesso() {
    this.logger.info('Fazendo primeiro acesso');
    let primeiroAcessoWait = 10000;
    let tentativa = 1;
    let primeiroAcessoTentativas = 5;
    let objResponse;

    do {
      this.logger.info(
        `Tentando realizar a primeira conexão. [Tentativa: ${tentativa}]`
      );

      objResponse = await this.realizaPrimeiraConexao().catch((err) => err);
      if (objResponse.status === 200) return { sucesso: true };

      this.logger.info('Falha ao tentar conectar no site.');
      tentativa++;
      await sleep(primeiroAcessoWait);
    } while (tentativa <= primeiroAcessoTentativas);

    return { sucesso: false };
  }

  async realizaPrimeiraConexao() {
    return await this.robo.acessar({
      url: `${this.url}/open.do`,
      method: 'GET',
      proxy: proxy,
    });
  }

  async acessarPaginaConsulta() {
    this.logger.info('Entrando na pagina de consulta');

    let options = {
      url: `${this.url}/search.do`,
      method: 'GET',
      queryString: {
        conversationId: '',
        'dadosConsulta.localPesquisa.cdLocal': '-1',
        cbPesquisa: 'NUMOAB',
        'dadosConsulta.tipoNuProcesso': 'UNIFICADO',
      },
      proxy: proxy,
    };

    return this.robo.acessar(options);
  }

  async consultarUUID() {
    this.logger.info('Consultado UUID do site');
    let objResponse;

    let options = {
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      proxy: proxy,
    };

    objResponse = await this.robo.acessar(options);

    return objResponse.responseBody.uuidCaptcha;
  }

  async resolverCaptcha() {
    const ch = new CaptchaHandler(5, 10000, `Processo${this.tribunal}`, {
      numeroDoProcesso: this.numeroProcesso,
    });

    this.logger.info('Tentando resolver captcha');

    let captcha = await ch
      .resolveRecaptchaV2(`${this.url}/open.do`, this.dataSiteKey, '/')
      .catch((err) => {
        throw err;
      });

    if (!captcha.sucesso)
      throw new Error(
        'Falha na resposta. Não foi possivel recuperar a resposta para o captcha'
      );

    this.logger.info('Retornada resposta da API');
    return captcha.gResponse;
  }

  async acessarPaginaConsulta(uuid, gResponse) {
    this.logger.info('Tentando acessar pagina da consulta de OAB');
    let options = {
      url: `${this.url}/search.do`,
      method: 'GET',
      queryString: {
        conversationId: '',
        'dadosConsulta.localPesquisa.cdLocal': '-1',
        cbPesquisa: 'NUMOAB',
        'dadosConsulta.tipoNuProcesso': 'UNIFICADO',
        'dadosConsulta.valorConsulta': this.numeroOab,
      },
      proxy: proxy,
      encoding: 'utf8',
    };

    if (uuid && gResponse) {
      options.uuidCaptcha = uuid;
      options['g-recaptcha-response'] = gResponse;
    }

    return await this.robo.acessar(options);
  }

  async extrairPaginas(body) {
    let processos = [];
    let processosDaPagina = [];
    let proxPagina = 'true';
    let paginaCount = 0;

    this.logger.info('Extraindo paginas');
    do {
      paginaCount++;
      this.logger.info(`Extraindo pagina ${paginaCount}`);
      processosDaPagina = this.extrairProcessos(body);

      processos = [...processos, ...processosDaPagina];

      proxPagina = this.verificaProximaPagina(body);

      if (!proxPagina) {
        this.logger.info('Fim das paginas');
        break;
      }

      body = await this.acessarProximaPagina(proxPagina);
    } while (true);

    return processos;
  }

  extrairProcessos(body) {
    const $ = cheerio.load(body);

    let divLinkProcesso = $('.nuProcesso');
    let processos = [];

    divLinkProcesso.map((index, div) => {
      processos.push($(div).children()[0].children[0].data.trim());
    });

    return processos;
  }

  verificaProximaPagina(body) {
    this.logger.info('Verificando a existencia de outra pagina');
    const $ = cheerio.load(body);
    let proximaPagina = $('a[title="Próxima página"]');

    if (proximaPagina.length) {
      return proximaPagina[0].attribs.href;
    }

    return false;
  }

  async acessarProximaPagina(link) {
    this.logger.info('Acessando nova pagina do processo');
    let objResponse;

    let options = {
      url: `http://esaj.${this.tribunal.toLowerCase()}.jus.br${link}`,
      method: 'GET',
      proxy: proxy,
      encoding: 'utf8',
    };

    objResponse = await this.robo.acessar(options);

    return objResponse.responseBody;
  }

  async verificaNovos(processos) {
    this.logger.info('Verificando processos já existentes no banco');

    let query = { 'detalhes.numeroProcessoMascara': { $in: processos } };
    let projection = { 'detalhes.numeroProcessoMascara': 1, _id: -1 };

    /**
     * @type {[String]}
     */
    let processosSalvos = await Processo.find(query, projection);

    if (processosSalvos.length === processos.length) return [];
    if (!processosSalvos.length) return processos;
    return processos.filter(
      (processo) => processosSalvos.indexOf(processo) === -1
    );
  }

  async enfileirarProcessos(processos) {
    this.logger.info('Preparando para enfileirar processos');
    this.logger.info(
      `${processos.length} processos preparados para serem enviados a extração`
    );
    let cadastroConsulta = this.cadastroConsulta;
    let resultados = [];

    const fila = `processo.${this.tribunal}.extracao.novos`;
    for (let p of processos) {
      cadastroConsulta['NumeroProcesso'] = p;

      let logExec = await LogExecucao.cadastrarConsultaPendente(
        cadastroConsulta,
        fila
      );

      if (logExec.enviado && logExec.sucesso) {
        this.logger.info(`Processo: ${p} => ${fila}`);
        resultados.push(p);
      }
    }

    return resultados.length;
  }
}

class OabTJMS extends OabESAJ {
  constructor() {
    super('https://esaj.tjms.jus.br/cpopg5', false);
    this.tribunal = 'TJMS';
    this.estado = 'MS';
  }

  setLogger() {
    super.setLogger();
  }
}

new OabTJMS()
  .extrair('4232MS', '601ab3599225ed7086230be4')
  .then((res) => console.log(res));

module.exports.OabTJMS = OabTJMS;

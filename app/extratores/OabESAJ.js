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

  async extrair(numeroOab, cadastroConsultaId, execucaoAnterior = {}) {
    this.numeroOab = /\w{2}/.test(numeroOab)
      ? numeroOab
      : `${numeroOab}${this.estado}`;
    this.setLogger();
    this.setCadastroConsulta(cadastroConsultaId);

    this.resposta = {};

    this.resposta.execucaoAnterior = {
      cookies: '',
      captchaSettings: '',
    };

    console.log(this.cadastroConsulta);
    let objResponse;
    let primeiroAcesso;
    let tentativa = 1;
    let limite = 5;
    let processosList;
    let erroCaptcha = false;

    let uuidCaptcha;
    let gResponse;

    try {
      primeiroAcesso = await this.fazerPrimeiroAcesso();

      if (!primeiroAcesso.sucesso) process.exit(0);

      objResponse = await this.acessarPaginaConsulta(execucaoAnterior);

      let captchaExiste = this.verificaCaptcha(objResponse.responseBody);

      do {
        if (captchaExiste) {
          this.logger.info('Captcha detectado');
          // do {
          this.logger.info(`Tentativa de acesso [${this.tentativa}]`);

          if (
            Object.keys(execucaoAnterior).length &&
            execucaoAnterior.captchaSettings.uuidCaptcha &&
            execucaoAnterior.captchaSettings.gResponse &&
            !erroCaptcha
          ) {
            this.logger.info('Variaveis de execução anterior foram detectadas');
            uuidCaptcha = execucaoAnterior.captchaSettings.uuidCaptcha;
            gResponse = execucaoAnterior.captchaSettings.gResponse;
          } else {
            this.logger.info(
              'Variaveis de execução anterior não foram detectadas'
            );
            uuidCaptcha = await this.consultarUUID();
            gResponse = await this.resolverCaptcha();
          }

          this.captchaSettings = { uuidCaptcha, gResponse };

          objResponse = await this.consultarOab(uuidCaptcha, gResponse);

          // break;
          // } while (tentativa === limite);
        } else {
          objResponse = await this.acessarPaginaConsulta({});
        }

        processosList = await this.extrairPaginas(objResponse.responseBody);
        if (processosList.length > 0) {
          break;
        }

        erroCaptcha = true;
        tentativa++;
      } while (tentativa < limite);

      if (tentativa === limite)
        throw new Error('Limite de tentativas excedidos');

      processosList = await this.verificaNovos(processosList);

      // console.log({ processosList: processosList.length });

      this.resultado = await this.enfileirarProcessos(processosList);

      this.resposta.sucesso = true;
      this.resposta.nProcesso = this.resultados;
    } catch (e) {
      console.log(e);
      this.logger.log('error', String(e));
      this.resposta.sucesso = false;
      this.resposta.detalhes = e.message;
    } finally {
      this.resposta.execucaoAnterior = {
        cookies: this.robo.cookies,
        captchaSettings: this.captchaSettings,
      };
      this.resposta.logs = this.logger.logs;

      return this.resposta;
    }
  }

  /**
   * Verificando se existe a presença de captcha
   * @param body
   * @return {boolean}
   */
  verificaCaptcha(body) {
    const $ = cheerio.load(body);

    let captcha = $('.g-recaptcha').length;

    return Boolean(captcha);
  }

  /**
   * Prepara as variaveis de para realizar o logging
   */
  setLogger() {
    this.logger = new Logger('info', `logs/${this.tribunal}/oab.log`, {
      nomeRobo: `Oab${this.tribunal}`,
      NumeroOab: this.numeroOab,
    });
  }

  /**
   * Prepara a variavel de cadastro consulta
   * @param cadastroConsultaId
   */
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

  /**
   * Faz a primeira conexão com o site do tribunal
   * @return {Promise<{sucesso: boolean}>}
   */
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

  /**
   * Faz a requisição para acessar o site do tribubal
   * @return {Promise<{Object}>}
   */
  async realizaPrimeiraConexao() {
    return await this.robo.acessar({
      url: `${this.url}/open.do`,
      method: 'GET',
      proxy: proxy,
    });
  }

  /**
   * Acessar pagina de consulta
   * @return {Promise<{Object}>}
   */
  async acessarPaginaConsulta(execucaoAnterior) {
    let cookies;
    this.logger.info('Entrando na pagina de consulta');

    if (Object.keys(execucaoAnterior).length && execucaoAnterior.cookies) {
      cookies = execucaoAnterior.cookies;
    }

    if (cookies && Object.keys(cookies).length) this.robo.cookies = cookies;

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

  /**
   * Recuperar UUID do site
   * @return {Promise<string>}
   */
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

  /**
   * Resolve o captcha da pagina
   * @return {Promise<*>}
   */
  async resolverCaptcha() {
    const ch = new CaptchaHandler(
      5,
      10000,
      this.constructor.name,
      {
        numeroDaOab: this.numeroOab,
      },
      'Oab',
      this.estado
    );

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

  /**
   * Consulta o processo
   * @param {string|null} uuid
   * @param {string|null} gResponse
   * @return {Promise<{Object}>}
   */
  async consultarOab(uuid, gResponse) {
    console.log({ uuid, gResponse });
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
      options.queryString.uuidCaptcha = uuid;
      options.queryString['g-recaptcha-response'] = gResponse;
    }

    return await this.robo.acessar(options);
  }

  /**
   * Carrega a pagina do processo e troca de pagina se ela estiver paginada
   * @param {string} body codigo html em string
   * @return {Promise<[]>}
   */
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

  /**
   * extrai o numero de processos da pagina
   * @param body
   * @return {[String]}
   */
  extrairProcessos(body) {
    const $ = cheerio.load(body);

    let divLinkProcesso = $('a.linkProcesso');
    let processos = [];

    divLinkProcesso.map((index, div) => {
      let numero = $(div).text();
      processos.push(numero.trim());
    });

    return processos;
  }

  /**
   * Verifica a existencia de uma proxima pagina
   * @param body
   * @return {boolean}
   */
  verificaProximaPagina(body) {
    this.logger.info('Verificando a existencia de outra pagina');
    const $ = cheerio.load(body);
    let proximaPagina = $('[title="Próxima página"]');

    if (proximaPagina.length) {
      return proximaPagina[0].attribs.href;
    }

    return false;
  }

  /**
   * Acessa a pagina seguinte
   * @param link
   * @return {Promise<String>}
   */
  async acessarProximaPagina(link) {
    this.logger.info('Acessando nova pagina do processo');
    let objResponse;

    let options = {
      url: `https://esaj.${this.tribunal.toLowerCase()}.jus.br${link}`,
      method: 'GET',
      proxy: proxy,
      encoding: 'utf8',
    };

    objResponse = await this.robo.acessar(options);

    return objResponse.responseBody;
  }

  /**
   * Verifica os processos que ainda não constam no banco
   * @param {[String]} processos
   * @return {Promise<[String]>}
   */
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

  /**
   * Enfileira processos que existem
   * @param processos
   * @return {Promise<number>}
   */
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

class OabTJSP extends OabESAJ {
  constructor() {
    super('https://esaj.tjsp.jus.br/cpopg', false);
    this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
    this.tribunal = 'TJSP';
    this.estado = 'SP';
  }

  setLogger() {
    super.setLogger();
  }
}

class OabTJSC extends OabESAJ {
  constructor() {
    super('https://esaj.tjsc.jus.br/cpopg', false);
    this.dataSiteKey = '6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL';
    this.tribunal = 'TJSC';
    this.estado = 'SC';
  }

  setLogger() {
    super.setLogger();
  }
}

class OabTJCE extends OabESAJ {
  constructor() {
    super('https://esaj.tjce.jus.br/cpopg', false);
    this.dataSiteKey = '6LeME0QUAAAAAPy7yj7hh7kKDLjuIc6P1Vs96wW3';
    this.tribunal = 'TJCE';
    this.estado = 'CE';
  }
}

module.exports = {
  OabTJMS,
  OabTJSP,
  OabTJSC,
  OabTJCE,
};

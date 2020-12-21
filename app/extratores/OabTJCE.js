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

class OabTJCE extends ExtratorBase {
  constructor() {
    super();
    this.url = 'https://esaj.tjce.jus.br/cpopg';
    this.robo = new Robo();
    this.dataSiteKey = '6LeME0QUAAAAAPy7yj7hh7kKDLjuIc6P1Vs96wW3';
  }

  async extrair(numeroOab, cadastroConsultaId) {
    this.numeroOab = numeroOab;
    this.setLogger(numeroOab);
    this.setCadastroConsulta(numeroOab, cadastroConsultaId);

    let objResponse;
    // Resposta para tentativa de primeiro acesso no site
    let primeiroAcesso;
    // UUID que representa algo como sua sessão
    let uuidCaptcha;
    // Responsta para Google Recaptcha
    let gResponse;
    let tentativa = 1;
    let limite = 5;
    // Variavel que diz se o acesso a pagina foi um sucesso ou se o captcha falhou
    let paginaReturn;
    // É aqui que serão armazenados os processos
    let processosList;

    try {
      primeiroAcesso = await this.fazerPrimeiroAcesso();

      if (!primeiroAcesso.sucesso) process.exit(0);

      objResponse = await this.acessarPaginaConsulta();

      uuidCaptcha = await this.consultarUUID();

      do {
        this.logger.info(`Tentativa de acesso [${tentativa}]`);
        gResponse = await this.resolverCaptcha();

        objResponse = await this.acessandoPaginaOabs(uuidCaptcha, gResponse);

        processosList = await this.extrairPaginas(objResponse.responseBody);

        processosList = await this.verificaNovos(processosList);

        await this.enfileirarProcessos(processosList);
      } while (tentativa !== limite);
    } catch (e) {
      console.log(e);
    } finally {
      console.log('terminou');
    }
  }

  setCadastroConsulta(numeroOab, cadastroConsultaId) {
    this.cadastroConsulta = {
      SeccionalOab: 'RS',
      TipoConsulta: 'processo',
      NumeroOab: numeroOab,
      Instancia: 1,
      NomeRobo: 'TJRS',
      _id: cadastroConsultaId,
    };
  }

  /**
   * Monta o logger que sera usado no processo de extracao
   * @param {string} numeroOab numero da oab no formato \d+[A-Z]{2}
   */
  setLogger(numeroOab) {
    console.log(numeroOab);
    this.logger = new Logger('info', 'logs/TJCE/oab.log', {
      nomeRobo: 'OabTJCE',
      NumeroOab: numeroOab,
    });
  }

  /**
   * Realiza tentativas de acessar a pagina do site
   * @returns {Promise<{sucesso: Boolean}>}
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
      if (this.isDebug) console.log({ tentativa, status: objResponse.status });
      console.log(objResponse.status); // TODO remover
      if (objResponse.status === 200) return { sucesso: true };

      this.logger.info('Falha ao tentar conectar no site.');
      tentativa++;
      await sleep(primeiroAcessoWait);
    } while (tentativa <= primeiroAcessoTentativas);

    return { sucesso: false };
  }

  /**
   * Faz a a primeira conexão
   * @returns {Promise<Object>}
   */
  async realizaPrimeiraConexao() {
    this.robo.setHeader({
      Host: 'esaj.tjce.jus.br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-User': '?1',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      Referer: `${this.url}/open.do`,
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    });

    return await this.robo.acessar({
      url: `${this.url}/open.do`,
      method: 'GET',
      proxy: proxy,
    });
  }

  /**
   * Acessa a pagina de consulta
   * @returns {Promise<{Object}>}
   */
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

  /**
   * Faz o request para adquirir o UUID
   * @returns {Promise<String>}
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
   * Recebe o captcha e tenta resolve-lo, retorna string com o captcha resolvido
   * @returns {Promise<String>}
   */
  async resolverCaptcha() {
    const ch = new CaptchaHandler(5, 10000, 'ProcessoTJCE', {
      numeroDoProcesso: this.numeroProcesso,
    });

    this.logger.info('Tentando resolver captcha');
    let captcha = await ch
      .resolveRecaptchaV2(`${this.url}/open.do`, this.dataSiteKey, '/')
      .catch((err) => {
        throw err;
      });

    if (!captcha.sucesso) {
      throw new Error(
        'Falha na resposta. Não foi possivel recuperar a resposta para o captcha'
      );
    }

    this.logger.info('Retornada resposta da API');
    return captcha.gResponse;
  }

  /**
   *
   * @param uuid
   * @param gResponse
   * @returns {Promise<{Object}>}
   */
  async acessandoPaginaOabs(uuid, gResponse) {
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
        uuidCaptcha: uuid,
        'g-recaptcha-response': gResponse,
      },
      proxy: proxy,
      encoding: 'utf8',
    };

    return await this.robo.acessar(options);
  }

  avaliaPagina(body) {
    this.logger.info('Avaliando a pagina para detectar a presença de erros');

    const $ = cheerio.load(body);
    const mensagemRetornoSelector = '#mensagemRetorno';
    const tabelaMovimentacoesSelector = '#tabelaTodasMovimentacoes';
    const senhaProcessoSelector = '#senhaProcesso';

    let mensagemRetornoText = $(mensagemRetornoSelector).text();
  }

  async extrairPaginas(body) {
    let processos = [];
    let processosDaPagina = [];
    let proxPagina = 'true';

    do {
      processosDaPagina = this.extrairProcessos(body);

      processos = [...processos, ...processosDaPagina];

      proxPagina = this.verificaProximaPagina(body);
      if (!proxPagina) break;
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
    const $ = cheerio.load(body);
    let proximaPagina = $('a[title="Próxima página"]');

    if (proximaPagina.length) {
      return proximaPagina[0].attribs.href;
    }

    return false;
  }

  async acessarProximaPagina(link) {
    let objResponse;

    objResponse = await this.robo.acessar({
      url: `http://esaj.tjce.jus.br${link}`,
      method: 'GET',
      proxy: proxy,
      encoding: 'utf8',
    });

    return objResponse.responseBody;
  }

  /**
   * Consulta o banco e resgata lista de processo já salvos, devolvendo somente os processos novos que não constam no banco.
   * @param {[String]} processos lista de processo retirados da extracao
   * @returns {Promise<[String]>}
   */
  async verificaNovos(processos) {
    let processosSalvos = await Processo.find(
      {
        'detalhes.numeroProcessoMascara': { $in: processos },
      },
      { 'detalhes.numeroProcessoMascara': 1, _id: -1 }
    );

    if (processosSalvos.length === processos.length) return [];

    if (!processosSalvos.length) return processos;

    let processosNovos = processos.filter(
      (processo) => processosSalvos.indexOf(processo) === -1
    );

    return processosNovos;
  }

  async enfileirarProcessos(processos) {
    let cadastroConsulta = this.cadastroConsulta;
    let resultados = [];

    const fila = c'processo.TJCE.extracao.novos';
    for (let p of processos) {
      cadastroConsulta['NumeroProcesso'] = p;

      let logExec = await LogExecucao.cadastrarConsultaPendente(
        cadastroConsulta,
        fila
      );

      if (logExec.enviado && logExec.sucesso) {
        this.logger.info(`Processo: ${p} ==> ${fila}`);
        resultados.push(p);
      }
    }

    return resultados;
  }
}

new OabTJCE()
  .extrair('23468CE', '6fb6a87a9f0dbd915a12b0b6')
  .then((res) => console.log(res));
module.exports.OabTJCE = OabTJCE;

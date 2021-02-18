require('../bootstrap');
const cheerio = require('cheerio');
const { ExtratorBase } = require('./extratores');
const { Andamento } = require('../models');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Logger } = require('../lib/util');
const { Robo } = require('../lib/newRobo');
const parsers = require('../parsers');
const { TJCEParser } = require('../parsers/TJCEParser'); // Usando o parser antigo pq a pagina é completamente diferente
const sleep = require('await-sleep');

const proxy = false;

class ProcessoESAJ extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = null;
    this.robo = new Robo();
    this.logger = null;
    this.resposta = {};
    this.url = url;
    this.tentativa = 1;
    this.limite = 5;
  }

  /**
   * Extrai o processo e o salva no banco
   * @param {string} numeroProcesso
   * @param {string} numeroOab
   * @param {number} instancia
   * @param {Object} mensagem
   * @param {Object} execucaoAnterior
   * @return {Promise<*|{}>}
   */
  async extrair(
    numeroProcesso,
    numeroOab,
    instancia = 1,
    mensagem,
    execucaoAnterior = {}
  ) {
    this.numeroProcesso = numeroProcesso;
    this.mensagem = mensagem;

    this.resposta = { numeroProcesso: this.numeroProcesso };
    this.detalhes = this.dividirNumeroProcesso(this.numeroProcesso);
    this.resposta.execucaoAnterior = {
      cookies: '',
      captchaSettings: '',
    };
    this.setLogger();

    try {
      let objResponse;
      let resultado;
      let extracao;
      let paginaReturn;
      let erroCaptcha = false;

      await this.fazerPrimeiroAcesso();
      objResponse = await this.acessarPaginaConsulta(execucaoAnterior);

      let captchaExiste = this.verificaCaptcha(objResponse.responseBody);

      if (captchaExiste) {
        this.logger.info('Captcha detectado');
        do {
          let uuidCaptcha;
          let gResponse;

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
            uuidCaptcha = await this.getUuidCaptcha();
            gResponse = await this.resolverCaptcha();
          }

          this.captchaSettings = { uuidCaptcha, gResponse };

          objResponse = await this.acessandoPaginaProcesso(
            uuidCaptcha,
            gResponse
          );

          paginaReturn = this.avaliaPagina(objResponse.responseBody);

          if (paginaReturn.sucesso) {
            this.tentativa++;
            erroCaptcha = true;
            continue;
          }

          break;
        } while (this.tentativa === this.limite);
      }

      if (this.limite === this.tentativa)
        throw new Error('Limite de tentativas excedidos');

      let avaliacao = this.avaliaPagina(objResponse.responseBody);

      if (!avaliacao.sucesso) throw new Error(avaliacao.detalhes);

      extracao = this.parser.parse(objResponse.responseBody);

      this.logger.info('Processo de extração concluído.');
      this.logger.info('Iniciando salvamento de Andamento');
      await Andamento.salvarAndamentos(extracao.andamentos);
      this.logger.info('Andamentos salvos');

      this.logger.info('Iniciando salvamento do Processo');
      resultado = await extracao.processo.salvar();
      this.logger.info(
        `Processo: ${extracao.processo.detalhes.numeroProcessoMascara} salvo | Quantidade de andamentos: ${extracao.andamentos.length}`
      );

      this.resposta.resultado = resultado;
      this.resposta.sucesso = true;
    } catch (e) {
      console.log(e);
      this.logger.log('error', `${e}`);
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
   *
   * @param {String} tribunal
   * @return {Logger}
   */
  setLogger(tribunal) {
    this.logger = new Logger('info', `logs/${tribunal}/processo.js`, {
      nomeRobo: `Processo${tribunal}`,
      NumeroDoProcesso: this.numeroProcesso,
      NumeroOab: null,
    });
  }

  async fazerPrimeiroAcesso() {
    this.logger.info('Fazendo primeiro acesso');
    let options = { url: `${this.url}/open.do`, method: 'GET', proxy: true };

    return await this.robo.acessar(options);
  }

  async acessarPaginaConsulta(execucaoAnterior) {
    let cookies;

    if (Object.keys(execucaoAnterior).length && execucaoAnterior.cookies)
      cookies = execucaoAnterior.cookies;

    this.logger.info('Entrando na pagina de consulta');

    if (cookies && Object.keys(cookies).length) this.robo.cookies = cookies;

    let options = {
      url: `${this.url}/search.do`,
      method: 'GET',
      queryString: {
        conversationId: '',
        cbPesquisa: 'NUMPROC',
        'dadosConsulta.tipoNuProcesso': 'UNIFICADO',
        numeroDigitoAnoUnificado: `${this.detalhes.sequencial}-${this.detalhes.digito}.${this.detalhes.ano}`,
        foroNumeroUnificado: this.detalhes.comarca,
        'dadosConsulta.valorConsultaNuUnificado': this.numeroProcesso,
        'dadosConsulta.valorConsulta': '',
      },
      proxy: true,
      encoding: 'utf8',
    };

    return this.robo.acessar(options);
  }

  async consultarUUID() {
    this.logger.info('Consultando UUID do site');
    let objResponse;

    let options = {
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      proxy: true,
    };

    objResponse = await this.robo.acessar(options);

    return objResponse.responseBody.uuidCaptcha;
  }

  /**
   * Recebe o captcha e o resolve, retorna string com o catpcha resolvido
   * @returns {Promise<String>}
   */
  async resolverCaptcha() {
    const ch = new CaptchaHandler(5, 10000, this.constructor.name, {
      numeroDoProcesso: this.detalhes.numeroProcessoMascara,
      numeroDaOab: null,
    });

    this.logger.info('Tentando resolver captcha');
    /**
     *
     * @type {{gResponse: string, body: {}, sucesso: boolean, detalhes: []} | void}
     */
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
   * Recebe o uuid e a resposta do captcha e realiza a consulta do processo
   * @param uuid
   * @param gResponse
   * @returns {Promise<{Object}>}
   */
  async acessandoPaginaProcesso(uuid, gResponse) {
    this.logger.info('Tentando acessar pagina do processo');

    let options = {
      url: `${this.url}/search.do`,
      method: 'GET',
      queryString: {
        conversationId: '',
        cbPesquisa: 'NUMPROC',
        'dadosConsulta.tipoNuProcesso': 'UNIFICADO',
        numeroDigitoAnoUnificado: `${this.detalhes.sequencial}-${this.detalhes.digito}.${this.detalhes.ano}`,
        foroNumeroUnificado: this.detalhes.comarca,
        'dadosConsulta.valorConsultaNuUnificado': this.numeroProcesso,
        'dadosConsulta.valorConsulta': '',
        uuidCaptcha: uuid,
        'g-recaptcha-response': gResponse,
      },
      proxy: proxy,
      encoding: 'utf8',
    };

    return await this.robo.acessar(options);
  }

  avaliaPagina(body) {
    this.logger.info('Avaliando a pagina para detectar presença de erros');

    const $ = cheerio.load(body);
    const mensagemRetornoSelector = '#mensagemRetorno';
    let mensagemRetornoText = $(mensagemRetornoSelector).text();
    const tabelaMovimentacoesSelector = '#tabelaTodasMovimentacoes'; //TODO checar selector
    const senhaProcessoSelector = '#senhaProcesso'; //TODO checar selector

    let regex = /Não\sexistem\sinformações\sdisponíveis\spara\sos\sparâmetros\sinformados/;

    if (regex.test(mensagemRetornoText)) {
      this.logger.info(
        'Não existem informações disponíveis para o processo informado.'
      );
      throw new Error('Não encontrados');
    }

    if (
      $(senhaProcessoSelector).length &&
      $(tabelaMovimentacoesSelector).length === 0
    ) {
      this.logger.info(
        'Se for uma parte ou interessado, digite a senha do processo'
      );
      throw new Error('Senha necessaria');
    }

    if ($(tabelaMovimentacoesSelector).length === 0) {
      this.logger.info('Não foi encontrada a tabela de movimentação');
      return {
        sucesso: false,
        causa: 'Erro de acesso',
        detalhes: 'Não foi encontrada a tabela de movimentações',
      };
    }

    this.logger.info('Não foram encontrados erros');
    return { sucesso: true };
  }

  verificaCaptcha(body) {
    const $ = cheerio.load(body);

    let captcha = $('.g-recaptcha').length;

    return Boolean(captcha);
  }

  async getUuidCaptcha() {
    let objResponse;

    await sleep(200);
    objResponse = await this.robo.acessar({
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      proxy: true,
    });

    return objResponse.responseBody.uuidCaptcha;
  }
}

class ProcessoTJMS extends ProcessoESAJ {
  constructor() {
    super('https://esaj.tjms.jus.br/cpopg5', false);
    this.parser = new parsers.TJMSParser();
  }

  setLogger(tribunal = '') {
    super.setLogger('TJMS');
  }
}

class ProcessoTJSP extends ProcessoESAJ {
  constructor() {
    super('https://esaj.tjsp.jus.br/cpopg', false);
    this.parser = new parsers.TJSPParser();
    this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
  }

  setLogger(tribunal = '') {
    super.setLogger('TJSP');
  }
}

class ProcessoTJSC extends ProcessoESAJ {
  constructor() {
    super('https://esaj.tjsc.jus.br/cpopg', false);
    this.parser = new parsers.TJSCParser();
    this.dataSiteKey = '6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL';
  }

  setLogger(tribunal) {
    super.setLogger('TJSC');
  }
}

class ProcessoTJCE extends ProcessoESAJ {
  constructor() {
    super('http://esaj.tjce.jus.br/cpopg', false);
    this.dataSiteKey = '6LeME0QUAAAAAPy7yj7hh7kKDLjuIc6P1Vs96wW3';
    this.parser = new TJCEParser(); // TODO quando o site mudar (provavelmente em breve) aplicar o novo parser
  }

  setLogger(tribunal) {
    super.setLogger('TJCE');
  }
}

module.exports = {
  ProcessoTJMS,
  ProcessoTJSP,
  ProcessoTJSC,
  ProcessoTJCE,
};

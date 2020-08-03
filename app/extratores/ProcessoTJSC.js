const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const { Logger } = require('../lib/util');
const { Robo } = require('../lib/robo');

const {
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJSCParser } = require('../parsers/TJSCParser');

const INSTANCIAS_URLS = require('../assets/TJSC/instancias_urls.json')
  .INSTANCIAS_URL;

class ProcessoTJSC extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJSCParser();
    this.robo = new Robo();
    this.dataSiteKey = '6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL';
    this.logger = null;
    this.numeroDoProcesso = '';
  }

  setInstanciaUrl(instancia) {
    this.url = INSTANCIAS_URLS[instancia - 1];
  }

  /**
   *
   * @param {String} numeroDoProcesso o numero do processo
   * @param {String} numeroDaOab indica que a extração teve inicio com uma oab
   * @param {Number} instancia instancia da pesquisa do processo
   * @returns {Promise<{sucesso: boolean, logs: [], numeroDoProcesso: string}|{sucesso: boolean, logs: [], numeroDoProcesso: string, detalhes: ("undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint")}|{resultado: (void|*|{numeroProcesso: *, temAndamentosNovos: *, qtdAndamentosNovos: *}|{numeroProcesso: *, temAndamentosNovos: *, qtdAndamentosNovos}), sucesso: boolean, logs: [], numeroDoProcesso: string, detalhes: string}>}
   */
  async extrair(numeroDoProcesso, numeroDaOab = '', instancia = 1) {
    const nomeRobo = 'ProcessoTJSC';
    this.numeroDaOab = numeroDaOab;
    this.numeroDoProcesso = numeroDoProcesso;
    this.detalhes = Processo.identificarDetalhes(numeroDoProcesso);
    this.instancia = Number(instancia);
    this.setInstanciaUrl(this.instancia);

    this.logger = new Logger('info', `logs/${nomeRobo}/${nomeRobo}Info.log`, {
      nomeRobo: 'processo.TJSC',
      NumeroDoProcesso: numeroDoProcesso,
    });

    let resultado;
    let uuidCaptcha;
    let gResponse;
    let cookies;
    let objResponse;
    let url = '';
    let headers = {
      Host: 'esaj.tjsc.jus.br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-User': '?1',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      Referer: `${this.url}/search.do`,
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    };
    let tentativas = 0;
    let extracao;
    let limite = 5;

    try {
      this.logger.info('Fazendo primeira conexão.');

      url = `${
        this.url
      }/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${this.detalhes.numeroProcessoMascara.slice(
        0,
        15
      )}&foroNumeroUnificado=${this.detalhes.origem}&dePesquisaNuUnificado=${
        this.detalhes.numeroProcessoMascara
      }&dePesquisaNuUnificado=UNIFICADO&dePesquisa=&tipoNuProcesso=UNIFICADO`;

      console.log('PRE URL', url);

      objResponse = await this.robo.acessar({
        url: url,
        usaProxy: true,
      });
      this.logger.info('Conexão ao website concluido.');
      cookies = objResponse.cookies;
      cookies = cookies.map((element) => {
        return element.replace(/;.*/, '');
      });
      cookies = cookies.join('; ');
      headers['Cookie'] = cookies;

      this.logger.info('Consultando uuid.');
      uuidCaptcha = await this.getCaptchaUuid(cookies);
      this.logger.info('Uuid recuperado.');

      do {
        this.logger.info('Preparando para resolver captcha');
        gResponse = await this.getCaptcha();
        this.logger.info('Captcha resolvido');

        this.logger.info('Preparando para acessar site do processo.');

        if (this.instancia === 1) {
          url = `${this.url}/show.do?processo.codigo=2B0000W8N0000&processo.foro=${this.detalhes.origem}&processo.numero=${this.detalhes.numeroProcessoMascara}&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;
        } else {
          url = `${
            this.url
          }/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&numeroDigitoAnoUnificado=${this.detalhes.numeroProcessoMascara.slice(
            0,
            15
          )}&foroNumeroUnificado=${
            this.detalhes.origem
          }&dePesquisaNuUnificado=${
            this.detalhes.numeroProcessoMascara
          }&dePesquisaNuUnificado=UNIFICADO&dePesquisa=&tipoNuProcesso=UNIFICADO&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;
        }

        console.log(url);
        console.log(cookies);

        this.logger.info(`Acessando o site. [Tentativa: ${tentativas + 1}]`);
        objResponse = await this.robo.acessar({
          url: url,
          method: 'GET',
          encoding: 'latin1',
          headers: headers,
          usaProxy: true,
        });
        const $ = cheerio.load(objResponse.responseBody);
        // verifica se há uma tabela de movimentação dentro da pagina.
        if ($('#tabelaTodasMovimentacoes').length === 0) {
          this.logger.info(
            `Não foi possivel acessar a pagina do processo [Tentativas: ${
              tentativas + 1
            }]`
          );
          tentativas = tentativas++;
        } else {
          this.logger.info(
            `Pagina capturada com sucesso. [Tentativas: ${tentativas + 1}]`
          );
          this.logger.info('Iniciando processo de extração.');
          extracao = await this.parser.parse(objResponse.responseBody, this.instancia);
          this.logger.info('Processo de extração concluído.');
          this.logger.info('Iniciando salvamento de Andamento');
          await Andamento.salvarAndamentos(extracao.andamentos);
          this.logger.info('Andamentos salvos');

          this.logger.info('Iniciando salvamento do Processo');
          resultado = await extracao.processo.salvar();
          this.logger.info(
            `Processo: ${this.numeroDoProcesso} salvo | Quantidade de andamentos: ${extracao.andamentos.length}`
          );

          return {
            sucesso: true,
            numeroDoProcesso: this.numeroDoProcesso,
            resultado: resultado,
            detalhes: '',
            logs: this.logger.logs,
          };
        }
      } while (tentativas < limite);
      this.logger.info(`Tentativas de conexão excederam ${limite} tentativas.`);
      return {
        sucesso: false,
        numeroDoProcesso: this.numeroDoProcesso,
        logs: this.logger.logs,
      };
    } catch (err) {
      this.logger.log('error', err);
      return {
        sucesso: false,
        numeroDoProcesso: this.numeroDoProcesso,
        detalhes: typeof err,
        logs: this.logger.logs,
      };
    }
  }

  async getCaptchaUuid(cookies) {
    let objResponse;
    objResponse = await this.robo.acessar({
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      encoding: 'latin1',
      usaProxy: true,
      headers: {
        Cookie: cookies,
      },
    });
    return objResponse.responseBody.uuidCaptcha;
  }

  async getCaptcha() {
    const captchaHandler = new CaptchaHandler(5, 5000, 'ProcessoTJSC', {
      numeroDoProcesso: this.numeroDoProcesso,
    });
    let captcha;
    captcha = await captchaHandler
      .resolveRecaptchaV2(
        // captcha = await antiCaptchaHandler(
        `${this.url}/open.do`,
        this.dataSiteKey,
        '/'
      )
      .catch((error) => {
        throw error;
      });

    if (!captcha.sucesso) {
      throw new AntiCaptchaResponseException(
        'Falha na resposta',
        'Nao foi possivel recuperar a resposta para o captcha'
      );
    }

    return captcha.gResponse;
  }
}

module.exports.ProcessoTJSC = ProcessoTJSC;

const cheerio = require("cheerio");
const moment = require("moment");
const re = require("xregexp");
const { antiCaptchaHandler } = require("../lib/captchaHandler");
const { Processo } = require("../models/schemas/processo");
const { Andamento } = require("../models/schemas/andamento");
const { Logger } = require("../lib/util");
const { enums } = require("../configs/enums");
const { Robo } = require('../lib/robo');

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
  CaptchaIOException
} = require("../models/exception/exception");
const { ExtratorBase } = require("./extratores");
const { TJSPParser } = require('../parsers/TJSPParser');

function adicionarMascara(numero) {
  return numero;
}

class ProcessoTJSP extends ExtratorBase {
  constructor(numeroDoProcesso, numeroDaOab = '', oabExtratorParam) {
    super();
    this.parser = new TJSPParser();
    this.robo = new Robo();
    this.dataSiteKey = "6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft";
    this.logger = null;
    this.oabExtratorParam = oabExtratorParam;
    this.numeroDoProcesso = numeroDoProcesso;
    this.detalhes = Processo.identificarDetalhes(numeroDoProcesso);

    let nomeRobo = `${enums.tipoConsulta.Processo}${enums.nomesRobos.TJSP}`;
    if (numeroDaOab) {
      nomeRobo = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJSP}`
    }
    this.numeroDaOab = numeroDaOab;
    this.logger = new Logger(
      "info",
      `logs/${nomeRobo}/${nomeRobo}Info.log`,
      {
        nomeRobo: nomeRobo,
        NumeroDoProcesso: numeroDoProcesso
      }
    );
  }

  /**
   *
   * @param {String} numeroDoProcesso o numero do processo
   * @param {String} numeroDaOab indica que a extração teve inicio com uma oab
   * @returns {Promise<{sucesso: boolean, logs: [], numeroDoProcesso: string}|{sucesso: boolean, logs: [], numeroDoProcesso: string, detalhes: ("undefined"|"object"|"boolean"|"number"|"string"|"function"|"symbol"|"bigint")}|{resultado: (void|*|{numeroProcesso: *, temAndamentosNovos: *, qtdAndamentosNovos: *}|{numeroProcesso: *, temAndamentosNovos: *, qtdAndamentosNovos}), sucesso: boolean, logs: [], numeroDoProcesso: string, detalhes: string}>}
   */
  async extrair() {

    let resultado;
    let preParse;
    let uuidCaptcha;
    let gResponse;
    let cookies;
    let objResponse;
    let url;
    let headers = {
      Host: "esaj.tjsp.jus.br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-User": "?1",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "navigate",
      Referer: "https://esaj.tjsp.jus.br/cpopg/search.do",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7"
    };
    let tentativas = 0;
    let extracao;
    let limite = 5;

    try {
      //TODO uuidCaptcha

      do {
        if (this.oabExtratorParam) { // se vier parametros do oabTJSP n
          cookies = this.oabExtratorParam.cookies;
          uuidCaptcha = this.oabExtratorParam.uuidCaptcha;
          gResponse = this.oabExtratorParam.gResponse;
        } else {
          this.logger.info("Fazendo primeira conexão.");
          objResponse = await this.robo.acessar({ url: `https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo=2B0000W8N0000&processo.foro=83&processo.numero=${this.detalhes.numeroProcessoMascara}` });
          this.logger.info("Conexão ao website concluido.");
          cookies = objResponse.cookies;
          cookies = cookies.map((element) => {
            return element.replace(/\;.*/, "");
          });
          cookies = cookies.join("; ");

          this.logger.info("Consultando uuid.");
          uuidCaptcha = await this.getCaptchaUuid(cookies);
          this.logger.info("Uuid recuperado.");

          this.logger.info("Preparando para resolver captcha");
          gResponse = await this.getCaptcha();
          this.logger.info("Captcha resolvido");

          this.logger.info("Preparando para acessar site do processo.");
        }

        headers["Cookie"] = cookies;
        url = `https://esaj.tjsp.jus.br/cpopg/show.do?processo.codigo=2B0000W8N0000&processo.foro=${this.detalhes.origem}&processo.numero=${this.detalhes.numeroProcessoMascara}&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`
        this.logger.info(`Acessando o site. [Tentativa: ${tentativas + 1}]`);
        objResponse = await this.robo.acessar({
          url: url,
          method: "GET",
          encoding: "latin1",
          headers: headers
        });
        const $ = cheerio.load(objResponse.responseBody);
        // verifica se há uma tabela de movimentação dentro da pagina.
        if ($("#tabelaTodasMovimentacoes").length == 0) {
          this.logger.info(`Não foi possivel acessar a pagina do processo [Tentativas: ${tentativas + 1}]`);
          gResponse = await this.getCaptcha();
          tentativas = tentativas++;
        } else {
          this.logger.info(`Pagina capturada com sucesso. [Tentativas: ${tentativas + 1}]`);
          this.logger.info("Iniciando processo de extração.");
          extracao = await this.parser.parse(objResponse.body);
          this.logger.info("Processo de extração concluído.");

          this.logger.info("Iniciando salvamento de Andamento");
          await Andamento.salvarAndamentos(extracao.andamentos);
          this.logger.info("Andamentos salvos");

          this.logger.info("Iniciando salvamento do Processo");
          resultado = await extracao.processo.salvar();
          this.logger.info(
            `Processo: ${
              this.numeroDoProcesso
            } salvo | Quantidade de andamentos: ${extracao.andamentos.length}`
          );

          return { sucesso: true, numeroDoProcesso: this.numeroDoProcesso, resultado: resultado, detalhes: '', logs: this.logger.logs };
        }
      } while (tentativas < limite);
      this.logger.info(`Tentativas de conexão excederam ${limite} tentativas.`);
      return { sucesso: false, numeroDoProcesso: this.numeroDoProcesso, logs:this.logger.logs };
    } catch (err) {
      this.logger.log('error', err);

      return { sucesso: false, numeroDoProcesso: this.numeroDoProcesso, detalhes: typeof(err), logs: this.logger.logs }
    }
  }

  async getCaptchaUuid(cookies) {
    let objResponse = {};
    objResponse = await this.robo.acessar({
      url: 'https://esaj.tjsp.jus.br/cpopg/captchaControleAcesso.do',
      method: 'POST',
      encoding: 'latin1',
      usaProxy: false,
      headers: {
        Cookie: cookies
      }
    });
    let uuid = objResponse.responseBody.uuidCaptcha;
    return uuid;
  }

  async getCaptcha() {
    let captchaResponse;
    let resposta;

    try {

      captchaResponse = await captchaIOhandler(
        this.website = 'https://esaj.tjsp.jus.br/cpopg/open.do',
        this.dataSiteKey,
        '/'
      );

      if (!captchaResponse) {
        throw new CaptchaIOException('Falha na resposta', 'Não foi possivel recuperar o captcha');
      }

      this.logger.info('Captcha recuperado com sucesso.');
      resposta = { sucesso: true, captchaResponse: captchaResponse }
    } catch(e) {
      this.logger.log('Falha ao recuperar o captcha', e);
      resposta = { sucesso: false }
    } finally {
      return resposta;
    }
  }
}

module.exports.ProcessoTJSP = ProcessoTJSP;
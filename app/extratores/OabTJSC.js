const cheerio = require("cheerio");
const moment = require("moment");
const { antiCaptchaHandler } = require("../lib/captchaHandler");
const { Processo } = require("../models/schemas/processo");
const { Andamento } = require("../models/schemas/andamento");
const re = require("xregexp");

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException
} = require("../models/exception/exception");
const { ExtratorBase } = require("./extratores");
// const { TJSCParser } = require('../parsers/TJSCParser');

class OabTJSC extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    // this.parser = new TJSCParser();
    this.dataSiteKey = "6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL";
    this.numeroOab = "";
    this.logger = null;
  }

  async extrair(numeroOab) {
    try {
      this.numeroOab = numeroOab;
      let preParse = {};
      let resultado = [];
      let objResponse;
      let cookies;
      let uuidCaptcha;
      let gResponse;
      let listaProcessos = [];

      this.logger = new Logger("info", "logs/TJSC/TJSCInfo.log", {
        nomeRobo: enums.nomesRobos.TJBAPortal,
        NumeroOab: numeroOab
      });

      this.logger.info("Fazendo primeira conexão ao website.");
      objResponse = await this.robo.acessar({
        url: this.url,
        method: "GET",
        encoding: "latin1",
        usaProxy: false
      });
      this.logger.info("Conexão ao website concluida.");

      this.logger.info("Preparando resolução do captcha");
      cookies = objResponse.cookies;
      preParse = await this.preParse(objResponse.responseBody, cookies);
      uuidCaptcha = preParse.captcha.uuidCaptcha;
      this.logger.info("Preparação de resolução do captcha concluida");

      this.logger.info("Iniciando processo de resolução do captcha");
      gResponse = await this.getCaptcha();
      this.logger.info("Processo de resolução do captcha concluido");

      this.logger.info("Iniciando recuperação dos processos");
      listaProcessos = await this.getListaProcessos(
        cookies,
        uuidCaptcha,
        gResponse
      );
      this.logger.info("Processos recuperados");
    } catch (e) {
      this.logger.log("error", e);
      if (e instanceof RequestException) {
        throw new RequestException(e.code, e.status, e.message);
      } else if (e instanceof BaseException) {
        throw new BaseException(e.code, e.message);
      } else if (e instanceof ExtracaoException) {
        if (/ERRO_CAPTCHA/.test(e.code)) {
          //refaz tentativas de captcha (deixar aqui mas portal tjba n usa captcha por enquanto)
          throw new ExtracaoException(e.code, null, e.message);
        } else {
          throw new BaseException(e.code, e.message);
        }
      } else {
        if (
          /ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ENOPROTOOPT/.test(e.code)
        ) {
          throw new RequestException(e.code, e.status, e.message);
        } else {
          throw e;
        }
      }
    }
  }

  async preParse(content, cookies) {
    const $ = cheerio.load(content);
    let preParse = {
      captcha: {
        hasCaptcha: false,
        uuidCaptcha: ""
      }
    };

    preParse.captcha.hasCaptcha = $(".g-response");
    preParse.captcha.uuidCaptcha = await this.getCaptchaUuid(cookies);

    return preParse;
  }

  async getCaptchaUuid(cookies) {
    let objResponse;

    objResponse = await this.robo.acessar({
      url: "https://esaj.tjsc.jus.br/cposgtj/captchaControleAcesso.do",
      method: "POST",
      encoding: "latin1",
      headers: { Cookie: cookies }
    });

    return objResponse.responseBody.uuid; // TODO verificar se é necessário transformar isso em json primeiro
  }

  async getCaptcha() {
    let response;

    response = await antiCaptchaHandler(this.url, this.dataSiteKey, "/");

    if (!response) {
      throw new AntiCaptchaResponseException(
        "CAPTCHA",
        "Nao foi possivel recuperar a resposta para o captcha"
      );
    }

    return response;
  }

  async getListaProcessos(cookies, uuidCaptcha, gResponse) {
    let condition = false;
    let processos = [];
    let url =(
      this.url +
      `?conversationId=` +
      `&paginaConsultada=0` +
      `&cbPesquisa=NUMOAB` +
      `&dePesquisa=${this.numeroOab}` +
      `&uuidCaptcha=${uuidCaptcha}` +
      `&g-captcha-response=${gResponse}`;
    )

    do {
      let objResponse = this.robo.acessar({
        url: url,
        method: "GET",
        encoding: "latin1",
        usaProxy: false,
        headers: { Cookies: cookies }
      });

      const $ = cheerio.load(objResponse.responseBody);

      try {
        processos: [...processos, this.extrairLinkProcessos($)];
        const proximaPagina = $("a[title='Próxima página']").attr("href");

        if (proximaPagina == null) return processos;

        condition = true;
        url = this.url +'?'+ proximaPagina
      } catch (e) {
        this.logger.info('Erro ao tentar adquirir a lista de processos');
      }
    } while (condition);
  }
}

module.exports.OabTJSC = OabTJSC;

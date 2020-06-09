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
    // TODO remover declaracao abaixo e descomentar uso do parser
    this.parser = () => ({ processo: {}, listaAndamento: [] });
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

      this.logger.info("Iniciando recuperação da lista de processos");
      listaProcessos = await this.getListaProcessos(
        cookies,
        uuidCaptcha,
        gResponse
      );
      this.logger.info("Lista de processos recuperada");

      if (listaProcessos.length > 0) {
        this.logger.info(
          "Iniciando recuperação de processos a partir da lista"
        );
        resultado = this.processarListaProcessos(listaProcessos, cookies);
        return Promise.all(resultado).then((args) => {
          this.logger.info("Processos recupeados.");
          return {
            resultado: args,
            sucesso: true,
            detalhes: "",
            logs: this.logger.logs
          };
        });
      }

      this.logger.info("Lista de processo vazia");
      return {
        resultado: [],
        sucesso: false,
        detalhes: "Lista de processo vazia",
        logs: this.logger.logs
      };
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

  /**
   * Verifica a existencia de captchas e recupera o uuid caso exista
   * @param {string} content Pagina recuperada pelo robo para ser usada com o cheerio
   * @param {array} cookies Cookies da pagina
   * @returns {Promise<{captcha: {hasCaptcha: boolean, uuidCaptcha: string}}>}
   */
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

  /**
   * Recupera o uuid por meio de requisição a pagina de controle de acesso
   * @param {array} cookies Cookies da pagina
   * @returns {Promise<string>}
   */
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

  /**
   * Captura o captcha por uso do AntiCaptcha
   * @returns {Promise<string>}
   */
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

  /**
   * Retorna lista com os links dos processos
   * @param {array} cookies Cookies da pagina
   * @param {string} uuidCaptcha Codigio de identificação da sessao (?)
   * @param {string} gResponse resposta do captcha
   * @returns {Promise<[string]>}
   */
  async getListaProcessos(cookies, uuidCaptcha, gResponse) {
    let condition = false;
    let processos = [];
    let url =
      this.url +
      `?conversationId=` +
      `&paginaConsultada=0` +
      `&cbPesquisa=NUMOAB` +
      `&dePesquisa=${this.numeroOab}` +
      `&uuidCaptcha=${uuidCaptcha}` +
      `&g-captcha-response=${gResponse}`;

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
        const proximaPagina = $('a[title|="Próxima página"]').first();

        if (!proximaPagina.text()) return processos;

        condition = true;
        url = this.url + "?" + proximaPagina.attr("href");
      } catch (e) {
        this.logger.info("Erro ao tentar adquirir a lista de processos");
      }
    } while (condition);
  }

  /**
   * Extrai da lista de processos os processos
   * @param {array} listaProcessos
   * @param {string} cookies
   * @returns {Promise<[Object]>}
   */
  async processarListaProcessos(listaProcessos, cookies) {
    let resultado;

    // FIXME delimitador para checar o gasto de captcha
    // TODO remover
    listaProcessos = listaProcessos.slice(0, 5);

    resultados = listaProcessos.map(async (element) => {
      let extracao;
      let processo;
      let andamentos;
      let resultado;

      let body = await this.extrairProcesso(element, cookie);

      if (body) {
        extracao = await this.parser.parse(body);
        processo = extracao.processo;
        andamentos = extracao.andamentos;

        await Andamento.salvarAndamentos(andamentos);
        resultado = await processo.salvar();
        logger.info(
          `Processo: ${
            processo.toObject().detalhes.numeroProcesso
          } salvo | Quantidade de andamentos: ${andamentos.length}`
        );
        return Promise.resolve(resultado);
      } else {
        return Promise.resolve(false);
      }
    });
    return Promise.all(resultados).then((args) => {
      this.logger(
        `Extração de ${args.filter(Boolean).length} processos feito com sucesso`
      );
      return args.filter(Boolean);
    });
  }

  async extrairProcesso(urlProcesso, cookies) {
    let objResponse;

    objResponse = await this.robo.acessar({
      url: urlProcesso,
      method: "GET",
      encoding: "latin1",
      usaProxy: false,
      usaJson: false,
      headers: { Cookie: cookies },
      randomUserAgent: false
    });

    return objResponse.responseBody;
  }
}

module.exports.OabTJSC = OabTJSC;

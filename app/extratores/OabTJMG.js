const cheerio = require("cheerio");
const moment = require("moment");
const re = require("xregexp");
const { Helper } = require("../lib/util");
const { audioCaptchaHandler } = require("../lib/captchaHandler");
const { Processo } = require("../models/schemas/processo");
const { Andamento } = require("../models/schemas/andamento");
const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException
} = require("../models/exception/exception");
const { ExtratorBase } = require("./extratores");
const { TJMGParser } = require("../parsers/TJMGParser");

class OabTJMG extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJMGParser();
  }

  async validarCaptcha(numeroDaOab, tipoDaOab, comarcaCode, headers) {
    const newHeader = {... headers};
    const code = Math.random() * 5; // Pagina obriga a gerar um codigo aleatorio.

    const image = await Helper.downloadImage(`https://www4.tjmg.jus.br/juridico/sf/captcha.svl?${code}`, headers);
    let audio = await Helper.downloadAudio(
      "https://www4.tjmg.jus.br/juridico/sf/captchaAudio.svl",
      headers
    );

    let resCaptcha = await audioCaptchaHandler(audio);
    let objResponse = await this.robo.acessar({
      url: "https://www4.tjmg.jus.br/juridico/sf/dwr/call/plaincall/ValidacaoCaptchaAction.isCaptchaValid.dwr",
      method: "post",
      headers: headers,
      usaJson: true,
      params: (
        'callCount=1\n'+
        'nextReverseAjaxIndex=0\n'+
        'c0-scriptName=ValidacaoCaptchaAction\n'+
        'c0-methodName=isCaptchaValid\n'+
        'c0-id=0\n'+
        `c0-param0=string:${numeroDaOab}\n`+
        'batchId=0\n'+
        'instanceId=0\n'+
        `page=%2Fjuridico%2Fsf%2Fproc_resultado_oab.jsp%3FnomeAdvogado%3D%26codigoOAB%3D${numeroDaOab}%26tipoOAB%3DN${tipoDaOab}%26ufOAB%3DMG%26tipoConsulta%3D1%26natureza%3D1%26ativoBaixado%3DA%26dataAudienciaFinal%3D%26comrCodigo%3D${comarcaCode}%26numero%3D1
        scriptSessionId=d~NEt8Pq~dOa9XRdr9i!ol9bxvGKBGGwdbn/FIGwdbn-a8Iumyre2`
      )
    });

    return Promise.resolve(true);
  }

  /**
   * Acessa individualmente os dados daquela comarca
   * @param {String} numeroOab
   * @param {String} tipoOab
   * @param {String} comarcaCode
   * @param {Object} cookies
   * @returns {Promise<[String]>}
   */
  async acessarComarca(numeroOab, tipoOab, comarcaCode, cookies) {
    const headers = {
      Host: " www4.tjmg.jus.br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "navigate",
      Referer: `https://www4.tjmg.jus.br/juridico/sf/proc_oab.jsp?comrCodigo=00${comarcaCode}&cbo_nome_comarca=${comarcaCode}&numero=1`,
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,la;q=0.6",
      Cookie: cookies
    };

    // acessa a comarca
    let objResponse = await this.robo.acessar({
      url: `https://www4.tjmg.jus.br/juridico/sf/proc_resultado_oab.jsp?nomeAdvogado=&codigoOAB=${numeroOab}&tipoOAB=${tipoOab}&ufOAB=MG&tipoConsulta=1&natureza=0&ativoBaixado=X&dataAudienciaFinal=&comrCodigo=${comarcaCode}&numero=1`,
      mothod: "GET",
      encoding: "latin1",
      usaProxy: false,
      usaJson: false,
      params: null,
      headers: headers
    });

    // Resolve captcha por audio da comarca
    await this.validarCaptcha(numeroOab, tipoOab, comarcaCode, headers);

    objResponse = await this.robo.acessar({
      url: `https://www4.tjmg.jus.br/juridico/sf/proc_resultado_oab.jsp?nomeAdvogado=&codigoOAB=${numeroOab}&tipoOAB=${tipoOab}&ufOAB=MG&tipoConsulta=1&natureza=0&ativoBaixado=X&dataAudienciaFinal=&comrCodigo=${comarcaCode}&numero=1`,
      mothod: "GET",
      encoding: "latin1",
      usaProxy: false,
      usaJson: false,
      params: null,
      headers: headers
    });

    return; // TODO fazer chamadas para o sites com as comarcas
  }

  async extrair(numeroDaOab) {
    const tipo = numeroDaOab[numeroDaOab.length - 1];
    numeroDaOab = numeroDaOab.slice(0, numeroDaOab.length - 1);
    try {
      // TODO tratar oab separando numero da letra
      const resultados = [];
      const preParse = {};
      let cookies = {};

      let objResponse = {};

      // Primeira parte: pegar cookies e ids de sessao
      objResponse = await this.robo.acessar({
        url: this.url,
        method: "GET",
        encoding: "latin1",
        usaProxy: false,
        usaJson: false,
        params: null
      });
      console.log("finalizado request");
      cookies = objResponse.cookies;
      cookies = cookies.map((element) => {
        return element.replace(/\;.*/, "");
      });
      cookies = cookies.join("; ");

      // Segunda parte, realizar um forloop dentro de todas as comarcas
      const $ = cheerio.load(objResponse.responseBody);
      let comarcasDisponiveis = $("#cbo_nome_comarca")
        .children()
        .map((index, element) => element.attribs.value);
      if (comarcasDisponiveis.length === 0) {
        throw Error("Não foi possivel encontrar as comarcas disponiveis");
      }
      comarcasDisponiveis = comarcasDisponiveis.filter(Number);
      const promessas = comarcasDisponiveis.map((comarcaCode) => {
      });
      await this.acessarComarca(numeroDaOab, tipo, "24", cookies); // teste com a comarca de Belo Horizonte

      return {
        resultado: [],
        sucesso: false,
        detalhes: "Lista de processos vazia"
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports.OabTJMG = OabTJMG;

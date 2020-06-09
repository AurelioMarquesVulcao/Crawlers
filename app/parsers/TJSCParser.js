const cheerio = require("cheerio");
const moment = require("moment");
const re = require("xregexp");

const { BaseParser, removerAcentos, tradutor } = require("./BaseParser");
const { Processo } = require("../models/schemas/processo");
const { Andamento } = require("../models/schemas/andamento");

class TJSCParser extends BaseParser {
  constructor() {
    super();
  }

  /**
   * Recupera da pagina HTML os dados do processo
   * @param {string} content html da pagina
   * @returns {{processo: Processo, andamentos: [Andamento]}}
   */
  parse(content) {
    const $ = cheerio.load(content);
    const dataAtual = moment().format("YYYY-MM-DD");

    const capa = this.extrairCapa($);
    const detalhes = this.extrairDetalhes($);
    const envolvidos = this.extrairEnvolvidos($);

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: [],
      qtdAndamentos: 0,
      origemExtracao: "OabTJSP"
    });

    return {
      processo: processo,
      andamentos: "andamentos"
    };
  }

  // EXTRACAO DE CAPAS
  extrairCapa($) {
    let capa = {};

    capa["uf"] = "SC";
    capa["comarca"] = this.extrairComarca($);
    capa["assunto"] = this.extrairAssunto($);
    capa["classe"] = this.extrairClasse($);

    return capa;
  }

  extrairComarca($) {
    let comarca;

    comarca = removerAcentos(
      $(
        "body > div.div-conteudo.container.unj-mb-40 > table:nth-child(12) > tbody > tr > td:nth-child(2)"
      )
        .text()
        .strip()
    );

    return comarca;
  }

  extrairAssunto($) {
    let assuntos = [];

    assuntos.push(
      removerAcentos(
        $(
          "body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div.col-md-4 > div"
        )
          .text()
          .strip()
      )
    );

    return assuntos;
  }

  extrairClasse($) {
    let classe;

    classe = removerAcentos(
      $(
        "body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div:nth-child(1) > div"
      )
        .text()
        .strip()
    );

    return classe;
  }

  extrairDetalhes($) {
    let numeroProcesso;
    let detalhes;

    numeroProcesso = $(
      "body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(1) > div > span.unj-larger-1"
    )
      .text()
      .strip();

    detalhes = Processo.identificarDetalhes(numeroProcesso);

    return detalhes;
  }

  extrairEnvolvidos($) {
    let envolvidos = [];
    const tableSelector = $("#tablePartesPrincipais > tbody");

    let tableEnvolvidos = $(tableSelector);

    return envolvidos;
  }
}

module.exports.TJSCParser = TJSCParser;

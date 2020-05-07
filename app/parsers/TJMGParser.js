const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');

const { BaseParser, removerAcentos, tradutor } = require('./BaseParser');

const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJMGParser extends BaseParser {
  constructor() {
    super();
  }

  parse(content) {
    let rawProcesso = cheerio.load(content.processo);
    let rawAndamentos = cheerio.load(content.andamentos);

    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa(content);
    const detalhes = this.extrairDetalhes(content);
    const envolvidos = this.extrairEnvolvidos(content);
    const oabs = this.extrairOabs(envolvidos);
    const status = this.extrairStatus(content);
    const andamentos = this.extrairAndamentos(
      content,
      dataAtual,
      detalhes.numeroProcesso
    );

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'OabTJMG',
    });

    return {
      processo: processo,
      andamentos: andamentos,
    };
  }
}

module.exports.TJMGParser = TJMGParser;

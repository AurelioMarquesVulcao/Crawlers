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

  extrairComarca($) {
    let comarca = $('h1').text();
    comarca = re.exec(comarca, re(/Comarca d. (\w+\s*\w*) - .*/));
    return comarca[1];
  }

  extrairAssunto($) {
    let assunto = $('td:contains("Assunto")').text().strip();
    assunto = re.exec(assunto, re(/Assunto:\s+(.+)/))[1];
    if (re.exec(assunto, re(/\w/))) {
      return assunto;
    }
    return '';
  }

  extrairClasse($) {
    let classe = $('body > table:nth-child(19) > tbody > tr:nth-child(2) > td')
      .text()
      .strip();
    classe = re.exec(classe, re(/Classe:\s+(.+)/))[1];
    return classe;
  }

  extrairCapa($) {
    let capa = {};

    capa['uf'] = 'MG';
    capa['comarca'] = removerAcentos(this.extrairComarca($));
    capa['assunto'] = removerAcentos(this.extrairAssunto($));
    capa['classe'] = removerAcentos(this.extrairClasse($));
    return capa;
  }

  extrairDetalhes($) {
    let numero = $(
      'body > table.tabela_formulario > tbody > tr:nth-child(1) > td:nth-child(2)'
    ).text();
    numero = re.exec(
      numero,
      re(/\d{7}\W{0,1}\d{2}\W{0,1}\d{4}\W{0,1}\d\W{0,1}\d{2}\W{0,1}\d{4}/)
    )[0];
    return Processo.identificarDetalhes(numero);
  }

  extrairEnvolvidos($) {
    let rawEnvolvidos = $('b:contains("PARTE(S) DO PROCESSO")')[0];
    return rawEnvolvidos;
  }

  parse(rawProcesso, rawAndamentos) {
    const dataAtual = moment().format('YYYY-MM-DD');

    rawProcesso = cheerio.load(rawProcesso);
    rawAndamentos = cheerio.load(rawAndamentos);

    const capa = this.extrairCapa(rawProcesso);
    const detalhes = this.extrairDetalhes(rawProcesso);
    const envolvidos = this.extrairEnvolvidos(rawProcesso);
    const oabs = this.extrairOabs(envolvidos);
    const status = this.extrairStatus(rawProcesso);
    const andamentos = this.extrairAndamentos(
      rawAndamentos,
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

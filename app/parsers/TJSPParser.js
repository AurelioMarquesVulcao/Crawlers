const cheerio = require('cheerio');
const moment = require('moment');

const { BaseParser } = require('./BaseParser');
const { removerAcentos } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJSPParser extends BaseParser {
  /**
   * TJSPParser
   */
  constructor() {
    super();
  }

  extrairCapa($) {
    let capa = {};

    capa['uf'] = 'SP';
    capa['comarca'] = 'Sao Paulo';
    capa['assunto'] = this.extrairAssunto($);
    capa['classe'] = removerAcentos(this.extrairClasse($));
    return capa;
  }

  extrairAssunto($) {
    return $('td:contains("Assunto:")').next('td').text().strip();
  }

  extrairClasse($) {
    return $('td:contains("Classe:")').next('td').text().strip();
  }

  extrairDetalhes($) {
    const numero = $('td:contains("Processo:")').next('td').text().strip();
    return Processo.identificarDetalhes(numero);
  }

  extrairEnvolvidos($) {
    let rawEnvolvidos = $('#tablePartesPrincipais > tbody').text();

    let newRawEnvolvidos = rawEnvolvidos.replace(/\s\s\s+/g, 'xa0');
    let lista = newRawEnvolvidos.split('xa0');
    lista = lista.filter(Boolean); //["Reqte:", "Itaú Unibanco Sa", "Advogado:", "Reinaldo Luis Tadeu Rondina Mandaliti", "Advogado:", "JOSE EDGARD DA CUNHA BUENO FILHO", "Reqdo:", "Município de Aguaí", …]
    // TODO fazer um regex que pegue o elemento com ":" e todo texto posterior até cada elemento
    // if (!tbody) {
    //   tbody = table;
    // } else {
    //   tbody = tbody[0];
    // }

    // trs.each(function (index, element) {
    //   console.log('elemento', index, element);
    // });
  }

  parse(content) {
    content = cheerio.load(content);
    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa(content);
    const detalhes = this.extrairDetalhes(content);
    const envolvidos = this.extrairEnvolvidos(content);
    // const oabs = this.extrairOabs(envolvidos);
    // const status = this.extrairStatus(content);
    // const andamentos = this.extrairAndamentos(
    //   content,
    //   dataAtual,
    //   detalhes.numeroProcesso
    // );

    // const processo = new Processo({
    //   capa: capa,
    //   detalhes: detalhes,
    //   envolvidos: envolvidos,
    //   oabs: oabs,
    //   qtdAndamentos: andamentos.length,
    //   origemExtracao: 'OabTJBAPortal',
    // });

    // return {
    //   processo: processo,
    //   andamentos: andamentos,
    // };
  }
}

module.exports.TJSPParser = TJSPParser;

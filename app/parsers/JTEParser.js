const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const {
  enums
} = require('../configs/enums');


const {
  BaseParser,
  removerAcentos
} = require('./BaseParser');
const {
  Processo
} = require('../models/schemas/processo');
const {
  Andamento
} = require('../models/schemas/andamento');


class JTEParser extends BaseParser {
  /**
   * JTEParser
   */
  constructor() {
    super();
  }

  // Extract all processes for a given Oab
  removeVazios(array){
    limpo = []
    let i =0
    for (i in array){
      if (array.length > 1){
        limpo.push(array[i])
      }
    }
    return limpo
  }


  extrairCapa($) {
    let datas = this.extraiNumeroProcesso($)
    return datas
  }

  extraiNumeroProcesso($) {
    let datas = []
    $('div detalhes-aba-geral div').each(async function (element) {
      let numero = $(this).find('span').first().text().split("\n")[0]
      datas.push(numero)
    })
    datas = this.removeVazios(datas)
    return datas
  }



} // Fim da classe TJPRParser

// START'S FOR PROJECT TEST and development
// (async ()=>{
//   await new TJPRParser().extraiEnvolvidos($)
// })()

module.exports.JTEParser = JTEParser;
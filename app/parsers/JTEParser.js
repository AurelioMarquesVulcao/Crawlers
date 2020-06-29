const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const {
  enums
} = require('../configs/enums');


const {
  BaseParser,
  removerAcentos,
  extrairAdvogadoOab
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

  // Extract all processes for a given Process number

  extrairCapa($) {
    let datas = this.extraiOAB($)
    return datas
  }

  extraiNumeroProcesso($) {
    let datas = []
    $('detalhes-aba-geral span').each(async function (element) {
      let numero = $(this).text().split("\n")[0]
      datas.push(numero)
    })
    let numeroProcesso = this.removeVazios(datas)
    return numeroProcesso
  }

  extraiEnvolvidos($) {
    let datas = []
    $('.item-painel-cabecalho').each(async function (element) {
      let polo = $(this).text().split('\n')
      polo = new JTEParser().removeVazios(polo).join(' ')
      datas.push(polo)
    })
    return datas
  }

  extraiOAB($){
    let datas = []
    $('.item-valor-padrao').each(async function (element) {
      let OAB  = $(this).text().split('\n')
      OAB  = new JTEParser().removeVazios(OAB ).join(' ')
      OAB = extrairAdvogadoOab(OAB)
      datas.push(OAB )
    })
    return datas
  }

  removeVazios(array) {
    let limpo = []
    let i = 0
    for (i in array) {
      if (array[i].length > 2) {
        limpo.push(array[i].trim())
      }
    }
    return limpo
  }

  extrairAdvogadoOab(nome) {    
    // Implementar melhorias.
    let Oab = ''
    let numero = nome.slice(0,4)
    let pegaOab = nome.slice(0,nome.indexOf("-")+4)
    // responde se é numero ou não
    if (!isNaN(parseFloat(numero)) && isFinite(numero)) Oab = pegaOab
    else nome = ''
    return Oab
    };



} // Fim da classe TJPRParser

// START'S FOR PROJECT TEST and development
// (async ()=>{
//   await new TJPRParser().extrairCapa($)
// })()



module.exports.JTEParser = JTEParser;
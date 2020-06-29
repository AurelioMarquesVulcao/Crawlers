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

  // Extract all processes for a given Process number

  parse($) {

    let dadosProcesso = new Processo({
      uf: '',
      comarca: '',
      assunto: '',
      classe: '',
      distribuicao: '',
      oabs: this.removeVazios(this.Oabs($)),
      qtdAndamentos: '',
      origemExtracao: '',
      envolvidos: this.envolvidos($),
      "origemDados": enums.nomesRobos.JTE,
      detalhes: ''

    })

    return {
      processos: dadosProcesso
    }
  }
  capa($) {
    return capa
  }
  detalhes($) {
    return 'detalhes'
  }

  envolvidos($) {
    let resultado = [];
    for(let i in this.extraiAdvogadoOab($)){
      let advogado = {
        nome: "(" + this.extraiAdvogadoOab($)[i][0] + ")" + " " + this.extraiAdvogadoOab($)[i][1],
        tipo: "Advogado"
      }
      resultado.push(advogado)
    }
    let envolvidos = this.extraiEnvolvidos($)
    for (let i in envolvidos) {
      let separaNome = envolvidos[i].split(':')
      let envolvido = {
        nome: separaNome[1],
        tipo: separaNome[0]
      }
      resultado.push(envolvido)
      
    }
    // console.log(resultado);
    return resultado
  }
  Oabs($) {
    let resultado = []
    for(let i in this.extraiAdvogadoOab($)){
      resultado.push(this.extraiAdvogadoOab($)[i][0])
    }
    return resultado
  }
  andamentos($) {

  }


  extrairCapa($) {
    let capa;
    let datas = this.extraiEnvolvidos($);
    capa = {
      assunto: '',
      uf: "",
      comarca: "",
      classe: "",
    }

    return datas
  }

  // retorna array com numero do processo.
  extraiNumeroProcesso($) {
    let datas = [];
    $('detalhes-aba-geral span').each(async function (element) {
      let numero = $(this).text().split("\n")[0];
      datas.push(numero)
    })
    let numeroProcesso = this.removeVazios(datas);
    return numeroProcesso
  }

  // retornar dados dos envolvidos
  extraiEnvolvidos($) {
    let datas = []
    $('.item-painel-cabecalho').each(async function (element) {
      let polo = $(this).text().split('\n');
      polo = new JTEParser().removeVazios(polo).join(' ');
      datas.push(polo)
    })
    return datas
  }

  // retorna array com lista de Oab's
  extraiAdvogadoOab($) {
    let Oab = [];
    let resultado = [];
    let advogado = []
    $('.item-valor-padrao').each(async function (element) {
      let advogados = $(this).text().split('\n');
      let data = new JTEParser().removeVazios(advogados).join(' ');
      let OAB = new JTEParser().separaAdvogadoOab(data).oab;
      advogado = [OAB,new JTEParser().separaAdvogadoOab(data).advogado]    
      if (OAB.length > 2) resultado.push(advogado)
    })
    return resultado
  }



  // verifica um array e pega os numeros de OAB quando estes estão no inicio da string
  separaAdvogadoOab(nome) {
    // Implementar melhorias.
    let Oab = "";
    let advogado = "";
    let numero = nome.slice(0, 4);
    let pegaOab = nome.slice(0, nome.indexOf("-") + 4);
    let pegaNome = nome.slice(nome.indexOf("-") + 4, nome.length)
    // responde se é numero ou não
    if (!isNaN(parseFloat(numero)) && isFinite(numero)) {
      Oab = pegaOab
      advogado = pegaNome
    }
    else nome = false
    return {
      oab: Oab,
      advogado: advogado
    }
  };

  validaOAB() {

  }

  // remove espaço vazios das strings que estão em um array
  removeVazios(array) {
    let limpo = [];
    let i = 0;
    for (i in array) {
      if (array[i].length > 2) {
        limpo.push(array[i].trim())
      }
    }
    return limpo
  }

} // Fim da classe TJPRParser

// START'S FOR PROJECT TEST and development
// (async ()=>{
//   await new TJPRParser().extraiOAB($)
// })()



module.exports.JTEParser = JTEParser;
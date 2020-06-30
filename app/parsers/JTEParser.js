const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const { enums } = require('../configs/enums');


const { BaseParser, removerAcentos } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');


class JTEParser extends BaseParser {
  /**
   * JTEParser
   */
  constructor() {
    super();
  }

  // Extract all processes for a given Process number
  // Funcao central da raspagem.
  parse($) {
    this.extraiClasseCapa($)
    console.time('parse');
    let dadosProcesso = new Processo({
      capa: this.capa($),
      oabs: this.removeVazios(this.Oabs($)),
      qtdAndamentos: '',
      origemExtracao: '',
      envolvidos: this.envolvidos($),
      advogados: this.advogados($),
      "origemDados": enums.nomesRobos.JTE,
      detalhes: this.detalhes($)
    })
    console.timeEnd('parse');
    return {
      processos: dadosProcesso
    }
  }

  // funcao secundaria - organiza os dados da capa
  capa($) {
    let capa = {
      uf: "",
      comarca: "",
      vara: this.extraiVaraCapa($),
      fase: this.extraitesteCapa($),
      assunto: [""],
      classe: this.extraiClasseCapa($),
      // dataDistribuicao: Date,
    }

    return capa
  }

  detalhes($) {
    let numeroProcesso = this.extraiNumeroProcesso($)
    let detalhes = Processo.identificarDetalhes(numeroProcesso)
    return detalhes
  }

  // funcao secundaria - organiza os dados dos advogados
  advogados($) {
    let resultado = [];
    for (let i in this.extraiAdvogadoOab($)) {
      let advogado = {
        nome: this.extraiAdvogadoOab($)[i][1],
        tipo: "Advogado",
        oab: {
          uf: this.extraiAdvogadoOab($)[i][0].split('-')[1],
          numero: this.extraiAdvogadoOab($)[i][0].split('-')[0],
          oab: this.extraiAdvogadoOab($)[i][0]
        }
      }
      resultado.push(advogado)
    }
    return resultado
  }

  // funcao secundaria - organiza os dados dos envolvidos
  envolvidos($) {
    let resultado = [];
    // comitadopara padronizar o advogado no Banco de dados.
    // for (let i in this.extraiAdvogadoOab($)) {
    //   let advogado = {
    //     nome: "(" + this.extraiAdvogadoOab($)[i][0] + ")" + " " + this.extraiAdvogadoOab($)[i][1],
    //     tipo: "Advogado"
    //   }
    //   resultado.push(advogado)
    // }
    let envolvidos = this.extraiEnvolvidos($)
    for (let i in envolvidos) {
      let separaNome = envolvidos[i].split(':')
      let envolvido = {
        nome: separaNome[1],
        tipo: separaNome[0]
      }
      resultado.push(envolvido)
    }
    //console.log(resultado);
    return resultado
  }

  // funcao secundaria - organiza os dados das oabs
  Oabs($) {
    let resultado = []
    for (let i in this.extraiAdvogadoOab($)) {
      resultado.push(this.extraiAdvogadoOab($)[i][0])
    }
    return resultado
  }

  // funcao secundaria - organiza os dados dos andamentos
  andamentos($) {

  }

  extraitesteCapa($) {
    console.time('testeCapa');
    let Oab = [];
    let resultado = [];
    let advogado = []
    let classe = []

    $('detalhes-aba-geral').each(async function (index, element) {
      let advogados = $('detalhes-aba-geral').text().split('\n');
      let data = new JTEParser().removeVazios(advogados);
      //console.log(data);
      if (data.length > 2) {

      }

    })
    console.timeEnd('testeCapa');
    return "vara"
  }


  extraiVaraCapa($) {
    console.time('VaraCapa');
    let datas = [];
    let advogados = $('detalhes-aba-geral').text().split('\n');
    advogados = this.removeVazios(advogados)
    //console.log(advogados);
    
    // for (let i of advogados) {
    //   if (i.length > 2) {
    //     datas.push(i)
    //     console.log(i);
    //   }
    // }
    console.timeEnd('VaraCapa');
    return "vara"
  }


  extraiClasseCapa($) {
    let classe = []

    $('.item-valor-padrao').each(async function (element) {
      let advogados = $(this).text().split('\n');
      let data = new JTEParser().removeVazios(advogados).join(' ');
      classe.push(data)
    })

    return classe[0]
  }

  // retorna array com numero do processo.
  extraiNumeroProcesso($) {
    let datas = [];
    let resultado = ''
    $('detalhes-aba-geral span').each(async function (element) {
      let numero = $(this).text().split("\n")[0];
      if (!!numero) resultado = numero
    })
    let numeroProcesso = resultado
    return numeroProcesso
  }

  // retornar um array com os dados dos envolvidos
  extraiEnvolvidos($) {
    let resultado = []
    $('.item-painel-cabecalho').each(async function (element) {
      let polo = $(this).text().split('\n');
      polo = new JTEParser().removeVazios(polo).join(' ');
      resultado.push(polo)
    })
    return resultado
  }

  // retorna um array para cada advogado (oab/nome) do processo
  extraiAdvogadoOab($) {
    let Oab = [];
    let resultado = [];
    let advogado = []
    $('.item-valor-padrao').each(async function (element) {
      let advogados = $(this).text().split('\n');
      let data = new JTEParser().removeVazios(advogados).join(' ');
      let OAB = new JTEParser().separaAdvogadoOab(data).oab;
      advogado = [OAB, new JTEParser().separaAdvogadoOab(data).advogado]
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
    } else nome = false
    return {
      oab: Oab,
      advogado: advogado
    }
  };

  validaOAB() {

  }

  // funcao de limpeza de dados - remove string de espaço vazios e espaço vazio das strings que estão em um array
  removeVazios(array) {
    let limpo = [];
    let resultado = [];
    let i = 0;
    for (i in array) {
      if (array[i].length > 2) {
        limpo.push(array[i].trim())
      }
    }
    // com essas linhas de código abaixo eu não preciso remover as linhas vazias dos array's
    // precisando de menos código em todo o parse.
    // remover códigos retundantes referentes a isso.
    for (let j of limpo) {
      if (j.length > 2) {
        resultado.push(j)
      }
    }
    return resultado
  }

} // Fim da classe TJPRParser

// START'S FOR PROJECT TEST and development
// (async ()=>{
//   await new TJPRParser().extraiOAB($)
// })()



module.exports.JTEParser = JTEParser;
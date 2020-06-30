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
  // Funcao central da raspagem.
  parse($) {

    let dadosProcesso = new Processo({
      capa: this.extrairCapa($),
      oabs: this.removeVazios(this.Oabs($)),
      qtdAndamentos: '',
      origemExtracao: '',
      envolvidos: this.envolvidos($),
      advogados: this.advogados($),
      "origemDados": enums.nomesRobos.JTE,
      detalhes: Processo.identiidentificarDetalhes(this.extraiNumeroProcesso($))

    })

    return {
      processos: dadosProcesso
    }
  }
  // funcao secundaria - organiza os dados da capa
  capa($) {
    return capa
  }
  detalhes($) {
    return 'detalhes'
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

  // dividir em mais funções...
  // ajustar nomes das variaveis
  extrairCapa($) {
    let capa = {
      uf: "",
      comarca: "",
      vara: "",
      fase: "",
      assunto: [""],
      classe: "",
      // dataDistribuicao: Date,
    }
    let Oab = [];
    let resultado = [];
    let advogado = []
    let classe = []
    $('.item-valor-padrao').each(async function (element) {
      let advogados = $(this).text().split('\n');
      let data = new JTEParser().removeVazios(advogados).join(' ');
      classe.push(data)
    })
    capa.classe = classe[0]


    $('detalhes-aba-geral').each(async function (element) {
      let advogados = $(this).text().split('\n');
      let data = new JTEParser().removeVazios(advogados);
      if (data.length > 2) {
      // continuar daqui.................................................................
      }
      //console.log(datas);

      // classe.push(data)
    })

    resultado = capa



    return resultado
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
    console.log(resultado);
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
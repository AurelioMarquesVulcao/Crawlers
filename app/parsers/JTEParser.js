const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const { enums } = require('../configs/enums');


const { BaseParser, removerAcentos } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');


class TJPRParser extends BaseParser {
  /**
   * TJPRParser
   */
  constructor() {
    super();
  }

  // Extract all processes for a given Oab
  extrairOab($) {
    let links = []
    $('.resultTable tbody tr').each(async function (element) {
      let numero = $(this).find('td[nowrap=nowrap]').text()
        .replace(/\n/g, '').trim()

      let link = $(this).find('a').attr('href')
      link = "http://portal.tjpr.jus.br" + link

      // let partes = [$(this).find('font').first().text().replace(/\n/g, '').trim()]
      // $(this).find('li').last().text().replace(/\n/g, '')]

      let classeProcessual = $(this).find('td').text().replace(/  /g, '').split('\n').reverse()
      if (classeProcessual.length > 2) classeProcessual = classeProcessual[3]

      let vara = $(this).find('td').text().replace(/  /g, '').split('\n').reverse()
      if (vara.length > 2) vara = vara[1]

      if (numero.length > 1) links.push(link)
    })

    return links
  }

  // Organiza e trata os dados dos envolvidos 
  // obs: irá fazer isso de 10 em 10 processos
  extraiEnvolvidos($) {
    let tipo = this.extrairTipoEnvolvido($)
    let nome = this.extraiNomeEnvolvidos($)
    let resultado = []
    let processo = []

    let i = 0
    for (i in tipo) {
      let n = [tipo[i], nome[i]]
      let dados = this.laco(n[0], n[1])
      dados = this.lacoObjeto(dados)
      resultado.push(dados)
    }
    return resultado
  }
  // trata os dados dos envolvidos
  laco(data1, data2) {
    let i = 0
    let datas = []
    for (i in data1) {
      datas.push([data1[i], data2[i]])
    };
    return datas
  }
  // pega os dados tratados e os organiza.
  lacoObjeto(obj) {
    let i = 0
    let pessoas = []
    for (; ;) {
      if (!obj[i] === true) break
      obj[i][1] = obj[i][1].toString().trim()
      pessoas.push({
        tipo: removerAcentos(obj[i][0]),
        nome: obj[i][1]
      }); i++
    }
    return pessoas
  }
  // pega os dados da pagina do TJPR
  extraiNomeEnvolvidos($) {
    let tipo = this.extrairTipoEnvolvido($)
    let partes = []
    let nomes = []
    let resultado = []
    $(' tr td tbody tr td ul').each(async function (index, element) {
      let nome = $(this).text().replace(/\t/g, '').split('\n')   //.split(' , ') // .replace(/  /g, '')  //.split('\n')  .toLowerCase()
      nome = nome.slice(1, tipo.length)
      let last = nome[nome.length - 1].length
      if (last < 1) nome.pop()
      await nomes.push(nome)
    })
    let i = 0
    let s = 0
    for (i in tipo) {
      resultado.push(nomes.slice(s, tipo[i].length + s))
      s = s + tipo[i].length
    }
    return resultado
  }

  // pega os dados da pagina do TJPR
  extrairTipoEnvolvido($) {
    let tipos = []
    $(' tr td tbody').each(async function (element) {
      let tipo = $(this).find('td font').text().replace(/\n/g, '').replace(/\t/g, '').replace(/  /g, '').split(':')
      if (tipo.length > 1) await tipos.push(tipo.slice(0, tipo.length - 1))
    })
    return tipos
  }

  // Extract process cover data
  extrairCapa($) {
    let title
    let datas = []
    $('#content tbody tr td em').each(function (index, element) {
      let data = $(this).text().normalize().split("\n").join(" ").replace(/  /g, '')
      datas.push(data)
    })
    title = {
      classeProcessual: removerAcentos(datas[0]),
      assuntoPrincipal: removerAcentos(datas[1]),
      numeroUnico: datas[2],
      numeroAntigo: datas[3],
      comarca: datas[4],
      vara: removerAcentos(datas[5]),
      dataRecebimento: datas[6],
      natureza: removerAcentos(datas[7]),
      requerente: removerAcentos(datas[8]),
      requerido: removerAcentos(datas[9]),
    }
    //console.log(title);

    return title
  }

  // It receives all the process data and organizes it to go to the bank.
  parse(processo, djResultados, $, envolvidos, numeroDaOab) {
    // datas e igual aos andamentos do processo
    let datas = this.insereDJ(processo, djResultados);

    let capa = this.extrairCapa($)
    // envio separado ao banco.
    datas = this.movimentacoes(datas, capa.numeroUnico)
    console.log("extraindo o processo: " + capa.numeroUnico);
    let dadosProcesso = new Processo({
      uf: 'PR',
      comarca: 'Paraná',
      assunto: [removerAcentos(capa.assuntoPrincipal)],
      classe: removerAcentos(capa.classeProcessual),
      distribuicao: capa.dataRecebimento,
      oabs: numeroDaOab,
      qtdAndamentos: datas.length,
      origemExtracao: datas.length,
      // area: "cível", // confirmar os dados

      envolvidos: envolvidos,
      "origemDados": enums.nomesRobos.TJPR,
      detalhes: Processo.identificarDetalhes(capa.numeroUnico)
      
    })
    return { andamentos: datas, processo: dadosProcesso }
  }

  pegaOab(obj) {
    //obj = obj.get('Exequente')
    return obj
  }

  // Extract initial process data
  async extrairDadosProcesso($) {
    let datas = []
    $('.resultTable tbody tr').each(async function (element) {
      let descricao = $(this).find('td[nowrap=nowrap]').last().text()
        .replace(/\n/g, '').replace(/\t/g, '').trim().replace(/   /g, '')

      let data = $(this).find('td[nowrap=nowrap]').first().text()
        .replace(/\n/g, '').replace(/\t/g, '').trim().substring(0, 21)
        data = removerAcentos(data)

      let link = $(this).find('img').attr('onclick')

      if (typeof (link) != typeof ('')) link = ""
      if (link.length > 1) link = "http://portal.tjpr.jus.br" + link.split("'").reverse()[1]


      if (descricao.length > 1) {
        await datas.push({ data: data, descricao: descricao, link: link, djEletronico: '' })
      }
    })
    return datas;
  }

  // Functions that organize process data
  extrairLinks(processo) {
    let djLinks = []
    let i = 0;
    for (i in processo) {
      if (processo[i].link.length > 2) {
        djLinks.push(processo[i].link)
      }
    }
    return djLinks
  }

  insereDJ(processo, djResultados) {
    let j = 0; let c = 0;
    for (j in processo) {
      if (processo[j].link.length > 2) {
        processo[j].djEletronico = djResultados[c]
        c++
      }
    }
    return processo
  }

  movimentacoes(data, numeroProcesso) {
    let datas = []
    let i = 0;
    for (i in data) {
      if (data[i].djEletronico.length > 1) {
        data[i].djEletronico = data[i].djEletronico.replace(/\n/g, '').replace(/\r/g, '')
        data[i].descricao = data[i].descricao + " , " + data[i].djEletronico
      }
      datas.push(
        new Andamento({
          descricao: data[i].descricao,
          dataMovimentacao: data[i].data,
          numeroProcesso: numeroProcesso.split('.').join('').split('-').join('')
        }))
    }
    return datas
  }


} // Fim da classe TJPRParser

// START'S FOR PROJECT TEST and development
// (async ()=>{
//   await new TJPRParser().extraiEnvolvidos($)
// })()

module.exports.TJPRParser = TJPRParser;

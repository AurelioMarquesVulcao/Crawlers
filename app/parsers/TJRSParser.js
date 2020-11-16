const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const querystring = require('querystring');
const { Helper } = require('../lib/util');

const { BaseParser, removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

const possiveisStatusBaixa = [
  'Arquivamento com baixa',
  'Arquivamento',
  'Baixa Definitiva'
]

class TJRSParser extends BaseParser {
  /**
   * TJRSParser
   */
  constructor() {
    super();
  }

  parse(capaBody, partesBody, movimentacoesBody) {
    const capaContent = cheerio.load(capaBody);
    const partesContent = cheerio.load(partesBody);
    const movimentacoesContent = cheerio.load(movimentacoesBody);
    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa(capaContent);
    const detalhes = this.extrairDetalhes(capaContent);
    const envolvidos = this.extrairEnvolvidos(partesContent);
    const oabs = this.extrairOabs(envolvidos);
    const andamentos = this.extrairAndamentos(movimentacoesContent, dataAtual, detalhes.numeroProcesso);
    capa.dataDistribuicao = this.extrairDataDistribuicao(andamentos);
    const status = this.extrairStatus(andamentos);
    const isBaixa = this.extrairBaixa(status);

    const processo = new Processo({
      capa,
      detalhes,
      envolvidos,
      oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'ProcessoTJRS',
      status,
      isBaixa
    });

    return {
      processo,
      andamentos
    }
  }

  extrairCapa($) {
    let capa = {
      uf: '',
      comarca: '',
      assunto: '',
      classe: '',
      dataDistribuicao: '',
      vara: ''
    };

    capa.uf = 'RS';
    capa.comarca = this.extrairComarca($);
    capa.assunto = this.extrairAssunto($);
    capa.classe = this.extrairClasse($);
    capa.vara = this.extrairVara($);

    return capa;
  }

  extrairAssunto($) {
    let selector = '#conteudo > table:nth-child(3) > tbody > tr:nth-child(2) > td:nth-child(2)';
    return $(selector).text().split(', ');
  }

  extrairClasse($) {
    let selector = '#conteudo > table:nth-child(2) > tbody > tr:nth-child(1) > td:nth-child(1)';
    return $(selector).text();
  }

  extrairComarca($) {
    let selector = '#conteudo > table:nth-child(4) > tbody > tr:nth-child(1) > td.texto_geral';
    return $(selector).text();
  }

  extrairVara($) {
    let selector = '#conteudo > table:nth-child(4) > tbody > tr:nth-child(2) > td.texto_geral';
    let varaString = $(selector).text();
    let regex = re("(?<vara>\\d{0,2}?([ºª]?\\s)?Vara.+)\\s((d[a,e]\\sComarca)|(\\s:))", "gm");

    let match = re.exec(varaString, regex);
    if (match)
      return match.vara;

    return varaString;
  }

  extrairDetalhes($) {
    let selector = "#conteudo > table:nth-child(2) > tbody > tr > td:nth-child(3)";

    let numeroString = $(selector).text();
    let numero = numeroString.match(/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/);
    if (numero)
      return Processo.identificarDetalhes(numero[0])
  }

  extrairEnvolvidos($){
    let tableEnvolvidos = $('#conteudo > table:nth-child(2) > tbody > tr'); // quantidade de linhas
    let envolvidos = [];

    tableEnvolvidos.map((i, tr) => {
      let textoGeral = $(tr).find('td.texto_geral');
      if (textoGeral.length) {
        let nome = $($(textoGeral[0])).text().trim();
        let referencia = $(textoGeral[textoGeral.length - 1]).text().trim();
        let tipo;

        //limpar oab \n+\t+(\w+\s?\w+)\s+iça
        if (/([A-Z]{2})\s(\d+\w?\d+)/.test(referencia)) {
          tipo = 'Advogado';
          nome = `(${referencia.replace(/([A-Z]{2})\s(\d+\w?\d+)/, '$2$1')}) ${nome}`;
        } else {
          tipo = traduzir(referencia);
        }

        envolvidos.push({
          nome: nome,
          tipo: tipo,
        });
      }
    })

    return envolvidos;

  }

  extrairOabs(envolvidos) {
    let oabs = [];

    envolvidos.map(e => {
      let oab;
      if (e.tipo == 'Advogado'){ //envolvidos[1].nome.exec(/\(([0-9]+\w?[0-9]*[A-Z]{2})\)/)
        oab = /\(([0-9]+\w?[0-9]*[A-Z]{2})\)/.test(e.nome) ? e.nome.match(/([0-9]+\w?[0-9]*[A-Z]{2})/)[0] : false;
        oabs.push(oab);
      }
    })

    return oabs;
  }

  extrairAndamentos($, dataAtual, numeroProcesso) {
    let tableAndamentos = $('#conteudo > table:nth-child(3) > tbody > tr');
    let andamentos = [];

    tableAndamentos.each((i, tr) => {
      let data = $(tableAndamentos[i]).find('td:nth-child(2)').text().trim();
      let descricao = $(tableAndamentos[i]).find('td:nth-child(3)').text().trim();
      let andamento = {
        numeroProcesso: numeroProcesso,
        data: moment(data, 'DD/MM/YYYY').format('YYYY-MM-DD'),
        dataInclusao: dataAtual,
        descricao: descricao.trim(),
      };
      andamentos.push(new Andamento(andamento));
    });

    return andamentos;
  }

  extrairDataDistribuicao(andamentos){
    return andamentos[andamentos.length - 1].data;
  };

  extrairStatus(andamentos) {
    const tam = andamentos.length;

    for (let i = 0; i < tam; i++){
      let statusIndex = possiveisStatusBaixa.indexOf(andamentos[i].descricao);
      if (statusIndex !== -1) {
        return possiveisStatusBaixa[statusIndex];
      }
    }

    return 'Aberto';
  }

  extrairBaixa(status) {
    return possiveisStatusBaixa.indexOf(status) !== -1;
  }
}

module.exports.TJRSParser = TJRSParser;
const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const querystring = require('querystring');
const { Helper } = require('../lib/util');

const { BaseParser, removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

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
      origemExtracao: 'ProcessoTJSP',
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
    let regex = re("(?<vara>\\d{0,2}?[º]?\\sVara.+)\\sd[a,e]\\sComarca\\sd[a,e]\\s(?<comarca>.+)", "gm");

    let match = re.exec(varaString, regex);
    if (match)
      return vara.vara;

    return varaString;
  }
}

module.exports.TJRSParser = TJRSParser;
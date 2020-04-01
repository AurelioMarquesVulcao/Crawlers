const cheerio = require('cheerio');
const moment = require('moment');

const { BaseParser } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

// parser => processo

function removerAssentos(texto) {
  //TODO removerAssentos fazer remoção de assentos
  return texto;
}

class TJBAPortalParser extends BaseParser {
  /**
   * TJBAPortalParser
   */
  constructor() {
    super();
  }

  extrairCapa($) {
    let capa = {};

    capa['uf'] = 'BA';
    capa['comarca'] = 'Bahia';
    capa['assunto'] = this.extrairAssunto($);
    capa['classse'] = $.classe;

    return capa;
  }

  extrairAssunto($) {
    return $.assunto;
  }

  extrairEnvolvidos($) {
    let envolvidos = [];

    $.partes.map((element, index) => {
      if (element.tipo) {
        let nome = element.nome.replace(/\s[^\w-]\s.+$/, '');
        let tipo = removerAssentos(element.tipo);
        envolvidos.push({
          nome: nome,
          tipo: tipo,
        });

        if (element.advogado) {
          let advogado = element.advogado;
          let oab = /\d+\w{2}/.exec(advogado);
          advogado = advogado.replace(/\s.\d+\w{2}.$/, '');
          if (oab) {
            advogado = `(${oab[0]}) ${advogado}`;
          }
          envolvidos.push({
            nome: removerAssentos(advogado),
            tipo: 'Advogado',
          });
        }
      }
    });

    return envolvidos;
  }

  extrairAndamentos($, dataAtual) {
    let movimentos = [];

    $.movimentacoes.map((element, index) => {
      let data = moment(element.dataMovimentacao, 'DD/MM/YYYY').format(
        'YYYY-MM-DD'
      );

      movimentos.push(
        new Andamento({
          numeroProcesso: element.numeroProcesso,
          data: data,
          dataInclusao: dataAtual
        })
      );
    });
    return movimentos;
  }

  extrairOabs(envolvidos) {
    let oabs = [];

    envolvidos.map(element => {
      if (element.tipo == 'Advogado') {
        let oab = /\d+\w{2}/.exec(element.nome);
        if (oab) {
          oabs.push(oab[0]);
        }
      }
    });

    return oabs;
  }

  extrairStatus(content) {
    return 'Não informado.';
  }

  /**
   * Parse
   * @param {JSON} content Conteudo em JSON
   */
  parse(content) {
    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa(content);
    const detalhes = new Processo().identificarDetalhes(content.numero);
    const envolvidos = this.extrairEnvolvidos(content);
    const oabs = this.extrairOabs(envolvidos);
    const status = this.extrairStatus(content);
    const andamentos = this.extrairAndamentos(content, dataAtual);

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      temAndamentosNovos: true,
      qtdAndamentosNovos: andamentos.length,
      origemExtracao: 'OabTJBAPortal',
    });

    return {
      processo: processo,
      andamentos: andamentos,
    };
  }
}

module.exports.TJBAPortalParser = TJBAPortalParser;

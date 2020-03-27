const cheerio = require('cheerio');
const moment = require('moment');

const { BaseParser } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');

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
        let nome = element.nome.substitute(/\s[^\w-]\s.+$/, '');
        let tipo = removerAssentos(element.tipo);
        envolvidos.push({
          nome: nome,
          tipo: tipo,
        });

        if (element.advogado) {
          let advogado = element.advogado;
          let oab = /\d+\w{2}/.exec(advogado);
          if (oab) {
            advogado = advogado.substitute(/\s.\d+\w{2}.$/, '');
            advogado = `(${oab}) ${advogado}`;
            envolvidos.push({
              nome: removerAssentos(texto),
              tipo: 'Advogado',
            });
          }
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
      movimentos.push({
        numeroDoProcesso: element.numeroProcesso,
        data: data,
        dataInclusao: dataAtual,
      });
    });
    return movimentos;
  }

  extrairOabs(envolvidos) {}

  /**
   * Parse
   * @param {JSON} content Conteudo em JSON
   */
  parse(content) {
    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa(content);
    const detalhes = Processo.extrairDetalhes(cnj);
    const envolvidos = this.extrairEnvolvidos(content);
    const oabs = this.extrairOabs(envolvidos);
    const status = this.extrairStatus(content);
    const andamentos = this.extrairAndamentos(content);

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      temAndamentosNovos: false,
      qtdAndamentosNovos: andamentos.length(),
      origemExtracao: 'OabTJBAPortal',
    }).toString();

    return {
      processo: processo,
      andamento: andamentos,
    };
  }
}

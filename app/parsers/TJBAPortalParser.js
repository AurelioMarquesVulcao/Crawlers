const cheerio = require('cheerio');
const moment = require('moment');

const { BaseParser } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

// parser => processo

function removerAcentos(texto) {
  texto = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return texto.replace(/N[^\w\s]/gi, 'N');
}

if (typeof String.prototype.strip === 'undefined') {
  String.prototype.strip = function () {
    return String(this).replace(/^\s+|\s+$/g, '');
  };
}

class TJBAPortalParser extends BaseParser {
  /**
   * TJBAPortalParser
   */
  constructor() {
    super();
  }

  extrairCapa(content) {
    let capa = {};

    capa['uf'] = 'BA';
    capa['comarca'] = 'Bahia';
    capa['assunto'] = [this.extrairAssunto(content)];
    capa['classe'] = removerAcentos(content.classe);

    return capa;
  }

  extrairAssunto(content) {
    return removerAcentos(content.assunto.strip());
  }

  extrairEnvolvidos(content) {
    let envolvidos = [];

    content.partes.map((element, index) => {
      if (element.tipo) {
        let nome = element.nome.replace(/\s[^\w-]\s.+$/, '');
        nome = removerAcentos(nome);
        let tipo = removerAcentos(element.tipo);
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
            nome: removerAcentos(advogado),
            tipo: 'Advogado',
          });
        }
      }
    });

    return envolvidos;
  }

  extrairAndamentos(content, dataAtual, numeroProcesso) {
    let movimentos = [];

    content.movimentacoes.map((element, index) => {
      let data = moment(element.dataMovimentacao, 'DD/MM/YYYY').format(
        'YYYY-MM-DD'
      );

      movimentos.push(
        new Andamento({
          numeroProcesso: element.numeroProcesso,
          data: data,
          dataInclusao: dataAtual,
          descricao: removerAcentos(element.descricao),
        })
      );
    });
    return movimentos;
  }

  extrairOabs(envolvidos) {
    let oabs = [];

    envolvidos.map((element) => {
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

  extrairDetalhes(content) {
    return new Processo().identificarDetalhes(content.numero);
  }

  /**
   * Parse
   * @param {JSON} content Conteudo em JSON
   */
  parse(content) {
    console.log('content', content);
    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa(content);
    const detalhes = this.extrairDetalhes(content);
    const envolvidos = this.extrairEnvolvidos(content);
    const oabs = this.extrairOabs(envolvidos);
    const status = this.extrairStatus(content);
    const andamentos = this.extrairAndamentos(
      content,
      dataAtual,
      detalhes.numeroProcesso
    );

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'OabTJBAPortal',
    });

    return {
      processo: processo,
      andamentos: andamentos,
    };
  }
}

module.exports.TJBAPortalParser = TJBAPortalParser;

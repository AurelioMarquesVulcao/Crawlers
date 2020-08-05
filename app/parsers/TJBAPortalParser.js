const cheerio = require('cheerio');
const moment = require('moment');

const { BaseParser } = require('./BaseParser');
const { removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const { COMARCAS } = require('../assets/tjba/comarcas');
// parser => processo



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
    capa['comarca'] = removerAcentos(this.extrairComarca(content));
    capa['assunto'] = [this.extrairAssunto(content)];
    capa['classe'] = removerAcentos(content.classe);
    return capa;
  }

  extrairComarca (content) {
    let distribuicao = removerAcentos(content.distribuicao);
    for (let c of COMARCAS) {
      if (c.test(distribuicao.toLowerCase())) {
        return c.toString().replace(/\//g, '').toUpperCase();
      }
    }
  }

  extrairAssunto(content) {
    if (content.assunto) {
      return removerAcentos(content.assunto.strip());
    }
    return 'null';
  }

  extrairEnvolvidos(content) {
    let envolvidos = [];

    content.partes.map((element, index) => {
      if (element.tipo) {
        let nome = element.nome.replace(/\s[^\w-]\s.+$/, '');
        nome = removerAcentos(nome);
        let tipo = traduzir(element.tipo);

        if (tipo == "Advogado") {
          nome = nome.replace(/\s\W\s.*/, '');
          nome = `(${element.documento}) ${nome}`;
        } else {
          if (element.advogado) {
            envolvidos.push(this.extrairAdvogado(element.advogado));
          }
        }
        envolvidos.push({
          nome: nome,
          tipo: tipo
        });
      }
    });

    return envolvidos;
  }

  extrairAdvogado(advogado) {
    let oab = /\d+\w{2}/.exec(advogado);
    advogado = advogado.replace(/\s.\d+\w{2}.$/, '');
    if (oab) {
      advogado = `(${oab[0]}) ${advogado}`;
    }
    return {
      nome: removerAcentos(advogado),
      tipo: 'Advogado',
    };
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
    return Processo.identificarDetalhes(content.numero);
  }

  /**
   * Parse
   * @param {JSON} content Conteudo em JSON
   */
  parse(content) {
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
    capa['dataDistribuicao'] = this.extrairDataDistribuicao(andamentos);

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

  /**
   *
   * @param {[Andamento]} andamentos
   * @returns {*}
   */
  extrairDataDistribuicao(andamentos) {
    let data;
    let tam = andamentos.length;

    data = andamentos[tam - 1].data;

    return data;
  }
}

module.exports.TJBAPortalParser = TJBAPortalParser;

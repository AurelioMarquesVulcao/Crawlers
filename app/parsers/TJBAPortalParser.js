const moment = require('moment');

const { BaseParser } = require('./BaseParser');
const { removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const { COMARCAS } = require('../assets/tjba/comarcas');
// parser => processo

const possiveisStatus = [
  'Arquivamento com baixa',
  'Arquivamento',
  'Baixa Definitiva',
];

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

  extrairComarca(content) {
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

        if (tipo === 'Advogado') {
          nome = nome.replace(/\s\W\s.*/, '');
          nome = `(${element.documento}) ${nome}`;
        } else {
          if (element.advogado) {
            envolvidos.push(this.extrairAdvogado(element.advogado));
          }
        }
        envolvidos.push({
          nome: nome,
          tipo: tipo,
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
    let andamentos = [];
    let andamentosHash = [];

    content.movimentacoes.map((element, index) => {
      let data = moment(element.dataMovimentacao, 'DD/MM/YYYY').format(
        'YYYY-MM-DD'
      );

      let andamento = {
        numeroProcesso: element.numeroProcesso,
        data: data,
        dataInclusao: dataAtual,
        descricao: removerAcentos(element.descricao),
      };

      let hash = Andamento.criarHash(andamento);

      if (andamentosHash.indexOf(hash) !== -1) {
        let count = andamentosHash.filter((element) => element === hash).length;
        andamento.descricao = `${andamento.descricao} [${count + 1}]`;
      }
      andamentos.push(new Andamento(andamento));
      andamentosHash.push(hash);
    });
    return andamentos;
  }

  extrairOabs(envolvidos) {
    let oabs = [];

    envolvidos.map((element) => {
      if (element.tipo === 'Advogado') {
        let oab = /\d+\w{2}/.exec(element.nome);
        if (oab) {
          oabs.push(oab[0]);
        }
      }
    });

    return oabs;
  }

  /**
   * @param {[Andamento]}andamentos
   * @returns {string}
   */
  extrairStatus(andamentos) {
    const tam = andamentos.length;
    for (let i = 0; i < tam; i++) {
      let statusIndex = possiveisStatus.indexOf(andamentos[i].descricao);
      if (statusIndex !== -1) {
        return possiveisStatus[statusIndex];
      }
    }

    return 'Aberto';
  }

  /**
   * @param {String} status
   * @returns {boolean}
   */
  extrairBaixa(status) {
    return possiveisStatus.indexOf(status) !== -1;
  }

  extrairDetalhes(content) {
    return Processo.identificarDetalhes(content.numero);
  }

  /**
   * @param {[Andamento]} andamentos
   * @returns {null|String}
   */
  extrairDataDistribuicao(andamentos) {
    const tam = andamentos.length;

    // percorre a fila de forma inversa, assim pega o primeiro andamento em ordem cronologica :)
    for (let i = tam - 1; i >= 0; i--) {
      if (/Distribuicao/.test(andamentos[i].descricao)) {
        return andamentos[i].data;
      }
    }

    return null;
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
    const andamentos = this.extrairAndamentos(
      content,
      dataAtual,
      detalhes.numeroProcesso
    );
    const status = this.extrairStatus(andamentos);
    capa.dataDistribuicao = this.extrairDataDistribuicao(andamentos);
    const isBaixa = this.extrairBaixa(status);
    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: andamentos.length,
      isBaixa: isBaixa,
      status: status,
      origemExtracao: 'OabTJBAPortal',
    });

    return {
      processo: processo,
      andamentos: andamentos,
    };
  }
}

module.exports.TJBAPortalParser = TJBAPortalParser;

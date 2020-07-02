const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');

const { BaseParser, removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJSCParser extends BaseParser {
  constructor() {
    super();
  }

  /**
   * Recupera da pagina HTML os dados do processo
   * @param {string} content html da pagina
   * @returns {{processo: Processo, andamentos: [Andamento]}}
   */
  parse(content) {
    const $ = cheerio.load(content);
    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa($);
    const detalhes = this.extrairDetalhes($);
    const envolvidos = this.extrairEnvolvidos($);
    const oabs = this.extrairOabs(envolvidos);
    // #tabelaTodasMovimentacoes
    const andamentos = this.extrairAndamentos($);

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: 0,
      origemExtracao: 'OabTJSP',
    });

    return {
      processo: processo,
      andamentos: 'andamentos',
    };
  }

  // EXTRACAO DE CAPAS
  extrairCapa($) {
    let capa = {};

    capa['uf'] = 'SC';
    capa['comarca'] = this.extrairComarca($);
    capa['assunto'] = this.extrairAssunto($);
    capa['classe'] = this.extrairClasse($);

    return capa;
  }

  extrairComarca($) {
    let comarca;

    comarca = removerAcentos(
      $(
        'body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div.col-lg-2.col-xl-2.mb-2 > div'
      )
        .text()
        .strip()
    );

    return comarca;
  }

  extrairAssunto($) {
    let assuntos = [];

    assuntos.push(
      removerAcentos(
        $(
          'body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div.col-lg-2.col-xl-3.mb-3 > div'
        )
          .text()
          .strip()
      )
    );

    return assuntos;
  }

  extrairClasse($) {
    let classe;

    classe = removerAcentos(
      $(
        'body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div:nth-child(1) > div'
      )
        .text()
        .strip()
    );

    return classe;
  }

  extrairDetalhes($) {
    let numeroProcesso;
    let detalhes;

    numeroProcesso = $(
      'body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(1) > div > span.unj-larger-1'
    )
      .text()
      .strip();

    detalhes = Processo.identificarDetalhes(numeroProcesso);

    return detalhes;
  }

  extrairEnvolvidos($) {
    let envolvidos = [];
    const table = $('#tablePartesPrincipais > tbody > tr');

    // pegar personagens
    table.map((index, linha) => {
      let envolvido = { tipo: '', nome: '' };
      let advogados;

      // Extracao
      envolvido.tipo = $(
        `#tablePartesPrincipais > tbody > tr:nth-child(${
          index + 1
        }) > td:nth-child(1).label > span`
      )[0].children[0].data.strip();
      envolvido.nome = $(
        `#tablePartesPrincipais > tbody > tr:nth-child(${
          index + 1
        }) > td:nth-child(2)`
      )[0].children[0].data.strip();
      advogados = this.recuperaAdvogados(index, $);

      // Tratamento
      envolvido.tipo = envolvido.tipo.replace(':', '').split(/\W/)[0];
      envolvido.tipo = traduzir(envolvido.tipo);
      // if (tradutor[envolvido.tipo]) envolvido.tipo = tradutor[envolvido.tipo];
      envolvido.nome = removerAcentos(envolvido.nome.trim());

      // Atribuição
      envolvidos.push(envolvido);

      if (advogados) envolvidos = [...envolvidos, ...advogados];
    });

    // pegar os advogados

    return envolvidos;
  }

  recuperaAdvogados(upperIndex, $) {
    let advogados = [];
    let linha;

    // 1 transformar tudo em linhas
    linha = $(
      `#tablePartesPrincipais > tbody > tr:nth-child(${
        upperIndex + 1
      }) > td:nth-child(2)`
    )
      .text() // pega o texto
      .strip() // tira os espacos vazios
      .split(/\s\s+/) // list feita a partir das quebras de linha
      .splice(1); // remove primeiro elemento que normalmente é o nome do envolvido
    console.log(linha);
    if (linha) {
      linha = [linha.join(' ')];
    }
    advogados = linha.map((element, index) => {
      console.log('elementor', element);
      let regex = `(?<tipo>.+):\\s(?<nome>.+)`;
      let adv = {
        tipo: '',
        nome: '',
      };
      let oab = '';

      let resultado = re.exec(element, re(regex));

      // Extracao
      if (resultado) {
        adv.tipo = resultado.tipo.strip();
        adv.nome = resultado.nome.strip();

        //TODO fazer funcao de resgate da oab dentro das movimentações
        let oab = this.resgatarOab(adv.nome, $);

        // Tratamento
        adv.nome = removerAcentos(adv.nome);
        if (oab) adv.nome = `(${oab}) ${adv.nome}`;

        return adv;
      }
    });

    return advogados.filter(Boolean);
  }

  resgatarOab(nome, $) {
    let movimentacoesEmTexto;
    let advMatch;
    let oab;

    movimentacoesEmTexto = $('#tabelaTodasMovimentacoes').text();
    advMatch = re.exec(
      movimentacoesEmTexto,
      re(`(?<nome>${nome})\\s\\(OAB\\s(?<oab>.+)\\)`)
    );
    if (advMatch) {
      oab = advMatch.oab;
      //padrao do site: <codigo><tipo?>/<tipo?><seccional>
      oab = re.exec(
        oab,
        re(`(?<codigo>[0-9]+)(?<tipo>[A-Z]?.[A-Z]?)(?<seccional>[A-Z]{2})`)
      );

      oab = `${oab.codigo}${oab.tipo.replace(/\W/, '')}${oab.seccional}`;
      return oab;
    }
    //Se existir verifica se existe uma oab escrita
    //Se existir converte esta oab para o modelo <codigo><tipo><seccional>
    //Retorna oab
    return null;
  }

  extrairOabs(envolvidos) {
    let oabs;
    oabs = envolvidos.map((element) => {
      let oab = re.exec(element.nome, re(/([0-9]+)([A-Z]?)([A-Z]{2})/g));
      if (oab) {
        return oab[0];
      } else {
        return null;
      }
    });

    return oabs.filter(Boolean);
  }

  extrairAndamentos($) {
    let andamentos = [];
    const table = $('#tabelaTodasMovimentacoes > tbody > tr');
    table.each((element) => {});
    return andamentos;
  }
}

module.exports.TJSCParser = TJSCParser;

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
   * @param {number} instancia do processo
   * @returns {{processo: Processo, andamentos: [Andamento]}}
   */
  parse(content, instancia) {
    this.instancia = Number(instancia);
    const $ = cheerio.load(content);
    const dataAtual = moment().format('YYYY-MM-DD');
    const capa = this.extrairCapa($);
    const detalhes = this.extrairDetalhes($);
    const envolvidos = this.extrairEnvolvidos($);
    const oabs = this.extrairOabs(envolvidos);
    // #tabelaTodasMovimentacoes
    const andamentos = this.extrairAndamentos(
      $,
      dataAtual,
      detalhes.numeroProcesso
    );

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'OabTJSP',
    });

    return {
      processo: processo,
      andamentos: andamentos,
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

    comarca = $(
      'body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div.col-lg-2.col-xl-2.mb-2 > div'
    )
      .text()
      .strip();

    if (comarca === '') {
      comarca = $(
        'body > div.div-conteudo.container.unj-mb-40 > table:nth-child(12) > tbody > tr > td:nth-child(2)'
      )
        .text()
        .strip();
    }

    return removerAcentos(comarca);
  }

  extrairAssunto($) {
    let assuntos = [];
    let assunto;

    assunto = $(
      'body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div.col-lg-2.col-xl-3.mb-3 > div'
    )
      .text()
      .strip();
    if (assunto === '') {
      assunto = $(
        'body > div.unj-entity-header > div.unj-entity-header__summary > div > div:nth-child(2) > div.col-md-4 > div > span'
      )
        .text()
        .strip();
    }

    assuntos.push(removerAcentos(assunto));
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
    detalhes['instancia'] = this.instancia;
    return detalhes;
  }

  extrairEnvolvidos($) {
    let envolvidos = [];
    let table;
    let selector;

    table = $('#tableTodasPartes > tbody > tr');
    selector = '#tableTodasPartes';
    if (table.length === 0) {
      table = $('#tablePartesPrincipais > tbody > tr');
      selector = '#tablePartesPrincipais';
    }

    // pegar personagens
    table.map((index) => {
      let envolvido = { tipo: '', nome: '' };
      let advogados;

      // Extracao
      envolvido.tipo = $(
        `${selector} > tbody > tr:nth-child(${
          index + 1
        }) > td:nth-child(1).label > span`
      )[0].children[0].data.strip();
      envolvido.nome = $(
        `${selector} > tbody > tr:nth-child(${index + 1}) > td:nth-child(2)`
      )[0].children[0].data.strip();
      advogados = this.recuperaAdvogados(index, $, selector);

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

    envolvidos = this.filtrarUnicosLista(envolvidos);

    return envolvidos;
  }

  recuperaAdvogados(upperIndex, $, selector) {
    let advogados = [];
    let linha;

    selector = `${selector} > tbody > tr:nth-child(${
      upperIndex + 1
    }) > td:nth-child(2)`;

    linha = $(selector).text();
    linha = linha.match(/^[\t ]*(?<tipo>\w+):\W+(?<nome>.+)/gm);
    if (linha) {
      advogados = linha.map((element, index) => {
        let regex = `(?<tipo>.+):\\s(?<nome>.+)`;
        let adv = {
          tipo: '',
          nome: '',
        };
        let oab;
        let resultado = re.exec(element.replace('\n', ' '), re(regex));
        // Extracao
        if (resultado) {
          adv.tipo = traduzir(resultado.tipo.strip());
          adv.nome = resultado.nome.strip();

          oab = $(selector + `> input[type=hidden]:nth-child(${index + 3})`);
          if (oab.length === 0) {
            oab = this.resgatarOab(adv.nome, $);
          } else {
            oab = oab.attr('value');
          }
          // Tratamento
          adv.nome = removerAcentos(adv.nome);
          if (oab) adv.nome = `(${oab}) ${adv.nome}`;

          return adv;
        }
      });
    }
    return advogados.filter((x) => Boolean(x));
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

  extrairAndamentos($, dataAtual, numeroProcesso) {
    let andamentos = [];
    let andamentosHash = [];
    let observacao;
    let table;
    let selector;
    table = $('#tabelaTodasMovimentacoes > tr');
    selector = '#tabelaTodasMovimentacoes';
    // if (table.length === 0) {
    //   table = $('#tabelaUltimasMovimentacoes > tr');
    //   selector = "#tabelaUltimasMovimentacoes";
    // }

    table.each((index) => {
      let data = $(
        `${selector} > tr:nth-child(${index + 1}) > td:nth-child(1)`
      );
      data = moment(data.text().strip(), 'DD/MM/YYYY').format('YYYY-MM-DD');
      let descricaoRaw = $(
        `${selector} > tr:nth-child(${index + 1}) > td:nth-child(3)`
      );

      if (descricaoRaw.find('span')[0].children.length > 0) {
        observacao = descricaoRaw.find('span')[0].children[0].data.strip();
      } else {
        observacao = descricaoRaw.find('span').text().strip();
      }
      let descricao = re.replace(descricaoRaw.text(), observacao, '').strip();
      observacao = observacao.replace(/\n/gm, ' ');
      observacao = re.replace(observacao, re(/\s\s+/gm), ' ');
      observacao = removerAcentos(observacao);
      descricao = descricao.replace(/\n/g, ' ');
      descricao = descricao.replace(/\s\s+/g, ' ');

      let andamento = {
        numeroProcesso: numeroProcesso,
        data: data,
        dataInclusao: dataAtual,
        descricao: removerAcentos(descricao),
      };

      if (observacao) {
        andamento.observacao = observacao;
      }

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
}

module.exports.TJSCParser = TJSCParser;

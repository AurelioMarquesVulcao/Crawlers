const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const { BaseParser, traduzir, removerAcentos } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJCEParser extends BaseParser {
  constructor() {
    super();
  }

  parse(body) {
    const $ = cheerio.load(body);
    const dataAtual = moment().format('YYYY-MM-DD');

    const capa = this.extrairCapa($);
    const detalhes = this.extrairDetalhes($);
    const envolvidos = this.extrairEnvolvidos($); //TODO verificar se ele pega advogados quando aparecerem
    const oabs = this.extrairOabs(envolvidos);
    const andamentos = this.extrairAndamentos(
      $,
      dataAtual,
      detalhes.numeroProcesso
    );
    const status = this.extrairStatus(andamentos);
    const isBaixa = this.extrairBaixa(status);

    detalhes.instancia = 1;
    capa.dataDistribuicao = this.extrairDataDistribuicao($, andamentos);

    const processo = new Processo({
      capa,
      detalhes,
      envolvidos,
      oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'ProcessoTJCE',
      status,
      isBaixa,
    });

    return {
      processo,
      andamentos,
    };
  }

  extrairCapa($) {
    return {
      uf: 'SP',
      comarca: this.extrairComarca($),
      assunto: this.extrairAssunto($),
      classe: this.extrairClasse($),
      vara: removerAcentos(this.extrairVara($)),
      audiencias: this.extrairAudiencias($),
    };
  }

  extrairComarca($) {
    let comarcaSelector = `tr:contains("Distribuição:")`;
    let rawComarca = $(comarcaSelector).next('tr').text().strip();

    let comarca = /Comarca\sde\s(.+)\s-/.exec(rawComarca);

    if (comarca && comarca[1]) {
      return comarca[1];
    }

    return 'Nao identificada';
  }

  extrairVara($) {
    let distribuicaoSelector = `tr:contains("Distribuição:")`;
    let rawVara = $(distribuicaoSelector).next('tr').text().strip();

    let vara = /(.+)\sda\sComarca\sde/.exec(rawVara);

    if (vara && vara[1]) {
      return vara[1];
    }

    return 'Não identificada';
  }

  extrairClasse($) {
    let classeSelector = `tr:contains("Área:")`;
    let rawClasse = $(classeSelector);

    if (rawClasse && rawClasse.length > 1) {
      rawClasse = $(rawClasse[rawClasse.length - 1]);
    }

    rawClasse = rawClasse.text().strip();

    let classe = /Área:\s(.+)/.exec(rawClasse);

    if (classe && classe[1]) {
      return classe[1];
    }

    return rawClasse;
  }

  extrairAssunto($) {
    let assuntoSelector = `tr:contains("Assunto:")`;
    let rawAssunto = $(assuntoSelector);

    if (rawAssunto && rawAssunto.length > 1) {
      rawAssunto = $(rawAssunto[rawAssunto.length - 1]);
    }

    rawAssunto = rawAssunto.text().strip();

    let assunto = /Assunto:\s+(.+)/.exec(rawAssunto);

    if (assunto && assunto[1]) return [assunto[1]];

    return 'Não identificado';
  }

  extrairDetalhes($) {
    let numeroProcessoSelector = `tr:contains("Distribuição:")`;
    let rawNumeroProcesso = $(numeroProcessoSelector);
    let numeroProcesso;

    const tam = rawNumeroProcesso.length;

    for (let i = 0; i < tam; i++) {
      let cnj = $(rawNumeroProcesso[i]).text().strip();

      if (/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(cnj)) {
        numeroProcesso = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.exec(cnj)[0];
        break;
      }
    }

    return Processo.identificarDetalhes(numeroProcesso);
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
      let envolvido = {
        tipo: '',
        nome: '',
      };
      let advogados;

      // Extracao
      envolvido.tipo = $(
        `${selector} > tbody > tr:nth-child(${
          index + 1
        }) > td:nth-child(1) > span`
      )[0].children[0].data.strip();
      envolvido.nome = $(
        `${selector} > tbody > tr:nth-child(${index + 1}) > td:nth-child(2)`
      )[0].children[0].data.strip();
      advogados = this.recuperaAdvogados(index, $, selector);

      // Tratamento
      envolvido.tipo = envolvido.tipo.replace(':', '');
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
    let movimentacoesEmtexto = $('#tabelaTodasMovimentacoes').text();
    let advMatch = re.exec(
      movimentacoesEmtexto,
      re(`(?<nome>${nome})\\s\\(OAB\\s(?<oab>.+)\\)`)
    );

    if (advMatch) {
      let oab = advMatch.oab;
      oab = re.exec(
        oab,
        re(`(?<codigo>[0-9]+)(?<tipo>[A-Z]?.[A-Z]?)(?<seccional>[A-Z]{2})`)
      );

      oab = `${oab.codigo}${oab.tipo.replace(/\W/, '')}${oab.seccional}`;

      return oab;
    }

    return false;
  }

  extrairOabs(envolvidos) {
    let oab = '';
    let oabs = envolvidos.map((element) => {
      if (element.tipo === 'Advogado') {
        oab = re.exec(element.nome, re(/\((?<oab>\d+\w+)\)/));
        if (oab) {
          return oab.groups.oab;
        } else {
          return null;
        }
      }
    });

    return oabs.filter(Boolean);
  }

  extrairAndamentos($, dataAtual, numeroProcesso) {
    let andamentos = [];
    let andamentosHash = [];

    let linhas = $('#tabelaTodasMovimentacoes > tr');

    linhas.map((index, linha) => {
      let data;
      let descricao;
      let observacao;
      data = $($(linha).children()[0]).text().strip();
      data = moment(data, 'DD/MM/YYYY').format('YYYY-MM-DD');

      let rawDescricao = $($(linha).children()[2]);
      if (rawDescricao.find('span')[0].children.length) {
        observacao = rawDescricao.find('span')[0].children[0].data.strip();
      } else {
        observacao = rawDescricao.find('span').text().strip();
      }

      descricao = re.replace(rawDescricao.text(), observacao, '').strip();
      descricao = descricao.replace(/\n/g, ' ');
      descricao = descricao.replace(/\s\s+/g, ' ');

      observacao = observacao.replace(/\n/gm, ' ');
      observacao = observacao.replace(/\s\s+/gm, ' ');
      observacao = removerAcentos(observacao);

      let andamento = {
        numeroProcesso: numeroProcesso,
        data: data,
        dataInclusao: dataAtual,
        descricao: descricao,
      };

      if (/\w/g.test(observacao)) andamento.observacao = observacao;

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

  extrairStatus(andamentos) {
    for (let i = 0, tam = andamentos.length; i < tam; i++) {
      let statusIndex = this.possiveisStatusBaixa.indexOf(
        andamentos[i].descricao
      );
      if (statusIndex !== -1) return this.possiveisStatusBaixa[statusIndex];
    }

    return 'Aberto';
  }

  extrairBaixa(status) {
    return this.possiveisStatusBaixa.indexOf(status) !== -1;
  }

  extrairDataDistribuicao($, andamentos) {
    let data;
    let distribuicao;

    distribuicao = $($(`tr:contains("Distribuição:")`)[1]).text().strip();
    distribuicao = distribuicao.replace(
      /(?<data>\d{2}\/\d{2}\/\d{4})\sàs\s(?<hora>\d{2}:\d{2})(.*)/gm,
      '$1 $2'
    );
    distribuicao = distribuicao.replace(/\s\s+/gm, ' ');
    if (/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/.test(distribuicao)) {
      distribuicao = /\d{2}\/\d{2}\/\d{4}/.exec(distribuicao)[0];
      data = moment(distribuicao, 'DD/MM/YYYY').format('YYYY-MM-DD');
      return data;
    }

    let tam = andamentos.length;
    if (tam > 0) return andamentos[tam - 1].data;
  }

  extrairAudiencias($) {
    let data = $(
      $($('[name="audienciasPlaceHolder"]').next('table').children()[0]).find(
        'tr.fundoClaro > td'
      )[0]
    ).text();
    let tipo = $(
      $($('[name="audienciasPlaceHolder"]').next('table').children()[0]).find(
        'tr.fundoClaro > td'
      )[1]
    ).text();
    let audiencia;

    if (/\d/.test(data) && /\w/.test(tipo)) {
      data = data.strip();
      data = moment(data, 'DD/MM/AAAA');

      tipo = tipo.strip();

      if (data > moment()) {
        return [{ data: data.format('YYYY-MM-DD'), tipo }];
      }
    }

    return [];
  }
}

module.exports.TJCEParser = TJCEParser;

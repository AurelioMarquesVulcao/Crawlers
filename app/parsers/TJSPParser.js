const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const { COMARCAS } = require('../assets/TJSP/comarcas.js');

const { BaseParser, removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

const possiveisStatusBaixa = [
  'Arquivamento com baixa',
  'Arquivamento',
  'Baixa Definitiva'
]

class TJSPParser extends BaseParser {
  /**
   * TJSPParser
   */
  constructor() {
    super();
  }

  extrairCapa($) {
    let capa = {};

    capa['uf'] = 'SP';
    capa['comarca'] = this.extrairComarca($); // TODO realizar extração da capa, NO HARD CODE
    capa['assunto'] = this.extrairAssunto($);
    capa['classe'] = removerAcentos(this.extrairClasse($));
    return capa;
  }

  extrairComarca($) {
    let comarca;

    comarca = $('td:contains("Origem:")').next('td').text().strip();
    comarca = removerAcentos(comarca);
    comarca = comarca.replace(/(Comarca\sde\s|Foro\sde\s)(\w+)\s\/\s(.*)/, '$1$2');

    if (/Comarca|Foro/.test(comarca) === false){
      comarca = $('tr:contains("Distribuição:")').next('tr').text().strip();
      comarca = removerAcentos(comarca);
    }
    // comarca = comarca.replace(/.*\s-\s/g, '');


    comarca = COMARCAS.filter(c => c.test(comarca))
    comarca = comarca[0].source;
    return removerAcentos(comarca);
  }

  extrairAssunto($) {
    let assunto = $('td:contains("Assunto:")').next('td').text().strip();
    assunto = assunto.split(/\s\W\s/);
    return assunto.map(element => removerAcentos(element));
  }

  extrairClasse($) {
    return $('td:contains("Classe:")').next('td').text().strip();
  }

  extrairDetalhes($) {
    let numero = $('td:contains("Processo:")').next('td').text().strip();
    numero = re.exec(
      numero,
      re(/\d{7}\W?\d{2}\W?\d{4}\W?\d\W?\d{2}\W?\d{4}/)
    )[0];
    return Processo.identificarDetalhes(numero);
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
        }) > td:nth-child(1) > span`
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



  /**
   * Verifica se há uma oab correspondente ao nome na tabela de andamentos
   * @param {String} nome nome do envolvido
   * @param {cheerio} $ objeto do cheerio
   * @returns {string|boolean}
   */
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

      oab = `${oab.codigo}${oab.tipo.replace(/\W/, '')}${oab.seccional}`

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

  /**
   * @param {[Andamento]} andamentos
   * @returns {string}
   */
  extrairStatus(andamentos) {
    const tam = andamentos.length

    for (let i = 0; i < tam; i++){
      let statusIndex = possiveisStatusBaixa.indexOf(andamentos[i].descricao);
      if (statusIndex !== -1) {
        return possiveisStatusBaixa[statusIndex];
      }
    }

    return 'Aberto'
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

  parse(content, instancia=1) {
    content = cheerio.load(content);
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
    const status = this.extrairStatus(andamentos); //ainda nao encontrado uma ocorrencia em que apareça, mas se precisar ta ai
    const isBaixa = this.extrairBaixa(status);
    detalhes.instancia = instancia;
    capa.dataDistribuicao = this.extrairDataDistribuicao(content, andamentos);

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'OabTJSP',
      status: status,
      isBaixa: isBaixa
    });

    return {
      processo: processo,
      andamentos: andamentos,
    };
  }

  /**
   *
   * @param {String} status
   * @return {boolean}
   */
  extrairBaixa(status) {
    return possiveisStatusBaixa.indexOf(status) !== -1;
  }

  /**
   *
   * @param {cheerio} $
   * @param {[Andamento]} andamentos
   * @returns {Date}
   */
  extrairDataDistribuicao($, andamentos) {
    let data ;
    let distribuicao;

    distribuicao = removerAcentos($('body > div > table:nth-child(4) > tbody > tr > td > div:nth-child(9) > table.secaoFormBody > tbody > tr:nth-child(5) > td:nth-child(2) > span').text().strip());

    distribuicao = distribuicao.replace(/(?<data>\d{2}\/\d{2}\/\d{4})\sas\s(?<hora>\d{2}:\d{2})(.*)/gm, '$1 $2')
    if(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/g.test(distribuicao)) {
      data = moment(distribuicao, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm');
      return data
    }


    let tam = andamentos.length;
    if (tam > 0)
      return andamentos[tam-1].data;
  }
}

module.exports.TJSPParser = TJSPParser;

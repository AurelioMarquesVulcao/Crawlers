const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const { BaseParser, traduzir, removerAcentos } = require('./BaseParser');
const { Processo, Andamento } = require('../models');

class EsajParser extends BaseParser {
  parse(body) {
    const $ = cheerio.load(body);
    const dataAtual = moment().format('YYYY-MM-DD');

    let capa = this.extrairCapa($);
    let detalhes = this.extrairDetalhes($);
    let envolvidos = this.extrairEnvolvidos($);
    let oabs = this.extrairOabs(envolvidos);
    let andamentos = this.extrairAndamentos(
      $,
      dataAtual,
      detalhes.numeroProcesso
    );
    let status = this.extrairStatus(andamentos);
    let isBaixa = this.extrairBaixa(status);

    let metadados = this.extrairMetadados($);

    detalhes.instancia = 1;
    capa.dataDistribuicao = this.extrairDataDistribuicao($, andamentos);

    const processo = new Processo({
      capa,
      detalhes,
      envolvidos,
      oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'ProcessoTJMS',
      status,
      isBaixa,
      metadados,
    });

    return { processo, andamentos };
  }

  /**
   * Realiza a extração dos envolvidos
   * @param {cheerio.load} $
   * @return {*[]}
   */
  extrairEnvolvidos($) {
    const table = $('#tablePartesPrincipais > tbody')[0];
    const linhas = $(table).find('tr');
    let partes = [];
    let advogados = [];

    linhas.map((index, linha) => {
      let tipo = $($(linha).find('td:nth-child(1)')).text();
      let nomeTd = $($(linha)[0]).find('td.nomeParteEAdvogado').text().trim();
      let listaNomesEAdvogados = nomeTd.split(/\s*\n\s*\n\s*\n\s*\n\s*\n\s*/);

      let listaNomes = listaNomesEAdvogados.filter((e) => {
        if (!/\w/.test(e)) return false;
        if (/Advogad[o, a]:\s/gm.test(e)) return false;
        return true;
      });

      partes = [...partes, ...this.extrairNomeParte(tipo, listaNomes)];
      advogados = [
        ...advogados,
        ...this.extrairNomeAdvogado(listaNomesEAdvogados),
      ];
    });

    return [...partes, ...advogados];
  }

  extrairNomeParte(tipo, lista) {
    return lista.map((e) => {
      return {
        tipo: traduzir(tipo.trim()),
        nome: e.trim(),
      };
    });
  }

  extrairNomeAdvogado(lista) {
    let listaAdvs = lista.filter((e) => {
      return /Advogad[a-o]:\s/.test(e);
    });

    return listaAdvs.map((e) => {
      let nome = e.match(/Advogad[a,o]:\s+(?<nome>\w.+\w)/).groups.nome;

      return {
        tipo: 'Advogado',
        nome: nome.trim(),
      };
    });
  }

  /**
   * Verifica se há oabs referentes aos advogados
   * @param envolvidos
   * @return {*}
   */
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
   * Faz a extração da capa do processo
   * @param {cheerio.load} $
   * @return {{assunto: [string], classe: string, foro: string, vara: string}}
   */
  extrairCapa($) {
    let classe = this.extrairClasse($);
    let assunto = this.extrairAssunto($);
    let foro = this.extrairForo($);
    let vara = this.extrairVara($);
    let audiencia = this.extrairAudiencias($);

    return { classe, assunto, foro, vara };
  }

  extrairClasse($) {
    return $('#areaProcesso').text().trim();
  }

  extrairAssunto($) {
    return $('#assuntoProcesso').text().trim();
  }

  extrairForo($) {
    return $('#foroProcesso').text().trim();
  }

  extrairVara($) {
    return $('#varaProcesso').text().trim();
  }

  /**
   * Verifica o numero do processo e retira os detalhes do numero
   * @param {cheerio.load} $
   * @return {*}
   */
  extrairDetalhes($) {
    let numeroProcesso = $('#numeroProcesso').text().trim();

    return Processo.identificarDetalhes(numeroProcesso);
  }

  /**
   * Faz a extração da lista de andamentos
   * @param {cheerio.load} $
   * @param dataAtual
   * @param numeroProcesso
   * @return {[Andamento]}
   */
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
      observacao = rawDescricao.find('span')[0].children.length
        ? rawDescricao.find('span')[0].children[0].data.strip()
        : rawDescricao.find('span').text().strip();

      descricao = re.replace(rawDescricao.text(), observacao, '').strip();
      descricao = this.tratarTexto(descricao);

      observacao = this.tratarTexto(observacao);
      observacao = removerAcentos(observacao);

      let andamento = {
        numeroProcesso: numeroProcesso,
        data: data,
        dataInclusao: dataAtual,
        descricao: descricao,
      };

      andamento.observacao = /\w/g.test(observacao) ? observacao : null;

      let hash = Andamento.criarHash(andamento);

      if (andamentosHash.indexOf(hash) !== -1) {
        let count = andamentosHash.filter((element) => element == hash).length;
        andamento.descricao = `${andamento.descricao} [${count + 1}]`;
      }

      andamentos.push(new Andamento(andamento));
      andamentosHash.push(hash);
    });

    return andamentos;
  }

  /**
   * Verifica qual é o status do processo
   * @param {[Andamento]} andamentos
   * @return {string|string}
   */
  extrairStatus(andamentos) {
    for (let i = 0, tam = andamentos.length; i < tam; i++) {
      let andamento = andamentos[i];
      let statusIndex = this.possiveisStatusBaixa.indexOf(andamento.descricao);
      if (statusIndex !== -1) return this.possiveisStatusBaixa[statusIndex];
    }

    return 'Aberto';
  }

  /**
   * Verifica se houve baixa no processo de acordo com o status
   * @param {String} status
   * @return {boolean}
   */
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

  /**
   * Extrai as audiencias do processo
   * @param {cheerio.load} $
   * @return {*[]|{tipo: (*|jQuery), data: string}[]}
   */
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

  /**
   * Verifica os metadados do processo
   * @param {cheerio.load} $
   * @return {Object}
   */
  extrairMetadados($) {
    let metadados = {};
    let juiz = this.extrairJuiz($);
    let valorDaAcao = this.extrairValorDaAcao($);

    if (juiz.juiz) {
      metadados = { ...juiz, ...metadados };
    }

    if (valorDaAcao.valorDaAcao) {
      metadados = { ...valorDaAcao, ...metadados };
    }

    return metadados;
  }

  extrairJuiz($) {
    let juiz = this.tratarTexto($('#juizProcesso').text().strip());
    juiz = /\w+/g.test(juiz) ? juiz : null;
    return { juiz };
  }

  extrairValorDaAcao($) {
    let valorDaAcao = this.tratarTexto($('#valorAcaoProcesso').text().strip());
    valorDaAcao = /\w+/g.test(valorDaAcao) ? valorDaAcao : null;
    return {
      valorDaAcao,
    };
  }
}

class TJMSParser extends EsajParser {}

module.exports = {
  TJMSParser,
};

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
    // let oabs = this.extrairOabs($);
    let andamentos = this.extrairAndamentos(
      $,
      dataAtual,
      detalhes.numeroProcesso
    );
    let status = this.extrairStatus(andamentos);
    let isBaixa = this.extrairBaixa(status);

    detalhes.instancia = 1;
    capa.dataDistribuicao = this.extrairDataDistribuicao($, andamentos); //TODO dataDistribuicao

    const processo = new Processo({
      capa,
      detalhes,
      envolvidos,
      oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'ProcessoTJMS',
      status,
      isBaixa,
    });

    return { processo, andamentos };

    console.log('teste');
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

  extrairCapa($) {
    let classe = this.extrairClasse($);
    let assunto = this.extrairAssunto($);
    let foro = this.extrairForo($);
    let vara = this.extrairVara($);

    return { classe, assunto, foro, vara };
  }

  extrairClasse($) {
    return $('#classeProcesso').text().trim();
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

  extrairDetalhes($) {
    let numeroProcesso = $('#numeroProcesso').text().trim();

    return Processo.identificarDetalhes(numeroProcesso);
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
}

class TJMSParser extends EsajParser {}

module.exports = {
  TJMSParser,
};

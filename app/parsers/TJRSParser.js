const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');

const { BaseParser, removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJRSParser extends BaseParser {
  /**
   * TJRSParser
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
    let comarca = '';

    comarca = $('tr:contains("Distribuição:")').next('tr').text().strip();
    comarca = comarca.replace(/.*\s\-\s/g, '');

    return removerAcentos(comarca);
  }

  extrairAssunto($) {
    return removerAcentos(
      $('td:contains("Assunto:")').next('td').text().strip()
    );
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
    let rawEnvolvidosString = '';
    let rawEnvolvidosList = [];
    let envolvidos = [];

    rawEnvolvidosString = $('#tablePartesPrincipais > tbody').text().strip();
    rawEnvolvidosString = re.replace(rawEnvolvidosString, re(/\s\s\s+/g), ' ');
    rawEnvolvidosString = re.replace(
      rawEnvolvidosString,
      re(/(\s)(\w+\:)/g),
      'xa0$2'
    );

    rawEnvolvidosList = rawEnvolvidosString.split('xa0');

    envolvidos = rawEnvolvidosList.map((element, index) => {
      const match = re.exec(element, re(/(?<tipo>\w+)\:\s(?<nome>.*)/));
      let envolvido = {
        tipo: traduzir(match.groups.tipo),
        nome: match.groups.nome,
      };
      return JSON.parse(JSON.stringify(envolvido));
      console.log('novo envolvido', match.groups.tipo);
    });

    envolvidos = this.preencherOabs($, envolvidos);

    envolvidos = envolvidos.map((element) => {
      return {
        tipo: element.tipo,
        nome: removerAcentos(element.nome)
      }
    });

    return envolvidos;
  }

  preencherOabs($, envolvidos) {
    let movimentosString = '';
    movimentosString = $('#tabelaTodasMovimentacoes').text();

    return envolvidos.map((element) => {
      if (element.tipo == 'Advogado') {
        let regex = re(
          `(${element.nome})\\s(\\(OAB\\s(?<oab>\\d+)\\/SP\\))`,
          'gm'
        );
        let oab = re.exec(movimentosString, regex);
        if (oab) {
          element.nome = removerAcentos(`(${oab[3]}SP) ${element.nome}`);
        } else {
          element.nome = removerAcentos(element.nome);
        }
      } else {
        element.nome = removerAcentos(element.nome);
      }
      return element;
    });
  }

  extrairOabs(envolvidos) {
    let oab = '';
    let oabs = envolvidos.map((element) => {
      if (element.tipo == 'Advogado') {
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

  extrairStatus(content) {
    return 'Não informado.';
  }

  extrairAndamentos($, dataAtual, numeroProcesso) {
    let andamentos = [];
    const table = $('#tabelaTodasMovimentacoes');
    const tdsList = table.find('tr');

    tdsList.each((index, element) => {
      let data = $(
        `#tabelaTodasMovimentacoes > tr:nth-child(${
          index + 1
        }) > td:nth-child(1)`
      );
      data = moment(data.text().strip(), 'DD/MM/YYYY').format('YYYY-MM-DD');
      let descricaoRaw = $(
        `#tabelaTodasMovimentacoes > tr:nth-child(${
          index + 1
        }) > td:nth-child(3)`
      );

      let observacao = descricaoRaw.find('span')[0].children[0].data.strip();
      let descricao = re.replace(descricaoRaw.text(), observacao, '').strip();
      observacao = re.replace(observacao, re(/\s\s+/g), ' ');
      observacao = removerAcentos(observacao);

      let andamento = {
        numeroProcesso: numeroProcesso,
        data: data,
        dataInclusao: dataAtual,
        descricao: removerAcentos(descricao),
      };
      if (observacao) {
        andamento['observacao'] = observacao;
      }
      andamentos.push(new Andamento(andamento));
    });

    return andamentos;
  }

  parse(content) {
    content = cheerio.load(content);
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
      origemExtracao: 'OabTJSP',
    });

    return {
      processo: processo,
      andamentos: andamentos,
    };
  }
}

module.exports.TJRSParser = TJRSParser;

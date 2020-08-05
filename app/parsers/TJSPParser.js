const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');

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

    comarca = $('tr:contains("Distribuição:")').next('tr').text().strip();
    comarca = comarca.replace(/.*\s-\s/g, '');

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
    let rawEnvolvidosString;
    let rawEnvolvidosList;
    let envolvidos;

    rawEnvolvidosString = $('#tablePartesPrincipais > tbody').text().strip();
    rawEnvolvidosString = re.replace(rawEnvolvidosString, re(/\s\s\s+/g), ' ');
    rawEnvolvidosString = re.replace(
      rawEnvolvidosString,
      re(/(\s)(\w+:)/g),
      'xa0$2'
    );

    rawEnvolvidosList = rawEnvolvidosString.split('xa0');

    envolvidos = rawEnvolvidosList.map((element) => {
      const match = re.exec(element, re(/(?<tipo>\w+):\s(?<nome>.*)/));
      let envolvido = {
        tipo: traduzir(match.groups.tipo),
        nome: match.groups.nome,
      };
      return JSON.parse(JSON.stringify(envolvido));
    });

    // envolvidos = this.preencherOabs($, envolvidos);
    envolvidos = envolvidos.map(element => {
      let oab = this.resgatarOab(element.nome, $);

      if (oab) {
        return {
          tipo: element.tipo,
          nome: `(${oab}) ${element.nome}`
        }
      }

      return element;
    });

    envolvidos = envolvidos.map((element) => {
      return {
        tipo: element.tipo,
        nome: removerAcentos(element.nome)
      }
    });

    return envolvidos;
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
    const table = $('#tabelaTodasMovimentacoes');
    const tdsList = table.find('tr');

    tdsList.each((index) => {
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
    const andamentos = this.extrairAndamentos(
      content,
      dataAtual,
      detalhes.numeroProcesso
    );
    const status = this.extrairStatus(andamentos); //ainda nao encontrado uma ocorrencia em que apareça, mas se precisar ta ai
    const isBaixa = this.extrairBaixa(status);
    capa.dataDistribuicao = this.extrairDataDistribuicao(content, andamentos);

    console.log(capa.dataDistribuicao, this.extrairDataDistribuicao(content, andamentos))

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'OabTJSP',
      statu: status,
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

    distribuicao = removerAcentos($('tr:contains("Distribuição:")').next('tr').text().strip());
    distribuicao = distribuicao.replace(/(?<data>\d{2}\/\d{2}\/\d{4})\sas\s(?<hora>\d{2}\:\d{2})(.*)/, '$1 $2:00')

    if(distribuicao.replace(/\W/g, '')) {
      data = moment(distribuicao, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD HH:mm:SS');
      return data
    }

    let tam = andamentos.length;
    return andamentos[tam-1].data;
  }
}

module.exports.TJSPParser = TJSPParser;

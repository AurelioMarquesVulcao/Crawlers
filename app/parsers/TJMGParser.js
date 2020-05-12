const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');

const { BaseParser, removerAcentos, tradutor } = require('./BaseParser');

const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJMGParser extends BaseParser {
  constructor() {
    super();
  }

  extrairComarca($) {
    let comarca = $('h1').text();
    comarca = re.exec(comarca, re(/Comarca d. (\w+\s*\w*) - .*/));
    return comarca[1];
  }

  extrairAssunto($) {
    let assunto = $('td:contains("Assunto")').text().strip();
    assunto = re.exec(assunto, re(/Assunto:\s+(.+)/))[1];
    if (re.exec(assunto, re(/\w/))) {
      return assunto;
    }
    return '';
  }

  extrairClasse($) {
    let classe = $('body > table:nth-child(19) > tbody > tr:nth-child(2) > td')
      .text()
      .strip();
    classe = re.exec(classe, re(/Classe:\s+(.+)/))[1];
    return classe;
  }

  extrairCapa($) {
    let capa = {};

    capa['uf'] = 'MG';
    capa['comarca'] = removerAcentos(this.extrairComarca($));
    capa['assunto'] = removerAcentos(this.extrairAssunto($));
    capa['classe'] = removerAcentos(this.extrairClasse($));
    return capa;
  }

  extrairDetalhes($) {
    let numero = $(
      'body > table.tabela_formulario > tbody > tr:nth-child(1) > td:nth-child(2)'
    ).text();
    numero = re.exec(
      numero,
      re(/\d{7}\W{0,1}\d{2}\W{0,1}\d{4}\W{0,1}\d\W{0,1}\d{2}\W{0,1}\d{4}/)
    )[0];
    return Processo.identificarDetalhes(numero);
  }

  extrairPartes(partesList) {
    // TIPO | NOME | IGNORA
    let partes = [];
    let tipo = null;
    let nome = null;
    for (let i = 0; i < partesList.length / 3; i++) {
      nome = null;

      if (partesList[(i + 1) * 3 - 3]) {
        tipo = partesList[(i + 1) * 3 - 3];
      }
      nome = partesList[(i + 1) * 3 - 2];

      nome = nome.match(/^(.*)$/m)[0].strip();

      if (tipo && nome)
        partes.push({ tipo: removerAcentos(tipo), nome: removerAcentos(nome) });
    }

    return partes;
  }

  extrairAdvogados(advogadosList) {
    let advogados = [];
    let tipo = null;
    let nome = null;
    let oab = null;

    for (let i = 0; i < advogadosList.length / 2; i++) {
      nome = null;
      tipo = null;

      tipo = advogadosList[(i + 1) * 2 - 2].replace(/\(s\)\W/, '');
      let advogadosValues = advogadosList[(i + 1) * 2 - 1];
      advogadosValues = re.match(
        advogadosValues,
        re(/(\d+[A-Z]\/\w{2})\s*\-\s*(.+)/),
        'all'
      );

      advogadosValues = advogadosValues.map((element, index) => {
        return element.replace(/\s\s+/, ' ').strip();
      });

      advogadosValues = advogadosValues.map((element, index) => {
        let nome = re.exec(element, re(/(.+)\s\-.(.+)/));
        return `(${nome[1]}) ${nome[2]}`;
      });

      advogadosValues.map((element, index) => {
        advogados.push({
          tipo: tipo,
          nome: removerAcentos(element),
        });
      });
    }
    return advogados;
  }

  extrairEnvolvidos($) {
    let tableEnvolvidos = $('table:contains("PARTE(S) DO PROCESSO")')
      .next()
      .next(); //table

    const rawPartes = tableEnvolvidos
      .children()
      .children()
      .children()
      .toArray()
      .map((element, index) => {
        return $(element).text().strip();
      });
    const rawAdvogados = tableEnvolvidos
      .children()
      .children()
      .children()
      .children()
      .children()
      .children()
      .children()
      .children()
      .toArray()
      .map((element, index) => {
        return $(element).text().strip();
      });

    let envolvidos = this.extrairPartes(rawPartes);
    envolvidos = [...envolvidos, ...this.extrairAdvogados(rawAdvogados)];
    envolvidos = [
      ...new Set(
        envolvidos.map((element) => {
          return JSON.stringify(element);
        })
      ),
    ];
    envolvidos = envolvidos.map((element) => {
      return JSON.parse(element);
    });
    return envolvidos;
  }

  extrairOabs(envolvidos) {
    let oabs = envolvidos.map((element, index) => {
      if (element.tipo == 'Advogado') {
        return re.exec(element.nome, re(/\d+\w\/{0,1}\w{2}/));
      }
      return false;
    });
    return oabs.filter(Boolean);
  }

  extrairStatus($) {
    let status = null;
    const rawStatus = $(
      $(
        // body > table.tabela_formulario > tbody > tr:nth-child(2)
        $('body > table.tabela_formulario').children().children()[1]
      ).children()[1] // td:nth-child(2)
    ).text();
    return removerAcentos(rawStatus.strip());
  }

  extrairAndamentos($, dataAtual, numeroProcesso) {
    let andamentos = [];
    const tds = $('body > table.corpo').find('tr');

    tds.each((index, element) => {
      let data = $(
        `body > table.corpo > tbody > tr:nth-child(${
          index + 1
        }) > td:nth-child(4)`
      );
      let descricao = $(
        `body > table.corpo > tbody > tr:nth-child(${
          index + 1
        }) > td:nth-child(2)`
      );
      let observacao = $(
        `body > table.corpo > tbody > tr:nth-child(${
          index + 1
        }) > td:nth-child(3)`
      );

      data = moment(data.text().strip(), 'DD/MM/YYYY').format('YYYY-MM-DD');
      descricao = removerAcentos(descricao.text().strip());
      observacao = removerAcentos(observacao.text().strip());

      let andamento = {
        numeroProcesso: numeroProcesso,
        data: data,
        dataInclusao: dataAtual,
        descricao: descricao,
      };

      if (observacao) {
        andamento['observacao'] = observacao;
      }

      andamentos.push(new Andamento(andamento));
    });

    return andamentos;
  }

  parse(rawProcesso, rawAndamentos) {
    const dataAtual = moment().format('YYYY-MM-DD');

    rawProcesso = cheerio.load(rawProcesso);
    rawAndamentos = cheerio.load(rawAndamentos);

    const capa = this.extrairCapa(rawProcesso);
    const detalhes = this.extrairDetalhes(rawProcesso);
    const envolvidos = this.extrairEnvolvidos(rawProcesso);
    const oabs = this.extrairOabs(envolvidos);
    const status = this.extrairStatus(rawProcesso);
    const andamentos = this.extrairAndamentos(
      rawAndamentos,
      dataAtual,
      detalhes.numeroProcesso
    );

    const processo = new Processo({
      capa: capa,
      detalhes: detalhes,
      envolvidos: envolvidos,
      oabs: oabs,
      qtdAndamentos: andamentos.length,
      origemExtracao: 'OabTJMG',
      status: status,
    });

    return {
      processo: processo,
      andamentos: andamentos,
    };
  }
}

module.exports.TJMGParser = TJMGParser;

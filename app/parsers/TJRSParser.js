const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const querystring = require('querystring');
const { Helper } = require('../lib/util');

const { BaseParser, removerAcentos, traduzir } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJRSParser extends BaseParser {
  /**
   * TJRSParser
   */
  constructor(cnj) {
    super();
    this.content = '';
    this.$ = null;
    this.cnj = cnj;
    this.jsonCapa = {};    
  }

  async acessar(url, data, method, encoding) {      

    let options = {
      url,      
      method,
      responseEncoding: encoding
    }

    if (data)
      options.data = data;

    return axios()
    .then(res => res)
    .catch(err => err);    
  }

  extrairCapa(content) {

    this.setSelector(content)

    this.jsonCapa['classe'] = this.$('#conteudo > table:nth-child(3) > tbody > tr').eq(0).children().eq(1).text().trim();
    this.jsonCapa['assunto'] = [this.$('#conteudo > table:nth-child(3) > tbody > tr').eq(1).children().eq(1).text().trim()];

    this.$('#conteudo > table:nth-child(4) > tbody > tr').each((i, tr) => {      
      let tds = this.$(tr).children();
      let key = Helper.removerEspeciais(this.$(tds).eq(1).text().trim());
      let value = this.$(tds).eq(2).text().trim();

      if (value) {
        this.jsonCapa[Helper.removerAcento(key)] = value;
      }      
    });    

    return {
      uf: 'RS',
      comarca: this.jsonCapa.comarca,
      assunto: this.jsonCapa.assunto,
      classe: this.jsonCapa.classe
    };
  }

  extrairPersonagens(content) {

    this.setSelector(content);

    let personagens = [];
    let partes = [];
    let advogados= [];
    let listaOab = [];

    this.$("#conteudo > table:nth-child(2) > tbody > tr").each((i, tr) => {

      const tds = this.$(tr).children();

      if (i > 0) {
        let nome   = this.$(tds).eq(1).text().replace(/\s+/g,' ').trim();
        let tipo = this.$(tds).eq(1).attr('colspan') ? this.$(tds).eq(2).text() : this.$(tds).eq(3).text();        
        tipo = tipo.replace(/\s+/g,' ').trim();

        if (/RS\s[0-9]+/.test(tipo)) {
          let oab = ` ${tipo.replace(/\s/g,'')}`;
          oab = oab.replace(/([A-Z]{2})([0-9]+)/, '$2$1')
          nome += oab;          
          listaOab.push(oab.trim());
          tipo = 'advogado';          
        } else {
          tipo = Helper.removerAcento(tipo).toLowerCase();
        }

        if (!/nome|advogado\(s\)/i.test(nome)) {
          let personagem = { nome, tipo};
          personagens.push(personagem);
        }
      }

    });

    personagens.forEach((personagem, i) => {
      personagem.titulo === 'advogado' ? partes.push(personagem) : advogados.push(personagem);
    });

    return {
      envolvidos: personagens,
      oabs: listaOab
    };
  }

  extrairAndamentos(content) {

    this.setSelector(content);

    let andamentos = [];
    let andamentosHash = [];
    let links = [];

    this.$('#conteudo > table:nth-child(3) > tbody > tr').each(async (i, tr) => {
      let tds = this.$(tr).children();
      let data = this.$(tds).eq(1).text().trim();
      let descricao = removerAcentos(this.$(tds).eq(2).text().trim());
      let andamento = { data: moment(data.trim(),'DD/MM/YYYY').format('YYYY-MM-DD'), descricao, hash: "", numeroProcesso: this.cnj, obs: "", link: "", linkDocumento: { titulo: "", url: "" } };
      let hash =  Andamento.criarHash(andamento);
      andamento.hash = hash;

      if(this.$(tds).eq(2).find('a').length > 0) {        
        const href = encodeURIComponent(this.$(tds).eq(2).find('a').attr('href'));
        let teste = querystring.parse(href);
        console.log('123');
        console.log(teste);
        links.push({url:`https://www.tjrs.jus.br/site_php/consulta/${href}`, hash});
      }

      if (andamentosHash.indexOf(hash) !== -1) {
        let count = andamentosHash.filter((element) => element === hash).length;
        andamento.descricao = `${andamento.descricao} [${count + 1}]`;
      }

      andamentos.push(new Andamento(andamento));
      andamentosHash.push(hash);      

    });

    let response = {
      andamentos,
      links
    };

    return response;
  }

  setSelector(content) {
    this.content = content;
    this.$ = cheerio.load(content);
  }

  parse(content) {

    const $ = cheerio.load(content);    
    const capa = this.extrairCapa($);
    const partes = this.extrairPersonagens($);

    console.log(capa);

    Helper.pred('teste');

    return {"capa":'123'}


    // content = cheerio.load(content);

    // const dataAtual = moment().format('YYYY-MM-DD');

    // const capa = this.extrairCapa(content);
    // const detalhes = this.extrairDetalhes(content);
    // const envolvidos = this.extrairEnvolvidos(content);
    // const oabs = this.extrairOabs(envolvidos);
    // const status = this.extrairStatus(content);
    // const andamentos = this.extrairAndamentos(
    //   content,
    //   dataAtual,
    //   detalhes.numeroProcesso
    // );

    // const processo = new Processo({
    //   capa: capa,
    //   detalhes: detalhes,
    //   envolvidos: envolvidos,
    //   oabs: oabs,
    //   qtdAndamentos: andamentos.length,
    //   origemExtracao: 'OabTJSP',
    // });

    // return {
    //   processo: processo,
    //   andamentos: andamentos,
    // };
  }
}

module.exports.TJRSParser = TJRSParser;



// extrairAssunto($) {
//   return removerAcentos(
//     $('td:contains("Assunto:")').next('td').text().strip()
//   );
// }

// extrairClasse($) {
//   return $('td:contains("Classe:")').next('td').text().strip();
// }

// extrairDetalhes($) {
//   let numero = $('td:contains("Processo:")').next('td').text().strip();
//   numero = re.exec(
//     numero,
//     re(/\d{7}\W?\d{2}\W?\d{4}\W?\d\W?\d{2}\W?\d{4}/)
//   )[0];
//   return Processo.identificarDetalhes(numero);
// }

// extrairEnvolvidos($) {
//   let rawEnvolvidosString = '';
//   let rawEnvolvidosList = [];
//   let envolvidos = [];

//   rawEnvolvidosString = $('#tablePartesPrincipais > tbody').text().strip();
//   rawEnvolvidosString = re.replace(rawEnvolvidosString, re(/\s\s\s+/g), ' ');
//   rawEnvolvidosString = re.replace(
//     rawEnvolvidosString,
//     re(/(\s)(\w+\:)/g),
//     'xa0$2'
//   );

//   rawEnvolvidosList = rawEnvolvidosString.split('xa0');

//   envolvidos = rawEnvolvidosList.map((element, index) => {
//     const match = re.exec(element, re(/(?<tipo>\w+)\:\s(?<nome>.*)/));
//     let envolvido = {
//       tipo: traduzir(match.groups.tipo),
//       nome: match.groups.nome,
//     };
//     return JSON.parse(JSON.stringify(envolvido));
//     console.log('novo envolvido', match.groups.tipo);
//   });

//   envolvidos = this.preencherOabs($, envolvidos);

//   envolvidos = envolvidos.map((element) => {
//     return {
//       tipo: element.tipo,
//       nome: removerAcentos(element.nome)
//     }
//   });

//   return envolvidos;
// }

// preencherOabs($, envolvidos) {
//   let movimentosString = '';
//   movimentosString = $('#tabelaTodasMovimentacoes').text();

//   return envolvidos.map((element) => {
//     if (element.tipo == 'Advogado') {
//       let regex = re(
//         `(${element.nome})\\s(\\(OAB\\s(?<oab>\\d+)\\/SP\\))`,
//         'gm'
//       );
//       let oab = re.exec(movimentosString, regex);
//       if (oab) {
//         element.nome = removerAcentos(`(${oab[3]}SP) ${element.nome}`);
//       } else {
//         element.nome = removerAcentos(element.nome);
//       }
//     } else {
//       element.nome = removerAcentos(element.nome);
//     }
//     return element;
//   });
// }

// extrairOabs(envolvidos) {
//   let oab = '';
//   let oabs = envolvidos.map((element) => {
//     if (element.tipo == 'Advogado') {
//       oab = re.exec(element.nome, re(/\((?<oab>\d+\w+)\)/));
//       if (oab) {
//         return oab.groups.oab;
//       } else {
//         return null;
//       }
//     }
//   });

//   return oabs.filter(Boolean);
// }

// extrairStatus(content) {
//   return 'Não informado.';
// }

// extrairAndamentos($, dataAtual, numeroProcesso) {
//   let andamentos = [];
//   const table = $('#tabelaTodasMovimentacoes');
//   const tdsList = table.find('tr');

//   tdsList.each((index, element) => {
//     let data = $(
//       `#tabelaTodasMovimentacoes > tr:nth-child(${
//         index + 1
//       }) > td:nth-child(1)`
//     );
//     data = moment(data.text().strip(), 'DD/MM/YYYY').format('YYYY-MM-DD');
//     let descricaoRaw = $(
//       `#tabelaTodasMovimentacoes > tr:nth-child(${
//         index + 1
//       }) > td:nth-child(3)`
//     );

//     let observacao = descricaoRaw.find('span')[0].children[0].data.strip();
//     let descricao = re.replace(descricaoRaw.text(), observacao, '').strip();
//     observacao = re.replace(observacao, re(/\s\s+/g), ' ');
//     observacao = removerAcentos(observacao);

//     let andamento = {
//       numeroProcesso: numeroProcesso,
//       data: data,
//       dataInclusao: dataAtual,
//       descricao: removerAcentos(descricao),
//     };
//     if (observacao) {
//       andamento['observacao'] = observacao;
//     }
//     andamentos.push(new Andamento(andamento));
//   });

//   return andamentos;
// }

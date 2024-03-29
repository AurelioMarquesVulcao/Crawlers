const cheerio = require('cheerio');
const { enums } = require('../configs/enums');
const fs = require('fs');

const { BaseParser, removerAcentos } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const { replace } = require('xregexp');
const { Helper } = require('../lib/util');

class JTEParser extends BaseParser {
  /**
   * JTEParser
   */
  constructor() {
    super();
  }

  // Extract all processes for a given Process number
  // Funcao central da raspagem.
  parse($, $2, contador) {
    let cnj = this.extraiNumeroProcesso($, contador);
    let n = this.detalhes(cnj).numeroProcesso.trim();
    let dadosAndamento = this.andamento($2, n);
    // extrai vara/ comarca/ e 1 distribuição
    let primeiraDistribuicao = this.extraiDadosDosAndametos(
      $, dadosAndamento, contador);
    
    let dadosProcesso = new Processo({
      capa: this.capa($, cnj, primeiraDistribuicao),
      oabs: this.removeVazios(this.Oabs($)),
      qtdAndamentos: this.numeroDeAndamentos($2),
      origemExtracao: enums.nomesRobos.JTE,
      envolvidos: this.envolvidos($),
      //advogados: this.advogados($),
      // "origemDados": enums.nomesRobos.JTE,  // verificar esse campo.
      detalhes: this.detalhes(cnj),
    });

    console.log('O processo possui ' + this.numeroDeAndamentos($2) + ' andamentos');
    return { processo: dadosProcesso, andamentos: dadosAndamento, };
  }

  /**
   * Funcao secundaria - organiza os dados da capa
   * @param {html} $ Html que possui os dados de capa
   * @param {string} numeroProcesso Numero do processo obtido do extrator.
   * @param {object} datas Comarca, Vara, Fase, Primeira Distribuição
   * @returns {object} Retorna todos os elementos da capa
   */
  capa($, numeroProcesso, datas) {
    let capa = {
      uf: this.estado($, numeroProcesso), // inserir uf na raspagem do puppeteer
      comarca: datas.comarca, // perguntar onde extraio a comarca
      vara: datas.vara,
      fase: datas.fase, // perguntar onde extraio a comarca
      assunto: this.extraiAssunto($), // inserir raspagem de assunto na fase de testes
      classe: this.extraiClasseCapa($).trim(),
      dataDistribuicao: datas.primeiraDistribuicao,
      instancia: this.instancia($),
      audiencias: this.audiencias($),
    };
        return capa;
  }

  audiencias($) {
    let resultado;
    try {
      let parse = this.removeVazios(
        $('#mat-tab-content-1-0 > div > detalhes-aba-geral > div > div:nth-child(14)').text().split('\n'));
      if (parse.length < 1) {
        parse = this.removeVazios(
          $('#mat-tab-content-0-0 > div > detalhes-aba-geral > div > div:nth-child(14)').text().split('\n'));
      }
            try{
        resultado = [{ data: Helper.data2(parse[1]), tipo: 'N/I' }];
      }catch(e){
        resultado = [{ data: Helper.data2(parse[0]), tipo: 'N/I' }];  
      }
      if(resultado[0].data == "Invalid Date"){
        throw "Erro na captura de Data"
      }
    } catch (e) {
      resultado = [];
    }

    
    return resultado;
  }

  detalhes(numeroProcesso) {
    // let numeroProcesso = this.extraiNumeroProcesso($)
    let detalhes = Processo.identificarDetalhes(numeroProcesso);

    return detalhes;
  }

  // funcao secundaria - organiza os dados dos advogados
  advogados($) {
    let resultado = [];
    for (let i in this.extraiAdvogadoOab($)) {
      let advogado = {
        nome:
          `(${this.extraiAdvogadoOab($)[i][0]})` +
          this.extraiAdvogadoOab($)[i][1],
        tipo: 'Advogado',
        // Adaptado para incluir advogado nas partes envolvidas
        // oab: {
        //   uf: this.extraiAdvogadoOab($)[i][0].split('-')[1],
        //   numero: this.extraiAdvogadoOab($)[i][0].split('-')[0],
        //   oab: this.extraiAdvogadoOab($)[i][0]
        // }
      };
      resultado.push(advogado);
    }
    return resultado;
  }

  // funcao secundaria - organiza os dados dos envolvidos
  envolvidos($) {
    let advogados = this.advogados($);
    let resultado = [];
    // comitado para padronizar o advogado no Banco de dados.
    // for (let i in this.extraiAdvogadoOab($)) {
    //   let advogado = {
    //     nome: "(" + this.extraiAdvogadoOab($)[i][0] + ")" + " " + this.extraiAdvogadoOab($)[i][1],
    //     tipo: "Advogado"
    //   }
    //   resultado.push(advogado)
    // }
    let envolvidos = this.extraiEnvolvidos($);
    for (let i in envolvidos) {
      let separaNome = envolvidos[i].split(':');
      let envolvido = {
        nome: separaNome[1].trim(),
        tipo: separaNome[0].trim(),
      };
      resultado.push(envolvido);
    }
    for (let i in advogados) {
      resultado.push(advogados[i]);
    }

    
    return resultado;
  }

  // funcao secundaria - organiza os dados das oabs
  Oabs($) {
    let resultado = [];
    for (let i in this.extraiAdvogadoOab($)) {
      resultado.push(this.extraiAdvogadoOab($)[i][0]);
    }
    return resultado;
  }

  // funcao secundaria - organiza os dados dos andamentos
  andamentos($) { }

  extraiAssunto($) {
    let resultado = [];
    $('ion-chip').each(async function (element) {
      let datas = $(this).text(); //.split('\n');
      if (!!datas) {
        resultado.push(datas);
      }
    });
    resultado = this.removeVazios(resultado);
    if (!resultado) return 'Assunto nao Especificado';
    
    if (resultado.length == 0) {
      resultado = '';
      // throw "Não pegou assunto, reprocessar"
    }
    return resultado;
  }

  estado($, numeroProcesso) {
    let resultado = 'Estado indeterminado';
    let dados = this.detalhes(numeroProcesso).tribunal;
    if (dados == 2 || dados == 15) resultado = 'SP';
    if (dados == 1) resultado = 'RJ';
    // if (dados == 15) resultado = 'SP'
    if (dados == 3) resultado = 'MG';
    // if (dados == 21) resultado = 'RN';
    if (dados == 5) resultado = 'BA';
    if (dados == 4) resultado = 'RS';
    if (dados == 6) resultado = 'PE';
    if (dados == 7) resultado = 'CE';
    if (dados == 8) resultado = '';
    if (dados == 9) resultado = 'PR';
    if (dados == 10) resultado = '';
    if (dados == 11) resultado = '';
    if (dados == 12) resultado = 'SC';
    if (dados == 13) resultado = 'PB';
    if (dados == 14) resultado = '';
    if (dados == 16) resultado = 'MA';
    if (dados == 17) resultado = 'ES';
    if (dados == 18) resultado = 'GO';
    if (dados == 19) resultado = 'AL';
    if (dados == 20) resultado = 'SE';
    if (dados == 21) resultado = 'RN';
    if (dados == 22) resultado = 'PI';
    if (dados == 23) resultado = 'MT';
    if (dados == 24) resultado = 'MS';
    return resultado;
  }

  extraiDadosDosAndametos($, andamentos, contador) {
    let dados;
    let data;
    let fase = andamentos[0].descricao;
    if (!!this.extraiVaraCapa($, contador)) {
      for (let i = 0; i < andamentos.length; i++) {
        data = andamentos[i].data;
      }
      let primeiraDistribuicao = data;
      return {
        vara: this.extraiVaraCapa($, contador).vara,
        comarca: this.extraiVaraCapa($, contador).comarca,
        primeiraDistribuicao: primeiraDistribuicao,
        fase: fase,
      };
    } else {
      for (let i = 0; i < andamentos.length; i++) {
        if (andamentos[i].descricao.indexOf('Audiencia inicial designada') > -1)
          dados = andamentos[i].descricao;
        data = andamentos[i].data;
      }
      
      try {
        if (!!dados) {
          let vara = dados.split('-')[1].split('de')[0].trim();
          
          let comarca = dados.split(/ DE /gim)[1].replace(')', '').trim();
          let primeiraDistribuicao = data;
          return {
            vara: vara,
            comarca: comarca,
            primeiraDistribuicao: primeiraDistribuicao,
            fase: fase,
          };
        } else {
          let primeiraDistribuicao = data;
          return {
            vara: '',
            comarca: '',
            primeiraDistribuicao: primeiraDistribuicao,
            fase: fase,
          };
        }
      } catch (e) {
        let primeiraDistribuicao = data;
        return {
          vara: '',
          comarca: '',
          primeiraDistribuicao: primeiraDistribuicao,
          fase: fase,
        };
      }
    }
  }

  extraiVaraCapa($, contador) {
    // let resultado = "não possui vara"
    let resultado;
    let vara;
    let comarca;
    let processo = '';

    $(
      `#mat-tab-content-${contador}-0 > div > detalhes-aba-geral > div > p`
    ).each(async function (element) {
      let datas = $(this).text().split('\n');
      processo = datas[0];
    });
    let data = this.regexVaraComarca(processo);
    let cnj = this.extraiNumeroProcesso($, contador).replace(/[-.]/g, '');
    console.log(cnj);
    const regex = /(gabinete\sd[aoe])/i;
    if (regex.test(data[2])) {
      vara = `Região ${cnj.slice(cnj.length - 6, cnj.length - 4)}`;
      comarca = 'Tribunal Regional do Trabalho';
      resultado = { vara, comarca };
    } else {
      vara = removerAcentos(data[2]);
      comarca = removerAcentos(data[3]);
      resultado = { vara, comarca };
    }

    return resultado;
  }

  regexVaraComarca(str) {
    const regex = /(?:^|\n[\t ]*).*?(\d)º.*?-\s*(.+?D[EO].+?)\s*D[EOA]\s*(.+)\s*/gim;
    let m;
    let resultado = [];

    while ((m = regex.exec(str)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
        regex.lastIndex++;
      }

      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        resultado.push(`${match}`);
        
      });
    }
    return resultado;
  }
  instancia($) {
    let resultado;
    $('detalhes-aba-geral p').each(async function (element) {
      let datas = $(this).text().split('\n');
      // resultado.push(datas[0].split('-')[0].trim())
      
      resultado = datas[0].split('-')[0].trim();
      if (resultado.match(/([0-9]{1})/)) {
        resultado = resultado.match(/([0-9]{1})/)[1];
      } else {
        resultado = null;
      }
    });
    return resultado;
  }

  extraiClasseCapa($) {
    let classe = [];

    $('.item-valor-padrao').each(async function (element) {
      let advogados = $(this).text().split('\n');
      let data = new JTEParser().removeVazios(advogados).join(' ');
      classe.push(data);
    });

    return classe[0];
  }

  // retorna array com numero do processo.
  extraiNumeroProcesso($, contador) {
    let datas = [];
    let resultado = '';
    $(
      `#mat-tab-content-${contador}-0 > div > detalhes-aba-geral > div > span.item-painel-titulo`
    ).each(async function (element) {
      let numero = $(this).text().split('\n')[0];
      if (!!numero) resultado = numero;
    });
    let numeroProcesso = resultado.trim();
    return numeroProcesso;
  }

  // retornar um array com os dados dos envolvidos
  extraiEnvolvidos($) {
    let resultado = [];
    $('.item-painel-cabecalho').each(async function (element) {
      let polo = $(this).text().split('\n');
      polo = new JTEParser().removeVazios(polo).join(' ');
      resultado.push(polo);
    });
    return resultado;
  }

  // retorna um array para cada advogado (oab/nome) do processo
  extraiAdvogadoOab($) {
    let Oab = [];
    let resultado = [];
    let advogado = [];
    $('.item-valor-padrao').each(async function (element) {
      let advogados = $(this).text().split('\n');
      let data = new JTEParser().removeVazios(advogados).join(' ');
      let OAB = new JTEParser().separaAdvogadoOab(data).oab;
      advogado = [OAB, new JTEParser().separaAdvogadoOab(data).advogado];
      if (OAB.length > 2) resultado.push(advogado);
    });
    return resultado;
  }

  // verifica um array e pega os numeros de OAB quando estes estão no inicio da string
  separaAdvogadoOab(nome) {
    // Implementar melhorias.
    let Oab = '';
    let advogado = '';
    let numero = nome.slice(0, 4);
    let pegaOab = nome.slice(0, nome.indexOf('-') + 4);
    let pegaNome = nome.slice(nome.indexOf('-') + 4, nome.length);
    // responde se é numero ou não
    if (!isNaN(parseFloat(numero)) && isFinite(numero)) {
      Oab = pegaOab;
      advogado = pegaNome;
    } else nome = false;
    return {
      oab: Oab,
      advogado: advogado,
    };
  }

  validaOAB() { }

  // ----------------------------------------fim da raspagem dos dados do processo-----------------------------------------------

  andamento($, n) {
    let resultado = [];
    let dadosHash = [];
    let contador = 0;
    let texto = this.extraiAndamento($);
    let data = this.extraiDataAndamento($);

    for (let j = 0; j < texto.length; j++) {
      
      let obj = {
        descricao: this.removeVazios(texto[j])[0],
        data: this.ajustaData(this.removeVazios(data[j])[0]),
        numeroProcesso: n,
        observacao: '',
      };
      let hash = Andamento.criarHash(obj);
      if (dadosHash.indexOf(hash) !== -1) {
        let indices = [];
        let array = dadosHash;
        let elemento = hash;
        let idx = array.indexOf(elemento);
        while (idx != -1) {
          indices.push(idx);
          idx = array.indexOf(elemento, idx + 1);
        }
        obj = {
          descricao: this.removeVazios(texto[j])[0] + `[${indices.length}]`,
          data: this.ajustaData(this.removeVazios(data[j])[0]),
          numeroProcesso: n,
          observacao: '',
        };
      }
      dadosHash.push(hash);
      resultado.push(new Andamento(obj));
    }
    return resultado;
  }
  numeroDeAndamentos($) {
    let numero = this.extraiAndamento($).length;
    return numero;
  }
  extraiAndamento($) {
    let resultado = [];
    let dados = [];

    $('ion-item p').each(async function (element) {
      let andamentos = $(this).text().split('\n');
      andamentos = new JTEParser().removeVazios(andamentos);
      
      if (andamentos.length > 0) {
        dados.push(andamentos);
      }
    });

    // verifica duplicidade
    // let hash = Andamento.criarHash(andamento);

    //   if (andamentosHash.indexOf(hash) !== -1) {
    //     let count = andamentosHash.filter((element) => element === hash).length;
    //     andamento.descricao = `${andamento.descricao} [${count + 1}]`;
    //   }
    //   andamentos.push(new Andamento(andamento));
    //   andamentosHash.push(hash);
    // });
    // let c = 0;
    // for (let i = 0; i < dados.length; i++) {
    //   for (let j = 0; j < dados.length; j++) {
    //     if (dados[i][0] === dados[j][0] && i != j) {
    //       c++
    //       dados[i][0] = dados[j] + ' [' + c + ']'
    //     }
    //   }
    // }
    resultado = dados;
    return resultado;
  }

  extraiDataAndamento($) {
    let resultado = [];

    $('ion-text h4').each(async function (element) {
      let andamentos = $(this).text().split('\n');
      andamentos = new JTEParser().removeVazios(andamentos);
      
      if (andamentos.length > 0) resultado.push(andamentos);
    });
    return resultado;
  }

  // funcao de limpeza de dados - remove string de espaço vazios e espaço vazio das strings que estão em um array
  removeVazios(array) {
    let limpo = [];
    let resultado = [];
    let i = 0;
    for (i in array) {
      if (array[i].length > 2) {
        limpo.push(removerAcentos(array[i].trim()));
      }
    }
    // com essas linhas de código abaixo eu não preciso remover as linhas vazias dos array's
    for (let j of limpo) {
      if (j.length > 2) {
        resultado.push(j);
      }
    }
    return resultado;
  }

  // ajusta data brasil para Internacional recebe uma data por vez.
  ajustaData(datas) {
    let dia = datas.slice(0, 2);
    let mes = datas.slice(2, 5);
    let ano = datas.slice(5, 10);
    let data = ano + '-' + mes + '-' + dia;
    return data;
  }
  mascaraNumero(numeroProcesso) {
    let resultado = '';
    resultado =
      numeroProcesso.slice(0, 7) +
      '-' +
      numeroProcesso.slice(7, 9) +
      '.' +
      numeroProcesso.slice(9, 13) +
      '.' +
      numeroProcesso.slice(13, 14) +
      '.' +
      numeroProcesso.slice(
        numeroProcesso.length - 6,
        numeroProcesso.length - 4
      ) +
      '.' +
      numeroProcesso.slice(numeroProcesso.length - 4, numeroProcesso.length);

    return resultado;
  }
} // Fim da classe TJPRParser

module.exports.JTEParser = JTEParser;
// (() => {
//   let $ = cheerio.load(obj);
//   let teste = new JTEParser().audiencias($)
//   teste
// })()

const Crypto = require('crypto-js');
const winston = require('winston');
const moment = require('moment');
const Axios = require('axios');

const { Token } = require('../models/schemas/token');

const { enums } = require('../configs/enums');
const { Robo } = require('../lib/robo');

class Helper {
  /**
   * Converte data comum para formato Date. sem alterar o fuso horário
   * @param {string} data Data comum. Ex.: 25/02/2020 09:40
   * @returns {string} 2020-01-01T10:10.000Z
   */
  static data(data) {
    // O GMT-0000 mantem a hora que você inseriu sem alterar fuso -3
    // se quiser inserir fuso, ex.: horario de brazilia -3GMT.
    //GMT-0300
    let regex = data.replace(
      /([0-9]{1,2})\W([0-9]{1,2})\W([0-9]{4})\s([0-9]{2}\W[0-9]{2})/i,
      '$3-$2-$1 $4 GMT-0000'
    );
    console.log(regex);
    return new Date(regex);
  }

  /**
   * Converte data comum para formato Date. sem alterar o fuso horário
   * @param {string} data Data comum. Ex.: 25/02/2020 09:40
   * @returns {string} 2020-01-01T10:10.000Z
   */
  static data2(data) {
    // O GMT-0000 mantem a hora que você inseriu sem alterar fuso -3
    // se quiser inserir fuso, ex.: horario de brazilia -3GMT.
    //GMT-0300
    let regex = data.replace(
      /(\D+)([0123]?\d)\W([01]\d)\W(\d{4})\s+([012]\d\W[0-5]\d)(\D+)/i,
      '$4-$3-$2 $5 GMT-0000'
    );
    console.log(regex);
    return new Date(regex);
  }

  /**
   * Gera um hash em sha1 para o parametro fornecido
   * @param {string} texto Texto para gerar o hash
   */
  static hash(texto) {
    const cifra = Crypto.SHA1(texto);
    return cifra.toString();
  }

  static exit(signal = 0) {
    process.exit(signal);
  }

  static pre(param) {
    console.log(param);
  }

  static pred(param, signal = 0) {
    this.pre(param);
    this.exit(signal);
  }

  static removerEspacosEmBranco(texto) {
    return texto.replace(/\n+|\s+|\t+/g, ' ').trim();
  }

  static removerEspeciais(texto) {
    return texto
      .replace(/\n+|\t+/g, ' ')
      .replace(/\:+/, '')
      .replace(/\s+/g, '_')
      .replace(/\(+|\)+/g, '')
      .trim();
  }

  static removerAcento(texto) {
    return texto
      .toLowerCase()
      .replace(/[ÁÀÂÃÄ]/gi, 'a')
      .replace(/[ÉÈÊË]/gi, 'e')
      .replace(/[ÍÌÎÏ]/gi, 'i')
      .replace(/[ÓÒÔÕÖ]/gi, 'o')
      .replace(/[ÚÙÛÜ]/gi, 'u')
      .replace(/[Ç]/gi, 'c');
  }

  static async resgatarNovoToken() {
    const robo = new Robo();
    const data =
      '{\n	"Login":"extratificador_bigdata@impacta.adv.br",\n	"Senha":"extratificador2019"\n}';
    const config = {
      method: 'post',
      url: 'http://172.16.16.3:8083/login/',
      headers: {
        'Content-Type': 'text/plain',
      },
      data: data,
    };
    return axios(options);
  }

  static async enviarFeedback(msg) {
    const robo = new Robo();
    let resposta = await Token.hasValid();
    let token;

    if (resposta.sucesso) {
      token = resposta.token;
    } else {
      resposta = await this.resgatarNovoToken();
      if (resposta.responseBody.Sucesso) {
        await new Token({ token: resposta.responseBody.Token }).save();
      } else {
        console.log('Não foi possivel recuperar o Token');
        process.exit(1);
      }
    }

    return await robo.acessar({
      url: enums.bigdataUrls.resultadoConsulta,
      method: 'POST',
      encoding: '',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      usaProxy: false,
      usaJson: true,
      params: msg,
    });
  }

  static async feedbackDocumentos(msg) {
    const robo = new Robo();
    // let resposta = await Token.hasValid();
    // let token;
    //
    // if (resposta.sucesso) {
    //   token = resposta.token;
    // } else {
    //   resposta = await this.resgatarNovoToken();
    //   if (resposta.responseBody.Sucesso) {
    //     await new Token({ token: resposta.responseBody.Token }).save();
    //   } else {
    //     console.log("Não foi possivel recuperar o Token");
    //     process.exit(1);
    //   }
    // }

    const config = {
      method: 'post',
      url: enums.bigdataUrls.resultadoDocumentos,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
      },
      data: JSON.stringify(msg),
    };

    return Axios(config)
      .then(function (response) {
        console.log(JSON.stringify(response.data));
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  static async downloadImage(url, headers) {
    return await Axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
    }).then((response) => {
      return Buffer.from(response.data).toString('base64');
    });
  }

  static async downloadAudio(url, headers) {
    return await Axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
    }).then((response) => {
      return Buffer.from(response.data).toString('base64');
    });
  }

  static async downloadFiles(url, headers) {
    return await Axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
      headers: headers,
    }).then((response) => {
      return Buffer.from(response.data).toString('base64');
    });
  }

  static async quebrarCaptcha(captchaString, tipo) {
    return await new Robo().acessar({
      url: enums.bigdataUrls.captchaDecoder,
      method: 'POST',
      usaProxy: false,
      usaJson: true,
      params: { captcha: captchaString, tipp: tipo },
    });
  }

  /**
   * Ordenar uma por uma propriedade ASC
   * @param {Array} lista Lista de que deseja ordenar
   * @param {string} prop String do nome da propriedade
   * @param {number} sortOrder int indicando a ordem de classificacao
   */
  static ordenar(lista, prop, sortOrder) {
    if (sortOrder == 0) this.ordenarCrescente(lista, prop);
    else if (sortOrder == 1) this.ordenarDecrescente(lista, prop);
    else null;
  }

  /**
   * Ordenar uma por uma propriedade ASC
   * @param {Array} lista Lista de que deseja ordenar
   * @param {string} prop String do nome da propriedade
   */
  static ordenarCrescente(lista, prop) {
    return lista.sort((a, b) => {
      if (a[prop] < b[prop]) {
        return -1;
      }
      if (a[prop] > b[prop]) {
        return 1;
      }
    });
  }

  /**
   * Ordenar uma por uma propriedade DESC
   * @param {Array} lista Lista de que deseja ordenar
   * @param {string} prop String do nome da propriedade
   */
  static ordenarDecrescente(lista, prop) {
    return lista.sort((a, b) => {
      if (a[prop] < b[prop]) {
        return 1;
      }
      if (a[prop] > b[prop]) {
        return -1;
      }
    });
  }
}

class CnjValidator {
  /**
   * No CNJ NNNNNNN-xx.AAAA.J.TR.OOOO
   * @param NNNNNNN numero sequencial
   * @param AAAA ano
   * @param JTR orgao e tribunal
   * @param OOOO origem (codigo comarca)
   * @returns {string|*}
   */
  static calcula_mod97(NNNNNNN, AAAA, JTR, OOOO) {
    let valor1 = '';
    let resto1 = 0;
    let valor2 = '';
    let resto2 = 0;
    let valor3 = '';
    valor1 = this.preencheZeros(NNNNNNN, 7);
    resto1 = parseInt(valor1) % 97;
    valor2 =
      this.preencheZeros(resto1, 2) +
      this.preencheZeros(AAAA, 4) +
      this.preencheZeros(JTR, 3);
    resto2 = parseInt(valor2) % 97;
    valor3 = this.preencheZeros(resto2, 2) + this.preencheZeros(OOOO, 4) + '00';
    return this.preencheZeros(98 - (parseInt(valor3) % 97), 2);
  }

  static valida_mod97(NNNNNNN, DD, AAAA, JTR, OOOO) {
    let valor1 = '';
    let resto1 = 0;
    let valor2 = '';
    let resto2 = 0;
    let valor3 = '';
    valor1 = this.preencheZeros(NNNNNNN, 7);
    resto1 = parseInt(valor1) % 97;
    valor2 =
      this.preencheZeros(resto1, 2) +
      this.preencheZeros(AAAA, 4) +
      this.preencheZeros(JTR, 3);
    resto2 = parseInt(valor2) % 97;
    valor3 =
      this.preencheZeros(resto2, 2) +
      this.preencheZeros(OOOO, 4) +
      this.preencheZeros(DD, 2);
    return parseInt(valor3) % 97 == 1;
  }

  static preencheZeros(numero, quantidade) {
    let temp = `${numero}`;
    let retorno = '';
    if (quantidade < temp.length) return temp;
    else {
      for (let i = 0; i < quantidade - temp.length; i++)
        retorno = '0' + retorno;
      return retorno + temp;
    }
  }

  static validar(cnj) {
    let sub = cnj.replace('-', '.').split('.');
    let NNNNNNN = sub[0];
    let DD = sub[1];
    let AAAA = sub[2];
    let JTR = sub[3] + sub[4];
    let OOOO = sub[5];

    return this.valida_mod97(NNNNNNN, DD, AAAA, JTR, OOOO);
  }
}

/**
 * @type {Class} Logger
 * @param {string} logLevel
 * @param {string} nomeArquivo
 * @param {object} options
 * @param {string} options.nomeRobo
 * @param {null|string} options.NumeroDoProcesso
 * @param {null|string} options.NumeroOab
 */
class Logger {
  constructor(
    logLevel = 'info',
    nomeArquivo = '',
    { nomeRobo, NumeroDoProcesso, NumeroOab } = {}
  ) {
    this.nomeRobo = nomeRobo;
    this.NumeroProcesso = NumeroDoProcesso;
    this.numeroOab = NumeroOab;
    this.logs = [];
    this.consoleLogger = winston.createLogger({
      level: 'info',
      format: winston.format.simple(),
      transports: [new winston.transports.Console()],
    });
    this.fileLogger = winston.createLogger({
      level: logLevel,
      format: winston.format.simple(),
      transports: [
        new winston.transports.File({
          filename: nomeArquivo,
        }),
      ],
    });
  }

  /**
   * Faz um print no console
   * @param {string} log mensagem
   */
  info(log) {
    let identificador = this.NumeroProcesso
      ? `CNJ: ${this.NumeroProcesso}`
      : `OAB: ${this.numeroOab}`;
    this.logs.push(`${this.nomeRobo} - ${identificador} - ${log}`);
    return this.consoleLogger.info(
      `${this.nomeRobo} - ${identificador} - ${log}`
    );
  }

  /**
   * Faz um print no console e salva o log em arquivo
   * @param {string} level nivel de importancia do log
   * @param {string} log mensagem
   */
  log(level, log) {
    this.info(log);
    return this.fileLogger.log(level, `[${moment().format()}] ${log}`);
  }
}

class Cnj {
  /**
   * Separa a string do processo com cada uma das suas infomações
   * @param {string} numero String com o numero do processo sem mascara
   * @returns sequencial, dois, ano, tipo, estado, comarca
   */
  static processoSlice(numero) {
    let sequencial = numero.slice(0, 7);
    let dois = numero.slice(7, 9);
    let ano = numero.slice(9, 13);
    let tipo = numero.slice(13, 14);
    let estado = numero.slice(14, 16);
    let comarca = numero.slice(16, 20);

    return { sequencial, dois, ano, tipo, estado, comarca };
  }
  // separa os zeros a serem acrecidos no inicio do numero sequencial
  corrigeSequencial(sequencial) {
    let novoSequencial = sequencial;
    let zero = '';
    for (let i = 0; i < sequencial.length; i++) {
      if (sequencial[i] == '0') {
        novoSequencial = novoSequencial.slice(1, novoSequencial.length);
        zero += '0';
      } else {
        break;
      }
    }
    let seq = novoSequencial;
    return { seq, zero };
  }
  // --------- Funções melhoradas ---------

  /**
   * Cria a mensagem a ser enviada para a fila
   * @param {string} numero
   */
  static criaPostJTE(numero, status = 'Principal') {
    let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true}, "estado": "${status}"`;
    return post;
  }
  /**
   * Cria um numero CNJ para consumo.
   * @param {number} ultimoSequencial Ultimo numero sequencial obtido no BigData V2.
   * @param {number} Tribunal Numero que representa o Estado.
   * @param {number} unidadeOrigem Numero da comarca.
   * @returns String com cnj valido.
   */
  static organizaCNJ(ultimoSequencial, Tribunal, unidadeOrigem) {
    // console.log(ultimoSequencial, Tribunal, unidadeOrigem);
    let sequencial = this.completaNumero(ultimoSequencial, 'ultimoSequencial');
    let tribunal = this.completaNumero(Tribunal, 'Tribunal');
    let origem = this.completaNumero(unidadeOrigem, 'unidadeOrigem');
    return `${sequencial}00${new Date().getFullYear}5${tribunal}${origem}`;
  }

  /**
   * Ajusta o numero para string e completa com zeros para ficar no padrão do numero CNJ
   * @param {number} numero
   * @param {string} tipo
   */
  static completaNumero(numero, tipo) {
    let teste;
    if (tipo == 'unidadeOrigem') {
      teste = 4;
    } else if (tipo == 'Tribunal') {
      teste = 2;
    } else if (tipo == 'ultimoSequencial') {
      teste = 7;
    }
    let resultado = '';
    numero = numero.toString();
    if (numero.length < teste) {
      let zero = teste - numero.length;
      for (let i = 0; i < zero; i++) {
        resultado += '0';
      }
      resultado = resultado + numero;
    } else {
      resultado = numero;
    }
    return resultado;
  }
}

module.exports.Helper = Helper;
module.exports.CnjValidator = CnjValidator;
module.exports.Logger = Logger;
module.exports.Cnj = Cnj;

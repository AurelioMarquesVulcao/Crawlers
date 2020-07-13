const Crypto = require('crypto-js');
const winston = require('winston');
const moment = require('moment');

const { enums } = require('../configs/enums');
const { Robo } = require('../lib/robo');

class Helper {
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
    return texto
      .replace(/\n+|\s+|\t+/g, " ")      
      .trim();
  }

  static removerEspeciais(texto) {    
    return texto         
      .replace(/\n+|\t+/g, ' ')
      .replace(/\:+/,'')
      .replace(/\s+/g,'_')
      .replace(/\(+|\)+/g,'')
      .trim();
  }

  static removerAcento(texto) {    
    return texto
      .toLowerCase()
      .replace(/[ÁÀÂÃÄ]/gi, "a")
      .replace(/[ÉÈÊË]/gi, "e")
      .replace(/[ÍÌÎÏ]/gi, "i")
      .replace(/[ÓÒÔÕÖ]/gi, "o")
      .replace(/[ÚÙÛÜ]/gi, "u")
      .replace(/[Ç]/gi, "c");
  }

  static async enviarFeedback(msg) {
    const robo = new Robo();
    return await robo.acessar({
      url: enums.bigdataUrls.resultadoConsulta,
      method: 'POST',
      encoding: '',
      usaProxy: false,
      usaJson: true,
      params: msg,
    });
  }
}

class Logger {
  constructor(
    logLevel = 'info',
    nomeArquivo = '',
    { nomeRobo, NumeroDoProcesso = null, NumeroOab = null } = {}
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

module.exports.Logger = Logger;
module.exports.Helper = Helper;

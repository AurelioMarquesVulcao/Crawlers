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

  static async enviarFeedback(msg) {
    const robo = new Robo();
    return await robo.acessar(
      enums.bigdataUrls.resultadoConsulta,
      'POST',
      '',
      false,
      true,
      msg,
      {}
    );
  }
}

class Logger {
  constructor(logLevel = 'info', nomeArquivo) {
    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.simple(),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: nomeArquivo,
        }),
      ],
    });
  }

  info(log) {
    return this.logger.info(`[${moment().format()}] ${log}`);
  }

  log(level, log) {
    return this.logger.log(level, `[${moment().format()}] ${log}`);
  }
}

module.exports.Logger = Logger;
module.exports.Helper = Helper;

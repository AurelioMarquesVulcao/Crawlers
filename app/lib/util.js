const Crypto = require('crypto-js');
const winston = require('winston');
const moment = require('moment');

const { enums } = require('../configs/enums');
const Axios = require('axios');
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
    return await new Robo().acessar(
      enums.bigdataUrls.resultadoConsulta,
      'POST',
      '',
      false,
      true,
      msg,
      {}
    );
  }

  static async downloadImage(url) {
    return await Axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer',
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

  static async quebrarCaptcha(captchaString, tipo) {
    return await new Robo().acessar({
      url: enums.bigdataUrls.captchaDecoder,
      method: 'POST',
      usaProxy: false,
      usaJson: true,
      params: { captcha: captchaString, tipp: tipo },
    });
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

const cheerio = require('cheerio');
const moment = require('moment');

const {
  BaseException,
  RequestException,
  ExtracaoException,
} = require('../models/exception/exception');
const { Robo } = require('../lib/robo');
const { OabTJBAPortalParser } = require('../parsers/TJBAParser');
//  Aqui dentro terei os parsers para qualquer tipo de processo envolvendo o TJBA

class ExtratorBase {
  /**
   * Extrator Base
   * @param {string} url Url de acesso ao site.
   * @param {boolean} isDebug Esta rodando em modo debug?
   */
  constructor(url, isDebug) {
    this.isDebug = isDebug;
    this.url = url;
    this.robo = new Robo();
  }
}

class OabTJBAPortal extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new OabTJBAPortalParser();
  }

  async extrair(numeroDaOab) {
    try {
      let objResponse = await this.robo.acessar(
        `${this.url}`,
        'GET',
        'latin1', //TODO verificar validade do LATIN1 como encoder para TJBA
        true
      );

      // Verifica se existe algum tipo extra de validação que deve acontecer
      // como captchas e etc
      let preParse = await this.preParse(objResponse.responseBody);

      if (preParse.response) response = preParse.response;

      if (!preParse.captcha && preParse.inconsistencias.length == 0) {
        extracao = await this.parser(oab, response);
      }
      //O codigo abaixo é relacionado ao uso de captcha no TJBA entre outros.
      // else {
      //   if (preParse.captcha) {
      //     console.log('Tentativa de quebra de captcha!');

      //     //TODO aplicar logica de session apresentada no TJSP do Bruno
      //     let cookies = objResponse.cookies.join('');

      //   }
    } catch (e) {
      if (e instanceof RequestException) {
        throw new RequestException(e.code, e.status, e.message);
      } else if (e instanceof BaseException) {
        throw new BaseException(e.code, e.message);
      } else if (e instanceof ExtracaoException) {
        if (/ERRO_CAPTCHA/.test(e.code)) {
          //refaz tentativas de captcha (deixar aqui mas portal tjba n usa captcha por enquanto)
          throw new ExtracaoException(e.code, null, e.message);
        } else {
          throw new BaseException(e.code, e.message);
        }
      } else {
        if (
          /ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ENOPROTOOPT/.test(e.code)
        ) {
          throw new RequestException(e.code, e.status, e.message);
        }
      }
    }
  }
}

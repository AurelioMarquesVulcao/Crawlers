const cheerio = require('cheerio');
const moment = require('moment');

const {
  BaseException,
  RequestException,
  ExtracaoException,
} = require('../models/exception/exception');
const { Robo } = require('../lib/robo');
const { TJBAPortalParser } = require('../parsers/TJBAPortalParser');
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
    this.parser = new TJBAPortalParser();
  }

  async extrair(numeroDaOab) {
    try {
      let objResponse = await this.robo.acessar(
        `${this.url}`,
        'POST',
        'latin1', //TODO verificar validade do LATIN1 como encoder para TJBA
        false,
        false,
        {
          tipo: 'NUMOAB',
          funcao: 'funcOAB',
          processo: numeroDaOab + 'BA',
          'g-recaptcha-response': '',
        }
      );
      let $ = cheerio.load(objResponse.responseBody);
      let codigoBusca = $.html().match(/var busca\s*=\s*'(.*)';/)[1];
      codigoBusca = codigoBusca.trim();

      let cookies = objResponse.responseContent.headers.cookies;
      objResponse = await this.robo.acessar(
        `https://www.tjba.jus.br/consulta-processual/api/v1/carregar/oab/${codigoBusca}/1/semCaptcha`,
        'GET',
        'utf-8',
        true,
        false,
        null,
        cookies
      );

      let listaProcessos = objResponse.responseBody.lstProcessos;

      listaProcessos.map(element => {
        new TJBAPortalParser().parse(element);
      });
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

module.exports.OabTJBAPortal = OabTJBAPortal;

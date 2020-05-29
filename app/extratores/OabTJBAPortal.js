const cheerio = require('cheerio');
const { Andamento } = require('../models/schemas/andamento');
const { Logger } = require('../lib/util');

const {
  BaseException,
  RequestException,
  ExtracaoException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJBAPortalParser } = require('../parsers/TJBAPortalParser');

class OabTJBAPortal extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJBAPortalParser();
  }

  async extrair(numeroDaOab) {
    try {
      let resultados = [];
      console.log('1'); // TODO remover
      let objResponse = await this.robo.acessar({
        url: `${this.url}`,
        method: 'POST',
        encoding: 'latin1', //TODO verificar validade do LATIN1 como encoder para TJBA
        usaProxy: false, //proxy
        usaJson: false,
        params: {
          tipo: 'NUMOAB',
          funcao: 'funcOAB',
          processo: numeroDaOab + 'BA',
          'g-recaptcha-response': '',
        },
      });
      console.log('2'); // TODO remover
      let $ = cheerio.load(objResponse.responseBody);
      let codigoBusca = $.html().match(/var busca\s*=\s*'(.*)';/)[1];
      codigoBusca = codigoBusca.trim();

      let cookies = objResponse.cookies;
      objResponse = await this.robo.acessar({
        url: `https://www.tjba.jus.br/consulta-processual/api/v1/carregar/oab/${codigoBusca}/1/semCaptcha`,
        method: 'GET',
        encoding: 'latin1',
        usaProxy: false, //proxy
        usaJson: false,
        headers: { cookies: cookies },
      });

      let listaProcessos = objResponse.responseBody.lstProcessos;
      resultados = await listaProcessos.map(async (element) => {
        const logger = new Logger(
          'info',
          'logs/OabTJBAPortal/OabTJBAPortalInfo.log'
        );
        let extracao = new TJBAPortalParser().parse(element);
        let processo = extracao.processo;
        let andamentos = extracao.andamentos;
        Andamento.salvarAndamentos(andamentos);
        let resultado = await processo.salvar();
        logger.info(
          `Processo: ${
            processo.toObject().detalhes.numeroProcesso
          } salvo | Quantidade de andamentos: ${andamentos.length}`
        );
        return resultado;
      });

      return Promise.all(resultados).then((args) => {
        return {
          resultado: args,
          sucesso: true,
          detalhes: '',
        };
      });
    } catch (e) {
      const logger = new Logger(
        'error',
        `logs/OabTJBAPortal/OabTJBAPortal.log`
      );
      logger.log('error', e.message);
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
        if (/ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ENOPROTOOPT/.test(e.code)) {
          throw new RequestException(e.code, e.status, e.message);
        } else {
          throw e;
        }
      }
    }
  }
}
module.exports.OabTJBAPortal = OabTJBAPortal;

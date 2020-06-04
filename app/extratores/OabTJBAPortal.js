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
const enums = require('../configs/enums').enums;

/**
 * Logger para console e arquivo
 */
let logger;

class OabTJBAPortal extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJBAPortalParser();
    this.numeroDaOab = '';
  }

  async extrair(numeroDaOab) {
    try {
      this.numeroDaOab = numeroDaOab;
      logger = new Logger(
        'info',
        'logs/OabTJBAPortal/OabTJBAPortalInfo.log',
        {
          nomeRobo: enums.nomesRobos.TJBAPortal,
          NumeroDaOab:numeroDaOab,
        }
      );
      let resultados = [];
      logger.info('Fazendo primeira conexão ao website');
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
      logger.info('Conexão ao website concluida.');
      logger.info('Recuperando codigo de busca');
      let $ = cheerio.load(objResponse.responseBody);
      let codigoBusca = $.html().match(/var busca\s*=\s*'(.*)';/)[1];
      codigoBusca = codigoBusca.trim();
      logger.info('Codigo de busca recuperado');
      let cookies = objResponse.cookies;
      logger.info('Fazendo request de captura de processos');
      objResponse = await this.robo.acessar({
        url: `https://www.tjba.jus.br/consulta-processual/api/v1/carregar/oab/${codigoBusca}/1/semCaptcha`,
        method: 'GET',
        encoding: 'latin1',
        usaProxy: false, //proxy
        usaJson: false,
        headers: { cookies: cookies },
      });
      logger.info('Request de captura de processos concluido.');
      let listaProcessos = objResponse.responseBody.lstProcessos;
      logger.info('Iniciando processamento da lista de processos');
      resultados = await listaProcessos.map(async (element) => {
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
        logger.info('Processos extraidos com sucesso');
        return {
          resultado: args,
          sucesso: true,
          detalhes: '',
          logs: logger.logs
        };
      });
    } catch (e) {
      let logger = new Logger(
        'info',
        'logs/OabTJBAPortal/OabTJBAPortalInfo.log',
        {
          nomeRobo: enums.nomesRobos.TJBAPortal,
          NumeroDaOab: numeroDaOab,
        }
      );
      logger.log('error', e);
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

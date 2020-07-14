const cheerio = require('cheerio');
const { Logger } = require('../lib/util');
const { RoboPuppeteer } = require('../lib/roboPuppeteer-rev-000')
const moment = require('moment');
const { Andamento } = require('../models/schemas/andamento');
const re = require('xregexp');
const fs = require('fs');
const querystring = require('querystring');
const axios = require('axios');
const enums = require('../configs/enums').enums;

const { BaseException, RequestException, ExtracaoException, AntiCaptchaResponseException, } = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { JTEParser } = require('../parsers/JTEParser');

const { RoboPuppeteer3 } = require('../lib/roboPuppeteer_teste2')

/**
 * Logger para console e arquivo
 */
let logger;


class ProcJTE extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new JTEParser();
    this.puppet = new RoboPuppeteer3();
    this.dataSiteKey = '6LfDrDsUAAAAAOpZjoH4CP7G3_NJR1ogyeRFlOzR';
  }


  async extrair(numeroProcesso, contador) {
    // let numeroProcesso = NumeroOab
    let dadosProcesso;
    try {

      logger = new Logger(
        'info',
        'logs/ProcJTE/ProcJTE.log', {
        nomeRobo: enums.nomesRobos.JTE,
        numeroProcesso: numeroProcesso,
      }
      );
      // let objResponse = await RoboPuppeteer(numeroProcesso)
      console.log('ligou até aqui');

      let objResponse = await this.puppet.preencheProcesso(numeroProcesso, contador)

      console.log('pegou os dadosa da pagina');

      //Estou carregando paginas locais até resolver o Puppeteer.
      let $ = cheerio.load(objResponse.geral);
      let $2 = cheerio.load(objResponse.andamentos);
      dadosProcesso = this.parser.parse($, $2)
      var processo = dadosProcesso.processo
      await dadosProcesso.processo.salvar()
      await Andamento.salvarAndamentos(dadosProcesso.andamentos)
    } catch (e) {
      console.log(e);
    }

    //  usar return simples apenas para dev
    logger.info('Processos extraidos com sucesso');
    if (!!dadosProcesso) {
      return {
        resultado: dadosProcesso,
        sucesso: true,
        detalhes: '',
        logs: logger.logs
      };
    }


  } // End extrair function


} // End  class TJPR
module.exports.ProcJTE = ProcJTE;

// DEV START'S FOR PROJECT TEST and development
// (async () => {
//   await new ProcJTE().extrair("00021625020145020016")
// })()

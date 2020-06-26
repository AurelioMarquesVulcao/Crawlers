const cheerio = require('cheerio');
const { Logger } = require('../lib/util');
const moment = require('moment');
const { Andamento } = require('../models/schemas/andamento');
const re = require('xregexp');
const fs = require('fs');
const querystring = require('querystring');
const axios = require('axios');
const enums = require('../configs/enums').enums;

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJPRParser } = require('../parsers/TJPRParser');

/**
 * Logger para console e arquivo
 */
let logger;


class OabTJPR extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJPRParser();
    this.dataSiteKey = '6LfDrDsUAAAAAOpZjoH4CP7G3_NJR1ogyeRFlOzR';
  }

  async extrair(numeroDaOab) {
    let resultado = [];
    // Call a page already with the captchas resolved from a local directory.
    var OAB13619p9
    fs.readFile(`test/testCases/TJPR/oab_${numeroDaOab}.html`, 'utf8', (err, data) => {
      console.log(!!data)
      //console.log(err)
      OAB13619p9 = data
    });

    try {
      logger = new Logger(
        'info',
        'logs/OabTJPR/OabTJPRInfo.log',
        {
          nomeRobo: enums.nomesRobos.TJPR,
          NumeroOab:numeroDaOab,
        }
      );

      // Codigo para validar entrada
      // --- Em testes ---

      let objResponse = await this.robo.acessar({
        url: 'http://portal.tjpr.jus.br/civel/publico/consulta/processo.do?actionType=consultar',
        method: 'GET',
        encoding: 'utf8',
        usaProxy: false, //proxy
        usaJson: false,
      });

      //Estou carregando paginas locais até resolver o capcha.
      let $ = cheerio.load(OAB13619p9);
      let links = this.parser.extrairOab($)
      let envolvidos = this.parser.extraiEnvolvidos($)
      var Processos = []
      let i = 0;
      for (i in links) {
        resultado.push(
          await new OabTJPR().extrairProcesso(links[i], envolvidos[i], numeroDaOab)
          )
        Processos.push(
          await resultado[i].processo.salvar()
        )
        await resultado[i].processo.salvar()
        await Andamento.salvarAndamentos(resultado[i].andamentos)
        
      }
    } catch (e) { console.log(e); }
    //console.log(resultado[1].andamentos)
    // console.log(resultado[0].processo)
    console.log('extraido o ' + numeroDaOab);
    
    return Promise.all(Processos).then((args) => {
      logger.info('Processos extraidos com sucesso');
      return {
        resultado: args,
        sucesso: true,
        detalhes: '',
        logs: logger.logs
      };
    });
  } // End extrair function


} // End  class TJPR
module.exports.OabTJPR = OabTJPR;

// DEV START'S FOR PROJECT TEST and development
// (async () => {
//   await new OabTJPR().extrair("44400")
// })()

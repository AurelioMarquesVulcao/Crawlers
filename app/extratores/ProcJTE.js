const cheerio = require('cheerio');
const {
  Logger
} = require('../lib/util');
const moment = require('moment');
const {
  Andamento
} = require('../models/schemas/andamento');
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
const {
  ExtratorBase
} = require('./extratores');
const {
  JTEParser
} = require('../parsers/JTEParser');

/**
 * Logger para console e arquivo
 */
let logger;


class ProcJTE extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new JTEParser();
    this.dataSiteKey = '6LfDrDsUAAAAAOpZjoH4CP7G3_NJR1ogyeRFlOzR';
  }


  async extrair(numeroProcesso) {
    let resultado = [];



    try {
      // Call a page already with the captchas resolved from a local directory.
      var responseDev
      fs.readFile(`app/test/testCases/JTE/g${numeroProcesso}.html`, 'utf8', (err, data) => {
        console.log(!!data)
        //console.log(err)
        // console.log(data);
        responseDev = data
        
      });
      // logger = new Logger(
      //   'info',
      //   'logs/OabTJPR/OabTJPRInfo.log', {
      //     nomeRobo: enums.nomesRobos.JTE,
      //     numeroProcesso: numeroProcesso,
      //   }
      // );
      let objResponse = await this.robo.acessar({
        url: 'https://jte.csjt.jus.br/',
        method: 'GET',
        encoding: 'utf8',
        usaProxy: false, //proxy
        usaJson: false,
      });

      //Estou carregando paginas locais até resolver o Puppeteer.
      let $ = cheerio.load(responseDev);

      let dadosProcesso = this.parser.parse($)
      console.log(dadosProcesso);
      
      // let envolvidos = this.parser.extraiEnvolvidos($)
      var Processos = []
      // let i = 0;
      // for (i in links) {
      //   // resultado.push(
      //   //   await new OabTJPR().extrairProcesso(links[i], envolvidos[i], numeroProcesso)
      //   //   )
      //   // Processos.push(
      //   //   await resultado[i].processo.salvar()
      //   // )
      //   // await resultado[i].processo.salvar()
      //   // await Andamento.salvarAndamentos(resultado[i].andamentos)

      // }
    } catch (e) {
      console.log(e);
    }
    console.log('extraido o ' + numeroProcesso);
    //  usar return simples apenas para dev
    return Processos
    // return Promise.all(Processos).then((args) => {
    //   logger.info('Processos extraidos com sucesso');
    //   return {
    //     resultado: args,
    //     sucesso: true,
    //     detalhes: '',
    //     logs: logger.logs
    //   };
    // });
  } // End extrair function


} // End  class TJPR
module.exports.ProcJTE = ProcJTE;

// DEV START'S FOR PROJECT TEST and development
(async () => {
  await new ProcJTE().extrair("0000004-63.2019.5.21.0001")
})()
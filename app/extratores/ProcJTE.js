const cheerio = require('cheerio');
const { Logger } = require('../lib/util');
const { RoboPuppeteer } = require('../lib/roboPuppeteer')
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


  async extrair(NumeroOab) {
    let numeroProcesso = NumeroOab
    let dadosProcesso;
    try {
      // Call a page already with the captchas resolved from a local directory.
      // var responseDev
      //fs.readFile(`test/testCases/JTE/g${numeroProcesso}.html`, 'utf8', (err, data) => {
        // fs.readFile(`app/test/testCases/JTE/g${numeroProcesso}.html`, 'utf8', (err, data) => {
        //console.log(!!data)
        //console.log(err)
        // console.log(data);
        //responseDev = data
      //});


      //var responseDev2
      //fs.readFile(`test/testCases/JTE/m${numeroProcesso}.html`, 'utf8', (err, data) => {
        // fs.readFile(`app/test/testCases/JTE/m${numeroProcesso}.html`, 'utf8', (err, data) => {
        //console.log(!!data)
        //console.log(err)
        // console.log(data);
        //responseDev2 = data
      //});

      logger = new Logger(
        'info',
        'logs/ProcJTE/ProcJTE.log', {
        nomeRobo: enums.nomesRobos.JTE,
        NumeroOab: NumeroOab,
      }
      );
      let objResponse = await RoboPuppeteer(NumeroOab)
      
      //Estou carregando paginas locais até resolver o Puppeteer.
      let $ = cheerio.load(objResponse.geral);
      
      let $2 = cheerio.load(objResponse.andamentos);

      dadosProcesso = this.parser.parse($, $2)

      //console.log(dadosProcesso.andamentos.slice(0,3));
      //console.log(responseDev2);


      // let envolvidos = this.parser.extraiEnvolvidos($)
      //var processo;
      var processo = dadosProcesso.processo
      console.log(processo);
      console.log(dadosProcesso.andamentos.slice(0,3));
      await dadosProcesso.processo.salvar()
      await Andamento.salvarAndamentos(dadosProcesso.andamentos)
      // console.log(processo);


    } catch (e) {
      console.log(e);
    }
    console.log('extraido o ' + numeroProcesso);
    
    
    //  usar return simples apenas para dev
    logger.info('Processos extraidos com sucesso');
    return {
      resultado: dadosProcesso,
      sucesso: true,
      detalhes: '',
      logs: logger.logs
    };




    // return Promise.all(processo).then((args) => {
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
// (async () => {
//   await new ProcJTE().extrair("02921004920015020074")
// })()
const cheerio = require('cheerio');
const moment = require('moment');
const { Helper } = require('../lib/util');
const { antiCaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const re = require('xregexp');
const axios = require('axios');

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
} = require('../models/exception/exception');

const { ExtratorBase } = require('./extratores');
const { TJRSParser } = require('../parsers/TJRSParser');

const saveFileSync = (path, arquivo, encoding) => {
  try {    
    if(arquivo) {    
      // , encoding  
      require("fs")
        .writeFileSync(path, arquivo, encoding);
    } else {
      console.log('O arquivo não está vindo');
    }
  } catch (error) {
    Helper.pred(error);
  }
}

module.exports.OabTJRS = class OabTJRS extends ExtratorBase {

  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJRSParser();
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
  }

  async resolverCaptchaAudio(oab, url, cookies) {
    
    // const captchaResponse = await this.robo.acessar(
    //   url,
    //   "GET",
    //   null,
    //   true,
    //   false,
    //   null,
    //   { Cookie: cookies }
    // );    
    cookies = cookies.replace(/path\=\//g,'').replace(/\s+/g,' ').trim().replace();

    const captchaResponse = await axios({
      url,
      method: "GET",
      enconding: null,
      headers: {
        Cookie: cookies.replace(/path\=\//)
      }
    });

    saveFileSync(`captcha_${oab}.wav`, captchaResponse.data, 'binary');

    const arquivoCaptcha = Buffer.from(captchaResponse.responseBody).toString("base64");

    const captcha = {      
      audio: arquivoCaptcha,
    };

    const resQuebrarCaptcha = await this.robo.acessar(
      `http://172.16.16.8:5000/api/solve`,
      "post",
      "utf8",
      false,
      true,
      captcha
    );

    return resQuebrarCaptcha.responseBody;
  }  

  extrairLinkCaptcha(content) {
    let url;
    let $ = cheerio.load(content);

    if ($('#humancheck > table > tbody > tr:nth-child(1) > td > span > a:nth-child(2)').length > 0) {
      url = `https://www.tjrs.jus.br/site_php/consulta/${$('#humancheck > table > tbody > tr:nth-child(1) > td > span > a:nth-child(2)').attr('href')}`;
    }

    return url;
  }

  async extrair(numeroOab) {
    try {
   
      let responseCaptcha;
      let objResponse = await this.robo.acessar({
        url: this.url,
        method: 'GET',
        usaProxy: false,
        encoding: 'latin1',
      });
      
      let urlCaptcha = this.extrairLinkCaptcha(objResponse.responseBody);

      if (urlCaptcha) {
        responseCaptcha = await this.resolverCaptchaAudio(numeroOab, urlCaptcha, objResponse.cookies.join(';'));
      }

      if (responseCaptcha) {

      }

      let resultados = [];
      let preParse = {};
      let uuidCaptcha = '';
      let gResponse = '';
      let cookies = {};
      let listaProcessos = [];

      /**
       * Objeto cujo valor é o retorno do robo
       */
       // Objeto cujo valor é o retorno do robô

      // Primeira parte: para pegar cookies e uuidcaptcha
      // TODO apagar codigo comentado abaixo caso nao funfe
      // objResponse = await this.robo.acessar(
      //   'https://esaj.tjsp.jus.br/cpopg/open.do',
      //   'GET',
      //   'latin1',
      //   false,
      //   false,
      //   null
      // );
      // objResponse = await this.robo.acessar({
      //   url: this.url,
      //   method: 'GET',
      //   usaProxy: false,
      //   encoding: 'latin1',
      // })

      // cookies = objResponse.cookies;
      // cookies = cookies.map((element) => {
      //   return element.replace(/\;.*/, '');
      // });
      // cookies = cookies.join('; ');

      // preParse = await this.preParse(objResponse.responseBody, cookies);
      // uuidCaptcha = preParse.captcha.uuidCaptcha;
      // gResponse = await this.getCaptcha();      

    } catch (e) {
      console.log(e);
      throw e;
    }
  };
}
const cheerio = require('cheerio');
const moment = require('moment');
const { Helper } = require('../lib/util');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const re = require('xregexp');
const axios = require('axios');
const fs = require('fs');

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
      require("fs")
        .writeFileSync(path, arquivo, encoding);
    } else {
      console.log('O arquivo não está vindo');
    }
  } catch (error) {
    Helper.pred(error);
  }
}

module.exports.ProcessoTJRS = class ProcessoTJRS extends ExtratorBase {

  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJRSParser();
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
  }

  async resolverCaptchaAudio(oab, url, cookies) {

    cookies = cookies.replace(/\spath\=\/\;?/g,'');    
    let audio;

    const imagemResponse = await axios({
      method: 'get',
      url: `https://www.tjrs.jus.br/site_php/consulta/human_check/humancheck_showcode.php?${new Date('2020-07-06').getTime()}`,
      headers: {
        Cookie: cookies
      },
      responseType: 'arraybuffer'
    });
    
    const somResponse = await axios({
      url,
      method: "GET",      
      responseType: "arraybuffer",
      headers: {
        Cookie: cookies.replace(/path\=\//)
      }
    }) 
    
    // const resQuebrarCaptcha = await this.robo.acessar({
    //   // url: `http://172.16.16.8:5000/api/solve`,
    //   url: `http://localhost:5000/api/solve`,
    //   method: "post",
    //   encoding: "utf8",
    //   usaProxy: false,
    //   usaJson: true,
    //   params: captcha
    // });    

    audio = Buffer
      .from(somResponse.data)
      .toString('base64');    

    // console.log(url);
    // console.log();
    // console.log(`Cookie: ${cookies}`);
    // console.log();
    // console.log(audio);

    // let audio = Buffer.from(captchaResponse.data)
    //   .toString('base64');

    // let audio2 = Buffer.from(fs.readFileSync('./assets/captcha/audiofile.wav')).toString('base64');

    // console.log(audio2);

    // Helper.pred('----');


//     console.log('0 - GET', url, `cookie: ${cookies}`);
//     console.log(1, audio.toString('base64'));
//     fs.writeFileSync(`./assets/captcha/1.audio.captcha.${oab}.wav`, audio);    
//     // Helper.pred('teste123');    

//     // console.log('1', captchaResponse.data);
//     // console.log('2', audio.toString('base64'));

    saveFileSync(`./app/assets/captcha/audio.captcha.${oab}.wav`, audio, 'base64');

    const captcha = {      
      audio
    };

    // console.log(2, captcha);   

    // const resQuebrarCaptcha = await this.robo.acessar({
    //   // url: `http://172.16.16.8:5000/api/solve`,
    //   url: `http://localhost:5000/api/solve`,
    //   method: "post",
    //   encoding: "utf8",
    //   usaProxy: false,
    //   usaJson: true,
    //   params: captcha
    // });

    const resQuebrarCaptcha = await axios({
    //   url: `http://172.16.16.8:5000/api/solve`,
      url: `http://localhost:5000/api/solve`,
      method: "POST",
      encoding: "utf8",
      data: captcha
    });

    console.log(3, resQuebrarCaptcha.data);
    Helper.pred('---');

//     // return resQuebrarCaptcha.responseBody;

    return {
      texto: '0542',
      sucesso: true
    };
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
   
      let responseCaptcha, objResponse, urlCaptcha;      

      objResponse = await this.robo.acessar({
        url: this.url,
        method: 'GET',
        usaProxy: false,
        encoding: 'latin1',
      });

      urlCaptcha = this.extrairLinkCaptcha(objResponse.responseBody);

      if (urlCaptcha) {
        responseCaptcha = await this.resolverCaptchaAudio(numeroOab, urlCaptcha, objResponse.cookies.join(';'));
      }

      console.log(3);

      Helper.pred('---...');

      if (responseCaptcha) {
        console.log("teste", responseCaptcha);
       

        let post = {
          "nome_comarca" : "Tribunal de Justiça",
          "versao" : "",
          "versao_fonetica" : "1",
          "tipo" : "2",
          "id_comarca" : "700",
          "intervalo_movimentacao" : "15",
          "N1_var2" : "1",
          "id_comarca1" : "700",
          "num_processo_mask" : "",
          "num_processo" : "",
          "numCNJ" : "N",
          "id_comarca2" : "700",
          "uf_oab" : "RS",
          "num_oab" : "26629",
          "foro" : "0",
          "N1_var2_1" : "1",
          "intervalo_movimentacao_1" : "15",
          "ordem_consulta" : "1",
          "N1_var" : "",
          "id_comarca3" : "todas",
          "nome_parte" : "",
          "N1_var2_2" : "1",
          "intervalo_movimentacao_2" : "0",
          "code": responseCaptcha.texto
        };      

        if (responseCaptcha.sucesso) {
          objResponse = await this.robo.acessar({
            url: this.url,
            method: 'GET',
            usaProxy: true,
            encoding: 'latin1',
            params: post,
            usaJson: true
          });

          console.log(objResponse.responseBody);
          Helper.pred('tyeste');
        }
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
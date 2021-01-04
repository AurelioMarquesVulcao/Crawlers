const axios = require('axios');
const FormData = require('form-data');
const sleep = require('await-sleep');
const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
const https = require('follow-redirects').https;
const fs = require('fs');
const request = require('request');
const unirest = require('unirest');


var cookieAll = [];
var form;
// var desafio;


async function desafioRecapcha(estado, start, cnj) {
  try {
    // let { url } = start;
    this.key = "6LfRfkIUAAAAAIXuT_GrTfak46Mm6TTvUWAaDYfQ";
    let url = "https://pje.trt15.jus.br/consultaprocessual/";
    let response = await new CaptchaHandler(5, 15000, `PJE-${estado}`, { numeroDoProcesso: cnj }).resolveRecaptchaV2(url, this.key, "/");
    // console.log(this.robo.cookies);
    // console.log(this.robo.cookies);
    // console.log(response.gResponse);
    // process.exit();
    // console.log(this.robo.cookies);
    return response.gResponse
  } catch (e) {
    console.log(e);
  }
}

function capturaForms($) {
  // console.log($("body").html())
  try {
    // let chaveValor = {};
    let chaveValor = [];
    let random = $("body > div.gcaptcha > form > input[type=hidden]:nth-child(3)").attr('value');
    let form = $("body > div.gcaptcha > form").html();
    // console.log(form);
    let datas = $("body > script")[0].children[0].data;
    // console.log(datas);
    // testo se os elementos existem no HTML.
    try {
      if (!!datas.match(/document\.getElementById\("bid"\)\.name\s+=\s?"(\w+)"/)[1]) {
        let name = datas.match(/document\.getElementById\("bid"\)\.name\s+=\s?"(\w+)"/)[1];
        let value = datas.match(/document\.getElementById\("bid"\)\.value\s+=\s?"(\w+)"/)[1];
        chaveValor.push({ [name]: value })
        // console.log(chaveValor[0]);
        // console.log("aqui");
        // process.exit();
        // chaveValor = Object.assign(chaveValor, { [name]: value })
      }
    } catch (e) { }
    try {
      if (!!datas.match(/document\.getElementById\("iid"\)\.name\s+=\s?"(\w+)"/)[1]) {
        let name2 = datas.match(/document\.getElementById\("iid"\)\.name\s+=\s?"(\w+)"/)[1];
        let value2 = datas.match(/document\.getElementById\("iid"\)\.value\s+=\s?"(\w+)"/)[1];
        chaveValor.push({ [name2]: value2 })
        // chaveValor = Object.assign(chaveValor, { [name2]: value2 })
      }
    } catch (e) { }
    // montar formulario de envio
    chaveValor.push({ referer: "/consultaprocessual/" }, { random: random })
    // chaveValor = Object.assign(chaveValor, { referer: "/consultaprocessual/" }, { random: random })
    // console.log(chaveValor);
    // console.log(chaveValor);
    // process.exit();
    return chaveValor
  } catch (e) { console.log(e); }
}


async function request2() {

  await sleep(3000);
  let data = new FormData();

  let config = {
    method: 'get',
    url: 'https://pje.trt15.jus.br/consultaprocessual/',
    headers: {
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      Cookie: cookieAll,
      'referer': 'https://pje.trt15.jus.br/primeirograu/login.seam',
      // 'sec-fetch-dest': 'document',
      // 'sec-fetch-mode': 'navigate',
      // 'sec-fetch-site': 'same-origin',
      // 'sec-fetch-user': '?1',
      // 'sec-gpc': '1',
      // 'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
      ...data.getHeaders()
    },
    data: data
  };

  await axios(config)
    .then(async function (response) {
      // console.log(response.headers);
      let cookie = response.headers["set-cookie"];
      // console.log(cookie);
      for (i in cookie) {
        let data = cookie[i];
        console.log(data.split(';')[0]);
        cookieAll = data.split(';')[0]
      }
      let $ = cheerio.load(response.data);
      form = capturaForms($);

      // console.log(form);
      // process.exit();
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function request3() {
  console.log(form);
  let chaves = [];
  let valores = [];
  for (i in form) {
    chaves.push(Object.keys(form[i]));
    valores.push(Object.values(form[i]));
  }
  // console.log(chaves);
  // console.log(valores);
  let desafio = await desafioRecapcha(15, null, "00114931020205150105");
  // console.log(desafio);
  let header = {
    'Origin': 'https://pje.trt15.jus.br',
    'Referer': 'https://pje.trt15.jus.br/consultaprocessual/',
    'sec-ch-ua-mobile': '?0',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'same-origin',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
    // 'Cookie': 'captchasess=bp0hkfot5qap9lq6508dfgj036'
  }
  header.Cookie = cookieAll;
  console.log(header);
  console.log(form.length);
  // process.exit();
  if (form.length == 2) {
    // console.log(chaves[1], valores[1]);
    // console.log(form);
    let req = unirest('POST', 'https://pje.trt15.jus.br/captcha/login_post.php')
    .proxy('http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182')  
    .headers(header)
      .field('random', valores[1])
      // .field([Object.keys(form[0])], Object.values(form[0]))
      // .field([Object.keys(form[1])], Object.values(form[1]))
      .field('g-recaptcha-response', desafio)
      .field('referer', '/consultaprocessual/')
      .end(function (res) {
        if (res.error) throw new Error(res.error);
        // cookieAll = `${cookieAll}; cookieconsultapje:${res.cookies.cookieconsultapje}`
        cookieAll = res.cookies
        console.log(res.cookies);
      });
  } else if (form.length == 3) {
    // console.log(chaves[0], valores[0]);
    // console.log(form);
    let req = unirest('POST', 'https://pje.trt15.jus.br/captcha/login_post.php')
    .proxy('http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182')  
    .headers(header)
      .field('random', valores[2])
      .field(chaves[0], valores[0])
      // .field([Object.keys(form[1])], Object.values(form[1]))
      .field('g-recaptcha-response', desafio)
      .field('referer', '/consultaprocessual/')
      .end(function (res) {
        if (res.error) throw new Error(res.error);
        // cookieAll = `${cookieAll}; cookieconsultapje:${res.cookies.cookieconsultapje}`
        cookieAll = res.cookies
        console.log(res.cookies);
      });
  } else if (form.length == 4) {
    // console.log(chaves[0], valores[0]);
    // console.log(chaves[1], valores[1]);
    // console.log(form);
    // console.log([chaves[0], valores[0]], [chaves[1], valores[1]]);
    let req = unirest('POST', 'https://pje.trt15.jus.br/captcha/login_post.php')
      .proxy('http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182')
      .headers(header)
      .field('random', valores[3])
      .field(chaves[0], valores[0])
      .field(chaves[1], valores[1])
      .field('g-recaptcha-response', desafio)
      .field('referer', '/consultaprocessual/')
      .end(function (res) {
        if (res.error) throw new Error(res.error);
        // cookieAll = `${cookieAll}; cookieconsultapje:${res.cookies.cookieconsultapje}`
        cookieAll = res.cookies

        console.log(res.cookies);
      });
  }
  await sleep(5000)
  console.log(cookieAll);
  // process.exit();


  // let req = unirest('GET', 'https://www.meuip.com.br/')
  //   .proxy('http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182')
  //   .end(function (res) {
  //     if (res.error) throw new Error(res.error);
  //     console.log(res);
  //   });



}

function criaFormData(datas) {
  let n = "name=";
  let espaco = "\r\n";
  let linha = "\r\n\r\n";
  let zeroUm = "-----011000010111000001101001--\r\n";
  let form_data = "Content-Disposition: form-data; ";
  let text = "-----011000010111000001101001\r\n";

  console.log(datas);
  console.log(datas.length);
  console.log(Object.keys(form[0]), Object.values(form[0]));
  for (let i = 0; i < datas.length; i++) {
    let chave = Object.keys(form[i]);
    chave = chave[0];
    let valor = Object.values(form[i]);
    valor = valor[0];
    text = text + `${form_data}${n}"${chave}"${linha}${valor}${espaco}${zeroUm}`
  }
  console.log([text]);
  return text
}



module.exports.getCookies = async () => {
  await request2();
  await request3();
  return cookieAll
}



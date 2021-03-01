const axios = require('axios');
const FormData = require('form-data');
const sleep = require('await-sleep');
const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
const unirest = require('unirest');


var form;
var cookieAll = [];

class GetCookies {

  async extrair(cnj) {
    try {
      // this.cnj = cnj;
      await this.request2();
      await this.request3(cnj);
      return cookieAll
    } catch (e) {
      console.log(e);
    }
  }

  async request2() {
    await sleep(3000);
    let data = new FormData();
    let config = {
      method: 'get',
      url: 'https://pje.trt15.jus.br/consultaprocessual/',
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        'referer': 'https://pje.trt15.jus.br/primeirograu/login.seam',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
        ...data.getHeaders()
      },
      data: data
    };

    await axios(config)
      .then(async function (response) {
        let cookie = response.headers["set-cookie"];
        cookieAll = cookie[0];
        // console.log(get.cookieAll);
        // let i = 0;
        // for (i in cookie) {
        //   let data = cookie[i];
        //   console.log(data.split(';')[0]);
        //   get.cookieAll = data.split(';')[0]
        // }
        let $ = cheerio.load(response.data);
        form = capturaForms($);
      })
      .catch(function (error) {
        console.log(error);
      });
  }

  async request3(cnj) {
    let chaves = [];
    let valores = [];
    let i = 0;
    for (i in form) {
      chaves.push(Object.keys(form[i]));
      valores.push(Object.values(form[i]));
    }
    let desafio = await this.desafioRecapcha(15, null, cnj);
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
    }
    header.Cookie = cookieAll;
    if (form.length == 2) {
      let req = unirest('POST', 'https://pje.trt15.jus.br/captcha/login_post.php')
        .proxy('http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182')
        .headers(header)
        .field('random', valores[1])
        .field('g-recaptcha-response', desafio)
        .field('referer', '/consultaprocessual/')
        .end(function (res) {
          if (res.error) throw new Error(res.error);
          cookieAll = res.cookies
        });
    } else if (form.length == 3) {
      let req = unirest('POST', 'https://pje.trt15.jus.br/captcha/login_post.php')
        .proxy('http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182')
        .headers(header)
        .field('random', valores[2])
        .field(chaves[0], valores[0])
        .field('g-recaptcha-response', desafio)
        .field('referer', '/consultaprocessual/')
        .end(function (res) {
          if (res.error) throw new Error(res.error);
          cookieAll = res.cookies
        });
    } else if (form.length == 4) {
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
          cookieAll = res.cookies
        });
    }
    await sleep(5000)
  }

  async desafioRecapcha(estado, start, cnj) {
    try {
      this.key = "6LfRfkIUAAAAAIXuT_GrTfak46Mm6TTvUWAaDYfQ";
      let url = "https://pje.trt15.jus.br/consultaprocessual/";
      let response = await new CaptchaHandler(5, 15000, `PJE-${estado}`, { numeroDoProcesso: cnj }, "Peticao", "SP").resolveRecaptchaV2(url, this.key, "/");
      return response.gResponse
    } catch (e) {
      console.log(e);
    }
  }
}

function capturaForms($) {
  try {
    let chaveValor = [];
    let random = $("body > div.gcaptcha > form > input[type=hidden]:nth-child(3)").attr('value');
    let form = $("body > div.gcaptcha > form").html();
    let datas = $("body > script")[0].children[0].data;
    // testo se os elementos existem no HTML.
    try {
      if (!!datas.match(/document\.getElementById\("bid"\)\.name\s+=\s?"(\w+)"/)[1]) {
        let name = datas.match(/document\.getElementById\("bid"\)\.name\s+=\s?"(\w+)"/)[1];
        let value = datas.match(/document\.getElementById\("bid"\)\.value\s+=\s?"(\w+)"/)[1];
        chaveValor.push({ [name]: value })
      }
    } catch (e) { }
    try {
      if (!!datas.match(/document\.getElementById\("iid"\)\.name\s+=\s?"(\w+)"/)[1]) {
        let name2 = datas.match(/document\.getElementById\("iid"\)\.name\s+=\s?"(\w+)"/)[1];
        let value2 = datas.match(/document\.getElementById\("iid"\)\.value\s+=\s?"(\w+)"/)[1];
        chaveValor.push({ [name2]: value2 })
      }
    } catch (e) { }
    // montar formulario de envio
    chaveValor.push({ referer: "/consultaprocessual/" }, { random: random })
    return chaveValor
  } catch (e) { console.log(e); }
}

module.exports.GetCookies = GetCookies;


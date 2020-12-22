const axios = require('axios');
const FormData = require('form-data');
const sleep = require('await-sleep');
const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
var cookieAll = [];
var form;


async function desafioRecapcha(estado, start, cnj) {
  try {
    // let { url } = start;
    this.key = "6LfRfkIUAAAAAIXuT_GrTfak46Mm6TTvUWAaDYfQ";
    let url = `https://pje.trt15.jus.br/consultaprocessual/`;
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
    return chaveValor
  } catch (e) { console.log(e); }
}

async function request1() {
  let data = new FormData();
  // console.log(...data.getHeaders());
  let config = {
    method: 'get',
    url: 'https://pje.trt15.jus.br/primeirograu/login.seam',
    headers: {
      'x-grau-instancia': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
      ...data.getHeaders()
    },
    data: data
  };

  await axios(config)
    .then(function (response) {
      let cookie = response.headers["set-cookie"];
      let data = cookie[0];
      console.log(data.split(';')[0]);
      cookieAll = data.split(';')[0];
      // for (i in cookie) {
      //   cookieAll.push(cookie[i])
      // }
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function request2() {
  let data = new FormData();

  let config = {
    method: 'get',
    url: 'https://pje.trt15.jus.br/consultaprocessual/',
    headers: {
      Cookie: cookieAll,
      'referer': 'https://pje.trt15.jus.br/primeirograu/login.seam',
      'sec-fetch-dest': 'document',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-user': '?1',
      'sec-gpc': '1',
      'upgrade-insecure-requests': '1',
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
        cookieAll = data.split(';')[0];
        // cookieAll.push("teste")
      }
      // process.exit()
      let $ = cheerio.load(response.data);
      form = capturaForms($);

      console.log(form);
      // console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });
}
async function request3() {
  let data = new FormData();
  let desafio = await desafioRecapcha(15, null, "00114931020205150105");
  form.push({
    "g-recaptcha-response": desafio
  });
  // data.append('random', '548e9djdm655jgbhthpdhfr763');
  // console.log(Object.keys(form[0]));
  console.log(form.length);
  for (let i = 0; i < form.length; i++) {
    let chave = Object.keys(form[i]);
    let valor = Object.values(form[i])
    data.append(chave[0], valor[0]);
  }
  // data.append('g-recaptcha-response', '03AGdBq26YFqs4ZrkNuYwJc8cDR0ggcVSQDCxEYKuKcZCYxnqVzFvnYYLbem52N8Hz3X_KV1r5JJ9Bk0W_gqsewwCv9htkqpZ_JyKABI9IUgH-hqITF1xW-W2OSZdubUQoaMmxYNzvgzLl-7Ip_u7BNwpNMLVxtoAvNPO_OwKhmwx4xYWNN7e_fHa9BLwpXJMa93a80NxVcAb5sXCiqi3VQPh4RCBIkn5uav0OTj3JZjz47KWmShkAo2rOMSM6GB-AheJq3idA4NjGj1U0cei4SOpLDuE0QGDDyunuR0Y98A9g95OmkOrKV7hH1-x2CGe3ipj47doNGKBpWCgamDE8XIr69NqyZBoij_u3GIDOKKUloq1pxKgtPtfTDDumk9CcE76iCpQNqEeYI2fH19xZPLzgI0l4rDvSn0ygyAIu_mLBHuEvX8Y5ITTNJL_PRuhYkqkvOsm7-ND5KXjPEETNsWvuIzOTNaennVgi0gUX84gj2OCcWisI3amhQM4e_zcTIoJ-wI7Ndj4_');
  // data.append('referer', '/consultaprocessual/');
  // data.append('CSOyxToKkzqpJZRLwrHMihnVYeEDIPdWlGmXBsAcUQvajNtfFg', 'SyxLtKJidOnhzqHjERQTrCXBWumcfgIMsb');
  // data.append('UMFxeLrlDnWipvAfTdwcEuoRbBsQzKCOjGga', 'ELQfVWYkqigACszM');

  console.log(data);
  // process.exit()
  var config = {
    method: 'post',
    url: 'https://pje.trt15.jus.br/captcha/login_post.php',
    headers: {
      Cookie: cookieAll,
      'Origin': 'https://pje.trt15.jus.br',
      'Referer': 'https://pje.trt15.jus.br/consultaprocessual/',
      'sec-ch-ua-mobile': '?0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
      ...data.getHeaders()
    },
    data: data
  };

  await axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data));
      let cookie = response.headers["set-cookie"];
      console.log(response.headers);
      console.log(response.data);
      console.log(cookie);
      // for (i in cookie) {
      //   cookieAll.push(cookie[i])
      // }
    })
    .catch(function (error) {
      console.log(error);
    });

}

(async () => {
  await request1();
  console.log(cookieAll);
  await request2();
  // await sleep(30000)
  console.log(cookieAll);
  await request3();
  console.log(cookieAll);
})()



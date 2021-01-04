const axios = require('axios');
const FormData = require('form-data');
const sleep = require('await-sleep');
const cheerio = require('cheerio');
const { CaptchaHandler } = require('../lib/captchaHandler');
const https = require('follow-redirects').https;
const fs = require('fs');
const request = require('request');


var cookieAll = [];
var form;
var desafio;


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
    console.log(chaveValor);
    // process.exit();
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
      cookieAll = data.split(';')[0] + ";"//+"; Path=/primeirograu; Domain=pje.trt15.jus.br; Secure; ";
      // console.log(response.data);
      // process.exit() //em todos os meus AnalyserNode, nunca imaginei o bruno falando mal de avengers
      // o final foi melhor que a hq real, a hq é muito tipo, acabou porque tinha que acabar
      // for (i in cookie) {
      //   cookieAll.push(cookie[i])
      // }
    })
    .catch(function (error) {
      console.log(error);
    });
}

async function request2() {
  desafio = await desafioRecapcha(15, null, "00114931020205150105");
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
        cookieAll = data.split(';')[0] // +"; Path=/; Domain=pje.trt15.jus.br;";
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
  // process.exit()
  let data = new FormData();
  
  // let desafio = "03AGdBq27MVeG43nfjrLHXG_EbBVAJTiHJ0I66_fnGepyXBJjJRQ0XUFzJHVTgfGY2lhh-9npfVdQrWGgOhxts7Rhx3cfob04bgAxQxRWYV9LYgbxBWklaQEgFHxB9_tQHWGnGnANFUMAkz1R3j_BDU2vNy-vHHMZeYjjYnWIFn44x8mUthSrJk-mtHtp2xQsFs0rc2DJgZxDKzXQqaEVaE0todT75fHAscVaDZu0ExdMO3bm84pLv8lZHdYJ3h3ansIfDFuVzdQWzVOdKhQtdDEXS2F-8Kwp_P9VPFF7UEHhGYSBJDxRVgJkU9zdxe5GKbcMKjEZlk-d5-qIOflADj7bzog_6h_HQQuHHc4X8SkOMiQ-JJ-apPTAV3sSnTujhou86DN2dJYXI_OydWJocbJCtnanhGfzcqtqQADZLACKQJ2-mW0GDgsLdi8KPI1pUiXUFKG2GkgDl5vrnVH88JjnLnOua69AqDiepo0aKhbfIrxfTAcVr6oxjG7X9nukXEQP2BlG8uaM2";
    form.push({
    "g-recaptcha-response": desafio
  });
  await sleep(2000);
    
  // console.log(form);
  criaFormData(form);
  // console.log(form.length);
  for (let i = 0; i < form.length; i++) {
    let chave = Object.keys(form[i]);
    let valor = Object.values(form[i]);
    // console.log(`${chave[0]}`, valor[0]);
    data.append(`${chave[0]}`, valor[0]);
  }
  // process.exit()

  var config = {
    method: 'post',
    url: 'https://pje.trt15.jus.br/captcha/login_post.php',
    headers: {
      // accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      // cookie: cookieAll,
      Cookie: cookieAll,
      'Origin': 'https://pje.trt15.jus.br',
      'Referer': 'https://pje.trt15.jus.br/consultaprocessual/',
      // 'sec-ch-ua-mobile': '?0',
      // 'Sec-Fetch-Dest': 'document',
      // 'Sec-Fetch-Mode': 'navigate',
      // 'Sec-Fetch-Site': 'same-origin',
      // 'Sec-Fetch-User': '?1',
      // 'Upgrade-Insecure-Requests': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
      
      
      ...data.getHeaders()
    },
    data: data
  };
  
  await axios(config)
    .then(function (response) {
      // console.log(JSON.stringify(response.data));
      console.log(response.data);
      let cookie = response.headers["set-cookie"];
      console.log(response.headers);
      // console.log(response.data);
      console.log(cookie);

      // for (i in cookie) {
      //   cookieAll.push(cookie[i])
      // }
      // console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
      console.log(error);
    });

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
async function request4() {
  // const request = require('request');

  const jar = request.jar();
  jar.setCookie(request.cookie('captchasess=fglnrlrsrndahs3vnigks1bak7'), 'https://pje.trt15.jus.br/captcha/login_post.php');

  const options = {
    method: 'POST',
    url: 'https://pje.trt15.jus.br/captcha/login_post.php',
    headers: {
      Origin: 'https://pje.trt15.jus.br',
      Referer: 'https://pje.trt15.jus.br/consultaprocessual/',
      'sec-ch-ua-mobile': '?0',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36',
      'Content-Type': 'multipart/form-data',
      'content-type': 'multipart/form-data; boundary=---011000010111000001101001'
    },
    formData: {
      random: 'fglnrlrsrndahs3vnigks1bak7',
      'g-recaptcha-response': '03AGdBq26MxQbhPZwoBqXCuNVVudkxfby3lGToCHmHqKL-mrlNMmQEPCRQPPOX8fcqMBYMo7dmGctcR9l3jdxlDW2KU_xxK5hZi-cL4yJbW8sW6VkplAMWMikQs4LKO2DhKoF7AcvixE0jUiCaGFgDqhnok-n4qS7ae6n3z3w5OpWDCsg36nks20HIeAJ1nG8cGGRVAMNDr0_k8WXvAYEp9a-EG9ta1CvuGF3kwKfOIMThgVNivo7qAa7eqWNPuQKBnZy3v3mIqQ4pKB1o0lxcXeBTfMlb5Y0FEBlUoS2V43TrtAbZFSiclz02ViFs0NURTd7U7v8LfL7Gqa37n5jcQNm1y1qa6K-Zp4vG8sf_lozAc5ir7DiDuGS13FhwWEwD4Vb92LZ5yNqzmdNCae1FBJnpEEoSnDR9xScXwHtm5Q_eZ0sNjrEGEZ0G5jruaIKXfCpNH_vvUs-T1FvjvJ6PNSJLKrfCTTsPGstWteiBM-LL2xdJqfZ3kTM',
      referer: '/consultaprocessual/',
      hawbRnCeqLoZApfSMGDKydHOviIPJWcBzEVsQTXkxtYUgmNlr: 'RMcAFmnXDSzVUdOqBJvsK',
      sunVjomTP: 'aThApjLWRYlsGncCNzSeEfJFmIgZXKUMd'
    },
    jar: 'JAR'
  };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(response.headers);
    console.log(body);
  });

}


(async () => {
  // await request1();
  // console.log(cookieAll);
  // await sleep(30000)
  await request2();
  // await sleep(30000)
  console.log(cookieAll);
  await request3();
  console.log(cookieAll);
})()



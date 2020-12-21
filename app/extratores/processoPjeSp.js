const cheerio = require('cheerio');
const { Robo } = require('../lib/newRobo');
const { Logger, Cnj } = require('../lib/util');
const { enums } = require('../configs/enums');
const sleep = require('await-sleep');
const { CaptchaHandler } = require('../lib/captchaHandler');
const HttpsProxyAgent = require('https-proxy-agent');
const axios = require('axios');




var heartBeat = 0;

const proxy = new HttpsProxyAgent(
  'http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182');

setInterval(async function () {
  if (heartBeat == 340) {
    process.exit()
  }
  heartBeat++
  // console.log(heartBeat);
}, 1000);

class ExtratorPje {
  constructor() {
    this.red = '\u001b[31m';
    this.blue = '\u001b[34m';
    this.reset = '\u001b[0m';
    this.robo = new Robo();
    this.instancia1 = { 'X-Grau-Instancia': '1' };
    this.instancia2 = { 'X-Grau-Instancia': '2' };
    this.proxy = true;
    // this.urlBase = "http://pje.trt#.jus.br/pje-consulta-api";
    this.key = "6LfRfkIUAAAAAIXuT_GrTfak46Mm6TTvUWAaDYfQ";

  }
  async baseMethod() { try { } catch (e) { console.log(e); } }

  async extrair(cnj) {
    let { sequencial, ano, estado, comarca } = Cnj.processoSlice(cnj);
    estado = parseInt(estado);

    let id = null;
    while (id == null) {
      id = await this.getId(cnj, this.instancia1, estado);
    }
    console.log(id);

    if (estado == 15) {
      let url = "https://pje.trt15.jus.br/primeirograu/login.seam";
      let request1 = {
        url, proxy: this.proxy, method: "GET", headers: { "x-grau-instancia": "1" }
      };
      let get1 = await this.robo.acessar(request1);
      console.log(get1.status);
      console.log(this.robo.cookies);
      // process.exit();

      // iniciando obtenção fornçada do formulario de inicio.
      let start = null;
      while (start == null) {
        start = await this.startPage(estado);
      };
      console.log("Inicio do sleep");
      await sleep(3000);
      console.log("Fim do Sleep");
      let recapcha = await this.desafioRecapcha(estado, start, cnj);
      console.log(recapcha);
      let resposta = await this.responseCapcha(start, recapcha, estado);

      resposta
      console.log(this.robo.cookies);
      process.exit();
      // console.log(resposta);
      // process.exit()
    }
    // await this.extrair(cnj);
    // obtendo a imagem base 64 do capcha
    let captcha = await this.desafioCapcha(estado, id);
    // console.log(captcha);
    console.log(!!captcha);

    let captchaSolve = await this.apiCapcha(captcha);
    console.log(captchaSolve);

    let processo = await this.processo(estado, id, captcha, captchaSolve);
    console.log(processo);

    return processo
  }

  async startPage(estado) {
    try {
      let url = `https://pje.trt${estado}.jus.br/consultaprocessual/`;
      let request = {
        url, proxy: this.proxy, method: "GET", headers: {
          referer: "https://pje.trt15.jus.br/primeirograu/login.seam",
          "sec-fetch-dest": "document",
          "sec-fetch-mode": "navigate",
          "sec-fetch-site": "same-origin",
          "sec-fetch-user": "?1",
          "sec-gpc": "1",
          "upgrade-insecure-requests": "1"
        }
      };
      let get = await this.robo.acessar(request);
      let body = get.responseBody;
      let $ = cheerio.load(body);
      let form = capturaForms($);
      this.logT("Form Data");
      console.table(form);
      console.log(this.robo.cookies);
      return form
    } catch (e) {
      this.logE("Form Data");
    }
  }

  async desafioRecapcha(estado, start, cnj) {
    try {
      // let { url } = start;
      let url = `https://pje.trt${estado}.jus.br/consultaprocessual/`;
      let response = await new CaptchaHandler(5, 15000, `PJE-${estado}`, { numeroDoProcesso: cnj }).resolveRecaptchaV2(url, this.key, "/");
      // console.log(this.robo.cookies);
      // console.log(this.robo.cookies);
      // console.log(response.gResponse);
      // process.exit();
      console.log(this.robo.cookies);
      return response.gResponse
    } catch (e) {
      console.log(e);
    }
  }


  async responseCapcha(start, recapcha, estado) {
    try {
      let form = Object.assign(start, { "g-recaptcha-response": recapcha })
      console.log(form);
      let url = `https://pje.trt${estado}.jus.br/captcha/login_post.php`;
      let request = {
        url,
        proxy: this.proxy,
        method: "POST",
        headers: {
          Origin: "https://pje.trt15.jus.br",
          Referer: "https://pje.trt15.jus.br/consultaprocessual/",
          "sec-ch-ua-mobile": "?0",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          // "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.101 Safari/537.36"
        },
        formData: form
      };

      // await this.robo.acessar(request)

      console.log(this.robo.cookies);
      let post = await this.robo.acessar(request);
      console.log(post.responseContent.request);
      console.log(this.robo.cookies);
      // await this.responseCapcha(start, recapcha, estado);
      console.log(this.robo.cookies);
      // if (!this.robo.cookies.cookieconsultapje){

      // }
      this.logT("post_PHP")
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * 
   * @param {string} cnj Cnj que se deseja consultar
   * @param {object} headers Objeto que referência a intãncia
   * @param {number} estado Numero do Estado que se deseja consultar
   * @returns Se o processo possuir 2 intãncia sera retornado true, se for primeira instancia o id do processo.
   */
  async getId(cnj, headers, estado) {
    try {
      let url = `http://pje.trt${estado}.jus.br/pje-consulta-api/api/processos/dadosbasicos/${cnj}`;
      let request = { url, headers, proxy: this.proxy };
      let get = await this.robo.acessar(request);
      this.logT("id")
      return get.responseBody[0].id
    } catch (e) {
      // console.log(e);
      this.logE("id")
      return null
    }
  }

  async desafioCapcha(estado, id) {
    try {
      let url = `http://pje.trt${estado}.jus.br/pje-consulta-api/api/processos/${id}`;
      let request = { url, proxy: this.proxy, method: "GET", debug: true };
      let get = await this.robo.acessar(request);
      // console.log(get);
      let resposta = [{
        refinador: 'trt_1',
        imagem: get.responseBody.imagem,
      }, get.responseBody.tokenDesafio]
      this.logT("base64_Image");
      return resposta
    } catch (e) {
      this.logE("base64_Image");
      console.log(e);
      return null
    }
  }

  async apiCapcha(captcha) {
    console.log(captcha);
    try {
      let url = "http://172.16.16.8:8082/api/refinar/";
      // url: `http://127.0.0.1:8082/api/refinar/`,
      let request = {
        url,
        method: "POST",
        json: captcha[0],
      };
      let post = await this.robo.acessar(request);
      let texto = post.responseBody.texto.replace(/[^a-z0-9]/g, '');
      // texto.length = 5
      if (texto.length < 6) {
        throw this.red + "Capcha solve is too short" + this.reset
      }
      // console.log(post);
      this.logT("capchaSolve")
      return texto
    } catch (e) {
      this.logE("capchaSolve")
      console.log(e);
      process.exit();
    }
  }

  async processo(estado, id, captcha, captchaSolve) {
    try {
      let url = `https://pje.trt${estado}.jus.br/pje-consulta-api/api/processos/${id}?tokenDesafio=${captcha[1]}&resposta=${captchaSolve}`;
      let request = { url, proxy: this.proxy, method: "GET" };
      let get = await this.robo.acessar(request);
      let resultado = get.responseBody;
      if (get.mensagem) {
        throw 'Ocorreu um problema na solução do Captcha'
      }
      if (get.responseBody.mensagemErro) {
        return 'Não é possível obter devido ao processo ser sigiliso'
      }
      this.logT("Processo");
      return get.responseBody
    } catch (e) {
      this.logE("Processo");
      console.log(e);
      return null
    }
  }

  logT(name) {
    // const obj = [{
    //   Status: true,
    //   [name]: objeto
    // }];
    // console.table(obj);
    console.log(this.blue + `${name} => Obtido com sucesso!` + this.reset);
  }
  logE(name) {
    const obj = this.red + `Não foi possivél obter o.: ${name}` + this.reset;
    console.log(obj);
  }

}



module.exports.ExtratorPje = ExtratorPje;

function capturaForms($) {
  try {
    let chaveValor = {};
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
        // chaveValor.push([name, value])
        chaveValor = Object.assign(chaveValor, { [name]: value })
      }
    } catch (e) { }
    try {
      if (!!datas.match(/document\.getElementById\("iid"\)\.name\s+=\s?"(\w+)"/)[1]) {
        let name2 = datas.match(/document\.getElementById\("iid"\)\.name\s+=\s?"(\w+)"/)[1];
        let value2 = datas.match(/document\.getElementById\("iid"\)\.value\s+=\s?"(\w+)"/)[1];
        // chaveValor.push([name2, value2])
        chaveValor = Object.assign(chaveValor, { [name2]: value2 })
      }
    } catch (e) { }
    // montar formulario de envio
    chaveValor = Object.assign(chaveValor, { referer: "/consultaprocessual/" }, { random: random })
    // console.log(chaveValor);
    return chaveValor
  } catch (e) { console.log(e); }
}

function geraContentLenght(form) {
  let n = Object.keys(form).length - 1;
  let f = JSON.stringify(form).length;
  let t = -n + f - 6
  return t
}



(async () => {
  // new ExtratorTrtPje().captura2({ 'X-Grau-Instancia': '1' }, "00114931020205150105", 15);
  // console.log(await new ExtratorPje().extrair("00114931020205150105"));
  await new ExtratorPje().extrair("00114931020205150105");
  // await new ExtratorPje().extrair("10013797020205020003");
  // await new ExtratorPje().extrair("00212492220205040211");
  process.exit()
})()


// const logger = new Logger(
//   'info',
//   'logs/ProcessoJTE/ProcessoTRT-RJInfo.log',
//   {
//     nomeRobo: enums.nomesRobos.TRTRJ,
//     NumeroDoProcesso: cnj,
//   }
// );
// logger.info('Iniciado captura do processo.');
const cheerio = require('cheerio');
const { Robo } = require('../lib/newRobo');
const { Logger, Cnj } = require('../lib/util');
const { enums } = require('../configs/enums');
const sleep = require('await-sleep');
const { CaptchaHandler } = require('../lib/captchaHandler');
const HttpsProxyAgent = require('https-proxy-agent');
const awaitSleep = require('await-sleep');
const proxy = new HttpsProxyAgent(
  'http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182');


var heartBeat = 0;

setInterval(async function () {
  if (heartBeat == 60) {
    process.exit()
  }
  heartBeat++
  console.log(heartBeat);
}, 1000);

class ExtratorPje {
  constructor() {
    this.red = '\u001b[31m';
    this.blue = '\u001b[34m';
    this.reset = '\u001b[0m';
    this.robo = new Robo();
    this.instancia1 = { 'X-Grau-Instancia': '1' };
    this.instancia2 = { 'X-Grau-Instancia': '2' };
    this.proxy = true
    // this.urlBase = "http://pje.trt#.jus.br/pje-consulta-api";
    this.key = "6LfRfkIUAAAAAIXuT_GrTfak46Mm6TTvUWAaDYfQ";

  }
  async baseMethod() { try { } catch (e) { console.log(e); } }

  async extrair(cnj) {
    const { sequencial, ano, estado, comarca } = Cnj.processoSlice(cnj);
    let start = null;
    // iniciando obtenção fornçada do formulario de inicio.
    while (start==null){
      start = await this.startPage(estado);
      await sleep(100);
    }
    console.log(start);
process.exit()
    let recapcha = await this.desafioRecapcha(estado, start, cnj);
    console.log(recapcha);

    let resposta = responseCapcha(start, recapcha, estado);
    console.log(resposta);



    // let id = await this.getId(cnj, this.instancia1, estado);
    // console.log(id);
    // let recapcha = await this.desafioRecapcha(estado, id)
    // console.log(recapcha);
    // let capcha = await this.desafioCapcha(estado, id);
    // console.log(capcha);


    return ""
  }

  async startPage(estado) {
    try {
      let url = `https://pje.trt${estado}.jus.br/consultaprocessual/`;
      let request = { url, proxy: this.proxy, method: "GET" };
      let get = await this.robo.acessar(request);
      let body = get.responseBody;
      let $ = cheerio.load(body);
      let datas = $("body > script")[0].children[0].data;
      let random = $("body > div.gcaptcha > form > input[type=hidden]:nth-child(3)").attr('value');
      let name = datas.match(/document\.getElementById\("bid"\)\.name\s+=\s?"(\w+)"/)[1];
      let value = datas.match(/document\.getElementById\("bid"\)\.value\s+=\s?"(\w+)"/)[1];
      let FormData = {
        url: url,
        random: random,
        [name]: value
      }
      this.logT("Form Data");
      console.table(FormData);
      return FormData
    } catch (e) {
      if (/'1' of null/gmi.test(e)) {
        this.logE("Form Data");
        return null
      } else {
        console.log(e);
      }

    }
  }

  async desafioRecapcha(estado, start, cnj) {
    try {
      let url = `https://pje.trt${estado}.jus.br/consultaprocessual/`;
      return await new CaptchaHandler(5, 15000, `PJE-${estado}`, { numeroDoProcesso: cnj }).resolveRecaptchaV2(url, this.key, "/");
    } catch (e) {
      console.log(e);
    }
  }


  async responseCapcha(start, recapcha, estado) {
    try {
      let { random, name, value } = start
      let url = `https://pje.trt${estado}.jus.br/captcha/login_post.php`;
      let request = {
        url,
        proxy: this.proxy,
        method: "POST",
        headers: {
          origin: `https://pje.trt${estado}.jus.br`,
          referer: `https://pje.trt${estado}.jus.br/consultaprocessual/`
        },
        formData: {
          "g-recaptcha-response": recapcha,
          referer: /consultaprocessual/,
          random: random,
          [name]: value
        }
      };
      let post = await this.robo.acessar(request);
      console.log(post);

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
      let request = { url, proxy: this.proxy, method: "POST" };
      let post = await this.robo.acessar(request);
      console.log(post);
      this.logT("base64_Image")
    } catch (e) {
      this.logE("base64_Image")
      console.log(e);
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




(async () => {
  // new ExtratorTrtPje().captura2({ 'X-Grau-Instancia': '1' }, "00114931020205150105", 15);
  // console.log(await new ExtratorPje().extrair("00114931020205150105"));
  await new ExtratorPje().extrair("00114931020205150105");
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
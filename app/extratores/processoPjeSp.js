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
  if (heartBeat == 2) {
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

  }
  async baseMethod() { try { } catch (e) { console.log(e); } }

  async extrair(cnj) {
    const { sequencial, ano, estado, comarca } = Cnj.processoSlice(cnj);
    let id = await this.getId(cnj, this.instancia1, estado);
    console.log(id);
    let capcha = await this.desafioCapcha(estado, id);
    console.log(capcha);

    return ""
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
      this.logT(get.responseBody[0].id, "id")
      return get.responseBody[0].id
    } catch (e) {
      // console.log(e);
      this.logE("id")
      return null
    }
  }

  async desafioRecapcha() {
    try {

    } catch (e) {
      console.log(e);
    }
  }

  async desafioCapcha(estado, id) {
    try {
      let url = `http://pje.trt${estado}.jus.br/pje-consulta-api/api/processos/${id}`;
      let request = { url, proxy: this.proxy, method: "POST" };
      let post = await this.robo.acessar(request);
      console.log(post);
      this.logT(post, "base64_Image")
    } catch (e) {
      this.logE("base64_Image")
      console.log(e);
    }
  }







  logT(objeto, name) {
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
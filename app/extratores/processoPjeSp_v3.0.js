const cheerio = require('cheerio');
const axios = require('axios');
const sleep = require('await-sleep');


const { Robo } = require('../lib/newRobo');
const { Logger, Cnj } = require('../lib/util');
const { enums } = require('../configs/enums');
const { CaptchaHandler } = require('../lib/captchaHandler');
const HttpsProxyAgent = require('https-proxy-agent');





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

  async axiosHard() {
    try {
      let cookie = await axios({
        url: 	"https://pje.trt15.jus.br/consultaprocessual/",
        method: 'GET',
        // headers: headers,
        // params: params,
        // data: dados,
      }).then((resp) => {
        console.log("Requisição ok", 200);
        console.log(resp);
        return resp.data
      });
      
    } catch (e) {
      console.log(e);
    }
  }

}



module.exports.ExtratorPje = ExtratorPje;



(async () => {
  // new ExtratorTrtPje().captura2({ 'X-Grau-Instancia': '1' }, "00114931020205150105", 15);
  // console.log(await new ExtratorPje().extrair("00114931020205150105"));
  // await new ExtratorPje().extrair("00114931020205150105");
  // await new ExtratorPje().extrair("10013797020205020003");
  // await new ExtratorPje().extrair("00212492220205040211");
  await new ExtratorPje().axiosHard("00114931020205150105");
  process.exit()
})()



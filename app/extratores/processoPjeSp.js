const cheerio = require('cheerio');
const { Robo } = require('../lib/robo');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const sleep = require('await-sleep');
const { CaptchaHandler } = require('../lib/captchaHandler');
const HttpsProxyAgent = require('https-proxy-agent');
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
    this.robo =

  }
}

module.exports.ExtratorPje = ExtratorPje;


// (async () => {
//   // new ExtratorTrtPje().captura2({ 'X-Grau-Instancia': '1' }, "00114931020205150105", 15);
//   console.log(await new ExtratorTrtPje().extrair("00114931020205150105", 15));
// })()
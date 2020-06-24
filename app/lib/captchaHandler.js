const sleep = require('await-sleep');
const { enums } = require('../configs/enums');
let Anticaptcha = require('../bin/js/anticaptcha')(
  '4b93beb6fe87d3bf3cfd92966ec841a6'
);
const CAPTCHAIO_KEY = '405d27c9-5ef38c01c76b79.16080721';

const { Robo } = require('../lib/robo');

const { AntiCaptchaResponseException } = require('../models/exception/exception');

const antiCaptchaHandler = async (website, websiteKey, pageAction, userAgent) => {

  return new Promise((resolve, reject) => {
    Anticaptcha.setWebsiteURL(website);
    Anticaptcha.setWebsiteKey(websiteKey);
    Anticaptcha.setMinScore(0.3);
    Anticaptcha.setPageAction(pageAction);

    Anticaptcha.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/52.0.2743.116'
    );
    Anticaptcha.getBalance((err, balance) => {
      if (err) {
        return reject(new AntiCaptchaResponseException('NOT_AVALIABLE', err.message))
      }
      console.log('balance', balance);
      if (balance > 0) {
        Anticaptcha.createTaskProxyless((err, taskId) => {
          if (err) {
            return reject(new AntiCaptchaResponseException('CREATE_PROXYLESS_TASK', err.message))
          }
          Anticaptcha.getTaskSolution(taskId, (err, gResponse) => {
            if (err) {
              return reject(new AntiCaptchaResponseException('GET_CAPTCHA_SOLUTION', err.message));
            }
            return resolve({ sucesso: true, gResponse: gResponse });
          });
        });
      } else {
        return reject(new AntiCaptchaResponseException('NO_FOUNDS', 'Not enough founds to start the operation.'))
      }
    });
  });
};

const xcaptchasIOHandler = async (website, websiteKey, pageAction) => {
  console.log(website, websiteKey, pageAction);
  const robo = new Robo();
  let objResponse;
  let url;
  let tentativas = 0;
  console.log(website, websiteKey, pageAction);

  objResponse = await robo.acessar(
    {
      url: "https://api.captchas.io/in.php",
      method: "post",
      params: {
        method: "userrecaptcha",
        key: CAPTCHAIO_KEY,
        googlekey: websiteKey,
        pageurl: website,
        json: 1
      }
    }
  );
  
  if (objResponse.responseBody.test('ERROR_DAILY_SOLVES_LIMIT_REACHED')) {
    resposta.detalhes = 'ERROR_DAILY_SOLVES_LIMIT_REACHED';
  }

  if (objResponse.responseBody.test('ERROR_NO_AVAILABLE_THREADS')) {
    resposta.detalhes = 'ERROR_NO_AVAILABLE_THREADS';
  }

  if (objResponse.responseBody.test('ERROR_CAPTCHA_UNSOLVABLE')) {
    resposta.detalhes = 'ERROR_CAPTCHA_UNSOLVABLE';
  }

  if (objResponse.responseBody.test('ERROR_API_KEY_NOT_FOUND')) {
    resposta.detalhes = 'ERROR_API_KEY_NOT_FOUND';
  }

  if (objResponse.responseBody.test('ERROR_ACCESS_DENIED')) {
    resposta.detalhes = 'ERROR_ACCESS_DENIED';
  }
  if (objResponse.responseBody.test('OK')) {
    url = `?key=${CAPTCHAIO_KEY}&action=get&id=${captchaId}&json=1`;

    setTimeout(() => {

      do {

        setTimeout(() => {

        }, 3000);

      } while (true);
    }, 5000)
  }
  if (objResponse.responseBody.test('OK')) {
    //TODO remover futuramente
    //console.log('----- objResponse', objResponse);
    objResponse.responseBody.replace(/OK\|/g, '')
    let captchaId = objResponse.responseBody.replace(/OK\|/g, '');
    url = `?key=${CAPTCHAIO_KEY}&action=get&id=${captchaId}&json=1`

    objResponse = await robo.acessar(
      {
        url: 'https://api.captchas.io/res.php'+url,
        method: 'get',
      }
    )


    console.log(objResponse.responseBody);
  }



}

class CaptchaIOHandler {
  constructor() {}

  static async resolver(website, websiteKey, pageAction) {
    const robo = new Robo();
    let objResponse;
    let captchaId;
    let url;
    let tentativas = 0;


    // Realiza o pedido a api do captchas.io
    objResponse = await robo.acessar({
      url: "https://api.captchas.io/in.php",
      method: "post",
      params: {
        method: "userrecaptcha",
        key: CAPTCHAIO_KEY,
        googlekey: websiteKey,
        pageurl: website,
        json: 1
      }
    });

    
    // Se resposta valida continua o procedimento
    if (this.testaErro(objResponse.responseBody).valido) {

      let jsonBody = objResponse.responseBody;
      captchaId = jsonBody.request;

      // Espera 5 segundos para fazer a chamada a resposta
      await sleep(5000);
      url = `?key=${CAPTCHAIO_KEY}&action=get&id=${captchaId}&json=1`
      objResponse = await robo.acessar(
        {
          url: 'https://api.captchas.io/res.php' + url,
          method: 'get',
        }
      )
      await sleep(3000);
      if (!this.testaErro(objResponse.responseBody.request).valido) {

        do {
          objResponse = await robo.acessar(
            {
              url: 'https://api.captchas.io/res.php' + url,
              method: 'get',
            }
          )

          if (this.testaErro(objResponse.responseBody.request).valido) {
            return {
              sucesso: true,
              gResponse: objResponse.responseBody.request
            }
          }
          await sleep(3000);
          tentativas++;
        } while (tentativas < 20);

      }

      // se nao houver erro retorna sucesso

      if (this.testaErro(objResponse.responseBody.request).valido){
        console.log('3', objResponse.responseBody);
        return {
          sucesso: true,
          gResponse: objResponse.responseBody.request
        }
      }
    }
    console.log('4', objResponse.responseBody);
    return {
      sucesso: false,
      detalhes: objResponse.responseBody
    }
  }

  /**
   *
   * @param {Any} body
   * @returns {{valido: boolean}}
   */
  static testaErro(body) {
    
    let resposta = {
      valido: true
    }

    if (!body) {
      resposta.detalhes = 'VAZIO';
      resposta.valido = false;
    }

    if (/ERROR_PROXY_BANNED/.test(body)) {
      resposta.detalhes = 'ERROR_PROXY_BANNED',
        resposta.valido = false;
    }

    if (/ERROR_DAILY_SOLVES_LIMIT_REACHED/.test(body)) {
      resposta.detalhes = 'ERROR_DAILY_SOLVES_LIMIT_REACHED';
      resposta.valido = false;
    }

    if (/ERROR_NO_AVAILABLE_THREADS/.test(body)) {
      resposta.detalhes = 'ERROR_NO_AVAILABLE_THREADS';
      resposta.valido = false;
    }

    if (/ERROR_CAPTCHA_UNSOLVABLE/.test(body)) {
      resposta.detalhes = 'ERROR_CAPTCHA_UNSOLVABLE';
      resposta.valido = false;
    }

    if (/ERROR_API_KEY_NOT_FOUND/.test(body)) {
      resposta.detalhes = 'ERROR_API_KEY_NOT_FOUND';
      resposta.valido = false;
    }

    if (/ERROR_ACCESS_DENIED/.test(body)) {
      resposta.detalhes = 'ERROR_ACCESS_DENIED';
      resposta.valido = false;
    }

    if (/CAPCHA_NOT_READY/.test(body)) {
      resposta.detalhes = 'CAPCHA_NOT_READY';
      resposta.valido = false;
    }

    if (/ERROR_RECAPTCHA_TIMEOUT/.test(body)) {
      resposta.detalhes = 'ERROR_RECAPTCHA_TIMEOUT';
      resposta.valido = false;
    }

    
    return resposta;

  }
}


module.exports.CaptchaHandler = class CaptchaHandler {
  /**
   *
   * @param {Number} tentativas numero de repetições antes de desistir do captcha
   * @param {Number} espera tempo de espera entre uma chamada de captcha e outra
   */
  constructor(tentativas = 5, espera = 5000) {
    this.tentativas = tentativas;
    this.espera = espera;
  }


  async resolveRecaptchaV2(website, websiteKey, pageAction, userAgent) {
    let tentativas = 0;
    let maxTentativas = 5;
    let resultado = {
      sucesso: false,
      detalhes: []
    }
    let captcha;

    do {
      
      resultado = await this.getCaptcha(website, websiteKey, pageAction, CaptchaIOHandler)
      await sleep(5000);
      if (resultado.sucesso) return resultado;
      tentativas++;
    } while (tentativas < maxTentativas);

    // tentativas = 0;
    // do {
    //   setTimeout(async () => {
    //     captcha = await antiCaptchaHandler(website, websiteKey, pageAction, userAgent);
    //
    //     if (captcha.sucesso) {
    //       resultado.sucesso = true;
    //       resultado.gResponse = captcha.gResponse;
    //     }
    //     else {
    //       resultado.detalhes.push(captcha.detalhes)
    //     }
    //     if (resultado.sucesso) return resultado;
    //   }, 5000);
    //   if (resultado.sucesso) return resultado;
    // } while (tentativas < maxTentativas);
    console.log('1', resultado);
    return resultado;
  }

  async getCaptcha(website, websiteKey, pageAction, tipoCaptcha) {
    let resultado = {
      sucesso: false,
      detalhes: []
    };
    let captcha = await tipoCaptcha.resolver(website, websiteKey, pageAction);

    if (captcha.sucesso) {
      resultado.sucesso = true;
      resultado.gResponse = captcha.gResponse;
    } else {
      resultado.detalhes.push(captcha.detalhes);
    }
    console.log('2',resultado);
    return resultado;
  }

}

module.exports.antiCaptchaHandler = antiCaptchaHandler;
module.exports.xcaptchasIOHandler = xcaptchasIOHandler
const sleep = require('await-sleep');
const { enums } = require('../configs/enums');
let Anticaptcha = require('../bin/js/anticaptcha')(
  '4b93beb6fe87d3bf3cfd92966ec841a6'
);
const CAPTCHAIO_KEY = '405d27c9-5ef38c01c76b79.16080721';
const ANTICAPTCHA_KEY = '4b93beb6fe87d3bf3cfd92966ec841a6';

const { Robo } = require('../lib/robo');

const {
  AntiCaptchaResponseException,
} = require('../models/exception/exception');

const antiCaptchaHandler = async (
  website,
  websiteKey,
  pageAction,
  userAgent
) => {
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
        return reject(
          new AntiCaptchaResponseException('NOT_AVALIABLE', err.message)
        );
      }
      console.log('balance', balance);
      if (balance > 0) {
        Anticaptcha.createTaskProxyless((err, taskId) => {
          if (err) {
            return reject(
              new AntiCaptchaResponseException(
                'CREATE_PROXYLESS_TASK',
                err.message
              )
            );
          }
          Anticaptcha.getTaskSolution(taskId, (err, gResponse) => {
            if (err) {
              return reject(
                new AntiCaptchaResponseException(
                  'GET_CAPTCHA_SOLUTION',
                  err.message
                )
              );
            }
            return resolve({ sucesso: true, gResponse: gResponse });
          });
        });
      } else {
        return reject(
          new AntiCaptchaResponseException(
            'NO_FOUNDS',
            'Not enough founds to start the operation.'
          )
        );
      }
    });
  });
};

class AntiCaptchaHandler {
  static async resolverV2(website, websiteKey, pageAction) {
    const robo = new Robo();
    let objResponse;
    const espera = 20000;
    let captchaId;
    let tentativa = 0;
    let data;
    console.log(website, websiteKey, pageAction);
    objResponse = await robo.acessar({
      url: 'http://api.anti-captcha.com/createTask',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      usaJson: true,
      params: {
        clientKey: ANTICAPTCHA_KEY,
        task: {
          type: 'NoCaptchaTaskProxyless',
          websiteURL: website,
          websiteKey: websiteKey,
        },
        softId: 0,
      },
    });

    console.log(objResponse.responseBody);
    captchaId = objResponse.responseBody.taskId;

    if (this.testaErro(objResponse.responseBody).valido) {
      do {
        await sleep(espera);

        objResponse = await robo.acessar({
          url: 'http://api.anti-captcha.com/getTaskResult',
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          usaJson: true,
          params: {
            clientKey: ANTICAPTCHA_KEY,
            taskId: captchaId,
          },
        });
        data = new Date();
        console.log(
          '\tResponse',
          objResponse.responseBody,
          `${data.getHours()}:${data.getMinutes()}:${data.getSeconds()}`
        );

        if (!this.testaErro(objResponse.responseBody).valido) {
          break;
        }

        if (objResponse.responseBody.status == 'ready') {
          return {
            sucesso: true,
            gResponse: objResponse.responseBody.solution.gRecaptchaResponse,
          };
        }
      } while (tentativa < 5);
    }

    return {
      sucesso: false,
      detalhes: objResponse.responseBody,
    };
  }

  static testaErro(body) {
    let resultado = {
      valido: true,
      detalhes: [],
    };
    body = body.errorCode;

    if (/ERROR_KEY_DOES_NOT_EXIST/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_KEY_DOES_NOT_EXIST';
    }
    if (/ERROR_NO_SLOT_AVAILABLE/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_NO_SLOT_AVAILABLE';
    }
    if (/ERROR_ZERO_CAPTCHA_FILESIZE/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_ZERO_CAPTCHA_FILESIZE';
    }
    if (/ERROR_TOO_BIG_CAPTCHA_FILESIZE/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_TOO_BIG_CAPTCHA_FILESIZE';
    }
    if (/ERROR_ZERO_BALANCE/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_ZERO_BALANCE';
    }
    if (/ERROR_IP_NOT_ALLOWED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_IP_NOT_ALLOWED';
    }
    if (/ERROR_CAPTCHA_UNSOLVABLE/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_CAPTCHA_UNSOLVABLE';
    }
    if (/ERROR_BAD_DUPLICATES/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_BAD_DUPLICATES';
    }
    if (/ERROR_NO_SUCH_METHOD/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_NO_SUCH_METHOD';
    }
    if (/ERROR_IMAGE_TYPE_NOT_SUPPORTED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_IMAGE_TYPE_NOT_SUPPORTED';
    }
    if (/ERROR_NO_SUCH_CAPCHA_ID/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_NO_SUCH_CAPCHA_ID';
    }
    if (/ERROR_EMPTY_COMMENT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_EMPTY_COMMENT';
    }
    if (/ERROR_IP_BLOCKED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_IP_BLOCKED';
    }
    if (/ERROR_TASK_ABSENT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_TASK_ABSENT';
    }
    if (/ERROR_TASK_NOT_SUPPORTED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_TASK_NOT_SUPPORTED';
    }
    if (/ERROR_INCORRECT_SESSION_DATA/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_INCORRECT_SESSION_DATA';
    }
    if (/ERROR_PROXY_CONNECT_REFUSED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_CONNECT_REFUSED';
    }
    if (/ERROR_PROXY_CONNECT_TIMEOUT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_CONNECT_TIMEOUT';
    }
    if (/ERROR_PROXY_READ_TIMEOUT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_READ_TIMEOUT';
    }
    if (/ERROR_PROXY_BANNED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_BANNED';
    }
    if (/ERROR_PROXY_TRANSPARENT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_TRANSPARENT';
    }
    if (/ERROR_RECAPTCHA_TIMEOUT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_RECAPTCHA_TIMEOUT';
    }
    if (/ERROR_RECAPTCHA_INVALID_SITEKEY/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_RECAPTCHA_INVALID_SITEKEY';
    }
    if (/ERROR_RECAPTCHA_INVALID_DOMAIN/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_RECAPTCHA_INVALID_DOMAIN';
    }
    if (/ERROR_RECAPTCHA_OLD_BROWSER/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_RECAPTCHA_OLD_BROWSER';
    }
    if (/ERROR_TOKEN_EXPIRED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_TOKEN_EXPIRED';
    }
    if (/ERROR_PROXY_HAS_NO_IMAGE_SUPPORT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_HAS_NO_IMAGE_SUPPORT';
    }
    if (/ERROR_PROXY_INCOMPATIBLE_HTTP_VERSION/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_INCOMPATIBLE_HTTP_VERSION';
    }
    if (/ERROR_FACTORY_SERVER_API_CONNECTION_FAILED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_SERVER_API_CONNECTION_FAILED';
    }
    if (/ERROR_FACTORY_SERVER_BAD_JSON/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_SERVER_BAD_JSON';
    }
    if (/ERROR_FACTORY_SERVER_ERRORID_MISSING/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_SERVER_ERRORID_MISSING';
    }
    if (/ERROR_FACTORY_SERVER_ERRORID_NOT_ZERO/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_SERVER_ERRORID_NOT_ZERO';
    }
    if (/ERROR_FACTORY_MISSING_PROPERTY/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_MISSING_PROPERTY';
    }
    if (/ERROR_FACTORY_PROPERTY_INCORRECT_FORMAT/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_PROPERTY_INCORRECT_FORMAT';
    }
    if (/ERROR_FACTORY_ACCESS_DENIED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_ACCESS_DENIED';
    }
    if (/ERROR_FACTORY_SERVER_OPERATION_FAILED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_SERVER_OPERATION_FAILED';
    }
    if (/ERROR_FACTORY_PLATFORM_OPERATION_FAILED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_PLATFORM_OPERATION_FAILED';
    }
    if (/ERROR_FACTORY_PROTOCOL_BROKEN/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_PROTOCOL_BROKEN';
    }
    if (/ERROR_FACTORY_TASK_NOT_FOUND/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_TASK_NOT_FOUND';
    }
    if (/ERROR_FACTORY_IS_SANDBOXED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FACTORY_IS_SANDBOXED';
    }
    if (/ERROR_PROXY_NOT_AUTHORISED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_PROXY_NOT_AUTHORISED';
    }
    if (/ERROR_FUNCAPTCHA_NOT_ALLOWED/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FUNCAPTCHA_NOT_ALLOWED';
    }
    if (/ERROR_INVISIBLE_RECAPTCHA/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_INVISIBLE_RECAPTCHA';
    }
    if (/ERROR_FAILED_LOADING_WIDGET/.test(body)) {
      resultado.valido = false;
      resultado.detalhes = 'ERROR_FAILED_LOADING_WIDGET';
    }

    return resultado;
  }
}

class CaptchaIOHandler {
  constructor() {}

  static async resolverV2(website, websiteKey, pageAction) {
    const robo = new Robo();
    let objResponse;
    let captchaId;
    let url;
    let tentativas = 0;
    let espera = 20000;
    let data;

    // Realiza o pedido a api do captchas.io
    objResponse = await robo.acessar({
      url: 'https://api.captchas.io/in.php',
      method: 'post',
      params: {
        method: 'userrecaptcha',
        key: CAPTCHAIO_KEY,
        googlekey: websiteKey,
        pageurl: website,
        json: 1,
      },
    });
    console.log(objResponse.responseBody);
    console.log(this.testaErro(objResponse.responseBody.request));
    if (this.testaErro(objResponse.responseBody.request).valido) {
      captchaId = objResponse.responseBody.request;
      url = `?key=${CAPTCHAIO_KEY}&action=get&id=${captchaId}&json=1`;
      console.log('\tID: ', captchaId);
      do {
        await sleep(espera);
        objResponse = await robo.acessar({
          url: 'https://api.captchas.io/res.php' + url,
          method: 'get',
        });
        //TODO remover console
        data = new Date();
        console.log(
          '\tResponse',
          objResponse.responseBody,
          `${data.getHours()}:${data.getMinutes()}:${data.getSeconds()}`
        );

        if (!this.testaErro(objResponse.responseBody.request).valido) {
          break;
        }

        if (
          objResponse.responseBody &
          (objResponse.responseBody.request != 'CAPCHA_NOT_READY')
        ) {
          return {
            sucesso: true,
            gResponse: objResponse.responseBody.request,
          };
        }
        tentativas++;
      } while (tentativas < 5);
    }
    return {
      sucesso: false,
      detalhes: objResponse.responseBody,
    };
  }

  /**
   *
   * @param {Any} body
   * @returns {{valido: boolean}}
   */
  static testaErro(body) {
    let resposta = {
      valido: true,
    };

    if (/ERROR_PROXY_BANNED/.test(body)) {
      (resposta.detalhes = 'ERROR_PROXY_BANNED'), (resposta.valido = false);
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

    // if (/CAPCHA_NOT_READY/.test(body)) {
    //   resposta.detalhes = 'CAPCHA_NOT_READY';
    //   resposta.valido = false;
    // }

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
      detalhes: [],
    };
    let captcha;

    console.log("Captchas.IO");
    do {
      console.log("Tentativa", tentativas);
      resultado = await this.getCaptcha(website, websiteKey, pageAction, CaptchaIOHandler);
      await sleep(5000);
      if (resultado.sucesso) return resultado;
      tentativas++;
    } while (tentativas < maxTentativas);

    tentativas = 0;
    console.log('AntiCaptcha');

    do {
      console.log('Tentativa', tentativas);
      resultado = await this.getCaptcha(
        website,
        websiteKey,
        pageAction,
        AntiCaptchaHandler
      );
      if (resultado.sucesso) return resultado;
      tentativas++;
      await sleep(5000);
    } while (tentativas < maxTentativas);
    // } while(true)
    console.log('1', resultado);
    return resultado;
  }

  async getCaptcha(website, websiteKey, pageAction, tipoCaptcha) {
    let resultado = {
      sucesso: false,
      detalhes: [],
    };
    let captcha = await tipoCaptcha.resolverV2(website, websiteKey, pageAction);

    if (captcha.sucesso) {
      resultado.sucesso = true;
      resultado.gResponse = captcha.gResponse;
    } else {
      resultado.detalhes.push(captcha.detalhes);
    }
    console.log('2', resultado);
    return resultado;
  }
};

module.exports.antiCaptchaHandler = antiCaptchaHandler;

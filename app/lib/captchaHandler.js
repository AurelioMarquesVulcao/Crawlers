const sleep = require('await-sleep');
const axios = require('axios');
const ANTICAPTCHA_KEY = '49e40ab829a227a307ad542c7d003c7d';

const { Robo } = require('../lib/robo');
const { LogCaptcha } = require('../models/schemas/logCaptcha');

class AntiCaptchaHandler {
  static async resolverV2(website, websiteKey, pageAction) {
    const robo = new Robo();
    let objResponse;
    const espera = 20000;
    let captchaId;
    let tentativa = 0;
    let data;
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

    // console.log(objResponse.responseBody);
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
        // console.log(
        //   '\tResponse',
        //   objResponse.responseBody,
        //   `${data.getHours()}:${data.getMinutes()}:${data.getSeconds()}`
        // );

        if (!this.testaErro(objResponse.responseBody).valido) {
          break;
        }

        if (objResponse.responseBody.status === 'ready') {
          return {
            sucesso: true,
            captchaId: captchaId,
            gResponse: objResponse.responseBody.solution.gRecaptchaResponse,
            body: objResponse.responseBody,
          };
        }

        console.log(
          '\t',
          'AntiCaptcha - ReCaptchaV2 -',
          objResponse.responseBody.status
        );
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

module.exports.CaptchaHandler = class CaptchaHandler {
  /**
   *
   * @param {Number} tentativas numero de repetições antes de desistir do captcha
   * @param {Number} espera tempo de espera entre uma chamada de captcha e outra
   * @param {String} robo nome do robo
   * @param {{numeroDoProcesso: string}|{numeroDaOab: string}} identificador
   */
  constructor(tentativas = 5, espera = 5000, robo, identificador) {
    this.tentativas = tentativas;
    this.espera = espera;
    this.robo = robo;
    this.identificador = identificador;
  }

  async resolveRecaptchaV2(website, websiteKey, pageAction, userAgent) {
    let tentativas = 0;
    let maxTentativas = 6;
    let resultado = {
      sucesso: false,
      detalhes: [],
    };

    let logCaptcha = {
      Tipo: 'ReCaptchaV2',
      Website: website,
      WebsiteKey: websiteKey,
      PageAction: pageAction,
      Robo: this.robo,
      NumeroProcesso: this.identificador.numeroDoProcesso,
      NumeroOab: this.identificador.numeroDaOab,
    };
    // console.log('Captchas.IO');
    // do {
    //   console.log('Tentativa', tentativas);
    //   resultado = await this.getCaptcha(
    //     website,
    //     websiteKey,
    //     pageAction,
    //     CaptchaIOHandler
    //   );
    //   await sleep(5000);
    //   if (resultado.sucesso) return resultado;
    //   tentativas++;
    // } while (tentativas < maxTentativas);
    //
    // tentativas = 0;

    do {
      console.log(
        `\tAntiCaptcha - ReCaptchaV2 - [TENTATIVA: ${tentativas + 1}]`
      );
      await sleep(10000);
      resultado = await this.getCaptcha(
        website,
        websiteKey,
        pageAction,
        AntiCaptchaHandler
      );
      if (resultado.sucesso) {
        logCaptcha.Servico = 'AntiCaptcha';
        logCaptcha.CaptchaBody = resultado.body;
        new LogCaptcha(logCaptcha).save();
        console.log('\tAntiCaptcha - ReCaptchaV2 - Resolvido');
        return resultado;
      }
      console.log('\tAntiCaptcha - ReCaptchaV2 - Realizando nova tentativa');
      tentativas++;
      console.log(`\t\t${resultado.detalhes[0].errorCode}`);
    } while (tentativas < maxTentativas);
    // } while (true);
    // console.log('1', resultado);
    return resultado;
  }

  async getCaptcha(website, websiteKey, pageAction, tipoCaptcha) {
    let resultado = {
      sucesso: false,
      detalhes: [],
      body: {},
    };
    let captcha = await tipoCaptcha.resolverV2(website, websiteKey, pageAction);

    if (captcha.sucesso) {
      // data padrão vindo de 1970
      captcha.body.createTime = new Date(captcha.body.createTime);
      captcha.body.endTime = new Date(captcha.body.endTime);
      resultado.sucesso = true;
      resultado.gResponse = captcha.gResponse;
      resultado.captchaId = captcha.captchaId;
      resultado.body = captcha.body;
    } else {
      resultado.detalhes.push(captcha.detalhes);
    }
    // console.log('2', resultado);
    return resultado;
  }
};

module.exports.audioCaptchaHandler = async (b64String) => {
  const data = JSON.stringify({ audio: b64String });

  let config = {
    method: 'post',
    url: 'http://172.16.16.8:5000/api/solve',
    headers: {
      'Accept-Encoding': 'utf8',
      'Content-Type': 'application/json',
    },
    data: data,
  };

  let response = await axios(config);

  return response.data;
};

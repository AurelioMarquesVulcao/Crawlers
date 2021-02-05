const sleep = require('await-sleep');
const { enums } = require('../configs/enums');
const axios = require('axios');
const FormData = require('form-data');
let Anticaptcha = require('../bin/js/anticaptcha')(
  '4b93beb6fe87d3bf3cfd92966ec841a6'
);
const imagetyperzapi = require('imagetyperz-api');

const CAPTCHAIO_KEY = '405d27c9-5ef38c01c76b79.16080721';
const ANTICAPTCHA_KEY = '49e40ab829a227a307ad542c7d003c7d';
const IMAGETYPERZ_KEY = '522693887591496D9DD3AA7F3F193938';

imagetyperzapi.set_access_key(IMAGETYPERZ_KEY);

const { Robo } = require('../lib/robo');
const { LogCaptcha } = require('../models/schemas/logCaptcha');

const {
  AntiCaptchaResponseException,
} = require('../models/exception/exception');

/**
 * @typedef RespostaResvolveV2
 * @property {object} body
 * @property {string} gResponse
 * @property {string} captchaId
 * @property {string} detalhes
 * @property {boolean} sucesso
 */

/**
 * @typedef imagetyperz_resposta_api
 * @property {Number} CaptchaId
 * @property {string} Response
 * @property {string} Cookie_OutPut
 * @property {string} Proxy_reason
 * @property {string} Recaptcha_score
 * @property {string} Status
 */

/**
 * @typedef recaptchav2_resposta_api
 * @property {number} errorId
 * @property {string} status
 * @property {string} solution.gRecaptchaResponse
 * @property {string} cost
 * @property {string} ip
 * @property {Date} createTime
 * @property {Date} endTime
 * @property {number} solveCount
 */

const antiCaptchaHandler = async (website, websiteKey, pageAction) => {
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
      // console.log('balance', balance);
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
  /**
   *
   * @param website
   * @param websiteKey
   * @param pageAction
   * @return {Promise<RespostaResvolveV2>}
   */
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

        if (objResponse.responseBody.status == 'ready') {
          return {
            sucesso: true,
            captchaId: captchaId,
            gResponse: objResponse.responseBody.solution.gRecaptchaResponse,
            body: objResponse.responseBody,
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

  /**
   * Consulta a API do AntiCaptcha retornando o valor do saldo disponível.
   * @returns {Number} Saldo disponível para a conta do AntiCaptcha.
   */
  static async saldo() {
    try {
      let objResponse = await axios.post(
        'http://api.anti-captcha.com/getBalance',
        { clientKey: ANTICAPTCHA_KEY },
        { timeout: 20000 }
      );
      return objResponse.data.balance;
    } catch (e) {
      throw e;
    }
  }
}

class CaptchaIOHandler {
  constructor() {}
  /**
   * @param website
   * @param websiteKey
   * @param pageAction
   * @return {Promise<RespostaResvolveV2>}
   */
  static async resolverV2(website, websiteKey, pageAction) {
    const robo = new Robo();
    let objResponse;
    let captchaId;
    let url;
    let tentativas = 0;
    let espera = 20000; // 20 segundos
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

    console.log(
      `[VALIDO] ${
        objResponse.responseBody.request &
        this.testaErro(objResponse.responseBody.request).valido &
        (objResponse.responseBody.request != 'CAPCHA_NOT_READY')
      }`
    );
    console.log(`[BODY] ${objResponse.responseBody.request} \n\n`);

    if (
      objResponse.responseBody.request &
      this.testaErro(objResponse.responseBody.request).valido &
      (objResponse.responseBody.request != 'CAPCHA_NOT_READY')
    ) {
      return {
        sucesso: true,
        detalhes: objResponse.responseBody,
      };
    } else {
      return {
        sucesso: false,
        detalhes: objResponse.responseBody,
      };
    }
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

class ImageTyperZHandler {
  /**
   * Faz a resolução de decaptcha V2 de um determinado website
   * @param website
   * @param websiteKey
   * @param pageAction
   * @return {Promise<RespostaResvolveV2>}
   */
  static async resolverV2(website, websiteKey, pageAction) {
    const espera = 20000; // 20 segundos
    let options = {};
    let tentativa = 0;
    let resposta;

    options['page_url'] = website;
    options['sitekey'] = websiteKey;

    let createTime = new Date();

    let captchaId = await imagetyperzapi.submit_recaptcha(options);

    console.log({ captchaId });

    do {
      await sleep(espera);

      /**@type imagetyperz_resposta_api*/
      let respostaCaptcha = await imagetyperzapi.retrieve_response(captchaId);

      if (respostaCaptcha.Status === 'Solved') {
        let endTime = new Date();
        resposta = {
          body: {
            ...respostaCaptcha,
            createTime,
            endTime,
            cost: String(this.getCaptchaValues('RecaptchaV2')),
          },
          gResponse: respostaCaptcha.Response,
          captchaId: respostaCaptcha.CaptchaId,
          sucesso: true,
        };
        break;
      }
    } while (tentativa < 5);

    if (tentativa === 5) {
      resposta.sucesso = false;
      resposta.detalhes = 'Tentativas excedidas';
    }

    console.log(resposta);
    return resposta;
  }

  /**
   * Consulta a API do ressolvedor de captcha retornando o valor do saldo disponível.
   * @returns {Number} Saldo disponível para a conta do AntiCaptcha.
   */
  static async saldo() {
    try {
      let balance = await imagetyperzapi.account_balance();
      return balance;
    } catch (e) {
      throw e;
    }
  }

  /**
   * @param {String} captchaType
   * @return {number}
   */
  static getCaptchaValues(captchaType) {
    let valorPorMil = {
      RecaptchaV2: 2.1,
      RecaptchaV3: 2.1,
      RecaptchaEnterprise: 3.0,
      Geetest: 1.5,
      Capy: 1.5,
      Hcaptcha: 1.8,
      Tiktok: 1.8,
    };

    return valorPorMil[captchaType] / 1000;
  }
}

/**
 *
 * @param {Number} tentativas numero de repetições antes de desistir do captcha
 * @param {Number} espera tempo de espera entre uma chamada de captcha e outra
 * @param {String} robo nome do robo
 * @param {{numeroDoProcesso: String, numeroDaOab: String}} identificador
 */
module.exports.CaptchaHandler = class CaptchaHandler {
  constructor(tentativas = 5, espera = 5000, robo, identificador) {
    this.tentativas = tentativas;
    this.espera = espera;
    this.robo = robo;
    this.identificador = identificador;
  }

  async resolveRecaptchaV2(website, websiteKey, pageAction, userAgent) {
    let tentativas = 0;
    let maxTentativas = 5;
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

    let anticaptchaDisponivel = await AntiCaptchaHandler.saldo()
      .then((res) => (res.balance > 0.7 ? res.balance : false))
      .catch((e) => false);

    if (anticaptchaDisponivel) {
      console.log('Anticaptcha V2 Selecionado');
      console.log(anticaptchaDisponivel);
      do {
        console.log(
          `\tAntiCaptcha - ReCaptchaV2 - [TENTATIVA: ${tentativas + 1}]`
        );
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
          return resultado;
        }
        tentativas++;
        console.log(`\t\t${resultado.detalhes[0].errorCode}`);
        await sleep(100);
        // } while (tentativas < maxTentativas);
      } while (true);
    }

    let imagetyperzDisponivel = await ImageTyperZHandler.saldo()
      .then((res) => (Number(res) > 0.7 ? Number(res) : false))
      .catch((e) => false);

    console.log(imagetyperzDisponivel);
    if (imagetyperzDisponivel) {
      do {
        console.log(
          `\tImageTyperZ - ReCaptchaV2 - [TENTATIVA: ${tentativas + 1}]`
        );
        resultado = await this.getCaptcha(
          website,
          websiteKey,
          pageAction,
          ImageTyperZHandler
        );
        if (resultado.sucesso) {
          logCaptcha.Servico = 'imagetyperz';
          logCaptcha.CaptchaBody = resultado.body;
          console.log(logCaptcha);
          new LogCaptcha(logCaptcha).save();
          return resultado;
        }
        tentativas++;
        console.log(`\t\t${resultado.detalhes[0].errorCode}`);
        await sleep(100);
      } while (true);
    }

    return resultado;
  }

  async getCaptcha(website, websiteKey, pageAction, tipoCaptcha) {
    let resultado = {
      sucesso: false,
      detalhes: [],
      body: {},
    };
    /**@type {RespostaResvolveV2}*/
    let captcha = await tipoCaptcha.resolverV2(website, websiteKey, pageAction);

    if (captcha.sucesso) {
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

  async antiCaptchaImage(captchaB64, website) {
    let logCaptcha = {
      Tipo: 'ImageCaptcha',
      Website: website,
      Robo: this.robo,
      NumeroProcesso: this.identificador.numeroDoProcesso,
      NumeroOab: this.identificador.numeroDaOab,
    };

    let body = {
      clientKey: ANTICAPTCHA_KEY,
      task: {
        type: 'ImageToTextTask',
        body: captchaB64,
      },
    };

    let response = await axios.post(
      'https://api.anti-captcha.com/createTask',
      body
    );
    const taskId = response.data.taskId;

    if (!taskId) {
      console.log('Não foi possivel recuperar a TaskId');
      return { sucesso: false };
    }

    let tentativa = 0;
    console.log(`Captcha TaskId [${taskId}] - Iniciando Captcha`);
    do {
      tentativa++;
      await sleep(5000);
      console.log(
        `Captcha TaskId [${taskId}] - Tentativa: ${tentativa} - Aguardando 10 segundos.`
      );
      response = await axios.post(
        'https://api.anti-captcha.com/getTaskResult',
        {
          clientKey: ANTICAPTCHA_KEY,
          taskId: taskId,
        }
      );

      if (response.data.status === 'ready') {
        logCaptcha.Servico = 'AntiCaptcha';
        logCaptcha.CaptchaBody = response.data;
        new LogCaptcha(logCaptcha).save();
        return { sucesso: true, resposta: response.data.solution.text };
      }
    } while (tentativa < 6);

    return { sucesso: false };
  }

  async imagetyperzCaptchaImage(captchaB64, website) {
    let logCaptcha = {
      Tipo: 'ImageCaptcha',
      Website: website,
      Robo: this.robo,
      NumeroProcesso: this.identificador.numeroDoProcesso,
      NumeroOab: this.identificador.numeroDaOab,
    };

    let data = new FormData();
    data.append('token', IMAGETYPERZ_KEY);
    data.append('action', 'UPLOADCAPTCHA');
    data.append('file', `${captchaB64}`);

    let config = {
      method: 'post',
      url: 'http://captchatypers.com/Forms/UploadFileAndGetTextNEW.ashx',
      headers: {
        ...data.getHeaders(),
      },
      data: data,
    };

    let response = await axios(config);
    let taskId = response.data.replace(/\D/g, '');
    console.log({ taskId });

    if (!taskId) {
      console.log('Não foi possivel recuperar a TaskId');
      return { sucesso: false };
    }

    let tentativa = 0;
    console.log(`Captcha TaskId [${taskId}] - Iniciando Captcha`);
    do {
      tentativa++;
      await sleep(10000);
      console.log(
        `Captcha TaskId [${taskId}] - Tentativa: ${tentativa} - Aguardando 10 segundos`
      );

      let retrieveData = new FormData();
      retrieveData.append('token', IMAGETYPERZ_KEY);
      retrieveData.append('captchaid', taskId);
      retrieveData.append('action', 'GETTEXT');

      let options = {
        method: 'post',
        url: 'http://captchatypers.com/captchaapi/GetCaptchaResponseJson.ashx',
        headers: {
          ...retrieveData.getHeaders(),
        },
        data: retrieveData,
      };

      /**@type {Object}
       * @property {imagetyperz_resposta_api} data*/
      let response = await axios(options);
      response.data = response.data[0];
      console.log(response.data);
      if (response.data.Status === 'Solved') {
        logCaptcha.Servico = 'AntiCaptcha';
        logCaptcha.CaptchaBody = response.data;
        new LogCaptcha(logCaptcha).save();
        return { sucesso: true, resposta: response.data.Response };
      }
    } while (tentativa < 6);

    return { sucesso: false };
  }
};

module.exports.antiCaptchaHandler = antiCaptchaHandler;
module.exports.AntiCaptchaAPI = AntiCaptchaHandler;
module.exports.ImageTyperZHandler = ImageTyperZHandler;

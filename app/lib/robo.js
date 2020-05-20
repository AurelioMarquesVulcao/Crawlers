const axios = require('axios');
const FormData = require('form-data');
const moment = require('moment');

const { RequestException } = require('../models/exception/exception');
const { enums } = require('../configs/enums');

const chromeUserAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36';

class Requisicao {
  /**
   * Request
   */
  constructor() {
    this.contadorTentativas = 1;
  }

  /**
   * Obter um UserAgent para ser usado
   */
  obterUserAgent(aleatorio = true) {
    //TODO checar viabilidade dessa função ao manter o session de um robo (preservar captchas)
    const agents = [
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // Chrome
      'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0', // Mozila
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36 OPR/38.0.2220.41', //Opera
      'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1', //Safari
    ];
    if (aleatorio) return agents[Math.floor(Math.random() * agents.length)];

    return agents[0];
  }

  /**
   * Remove os cookies adicionados pelos servidores de proxy.
   *
   * @param {String[]} cookies
   */
  validarCookies(cookies) {
    if (!cookies) return [];

    let reProxy = /SERVERID=.*;\spath=\//g;
    let validos = cookies.filter((x) => {
      return !reProxy.test(x);
    });

    return validos;
  }

  async enviarRequest(options) {
    const promise = new Promise((resolve, reject) => {
      let statusCode = 500;
      axios(options)
        .then((res) => {
          if (res) {
            statusCode = res.status;

            if (statusCode == 200) {
              const corpo = res.data ? res.data : true;
              resolve({
                code: 'HTTP_200',
                status: statusCode,
                message: `StatusCode: ${statusCode}.`,
                responseContent: res,
                responseBody: corpo,
                cookies: this.validarCookies(res.headers['set-cookie']),
              });
            } else {
              resolve({
                //TODO observar se pode se tornar reject
                code: 'HTTP_STATUS_NOT_200',
                status: statusCode,
                message: `StatusCode: ${statusCode}.`,
                responseContent: res,
                responseBody: res.data,
              });
            }
          } else {
            resolve({
              //TODO observar se pode se tornar reject
              code: 'HTTP_RESPONSE_FAIL',
              message: 'Não houve resposta do servidor!',
              status: statusCode,
              message: `StatusCode: ${statusCode}.`,
              responseContent: null,
              responseBody: '',
            });
          }
        })
        .catch((err) => {
          resolve({
            //TODO observar se pode se tornar reject
            code: err.code,
            status: 502,
            message: err.message,
            responseContent: null,
            responseBody: '',
          });
        });
    });

    let response = await promise;

    if (response.code) {
      if (
        /ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ECONNREFUSED|ENOPROTOOPT/.test(
          response.code
        )
      ) {
        const mensagem = `Parando script CODE: ${
          response.code
        } | ${moment().format('DD/MM/YYYY HH:mm:ss')}`;
        throw new RequestException(response.code, response.status, mensagem);
      } else if (/HTTP_STATUS_NOT_200|HTTP_REPONSE_FAIL/.test(response.code)) {
        if (this.contadorTentativas < 1) {
          console.log(
            `${response.code} | Tentativa ${this.contadorTentativas} para ${
              options.url
            } | ${options.proxy ? options.proxy : 'sem proxy'}`
          );

          this.contadorTentativas += 1;
          response = await this.enviarRequest(options);
        } else {
          throw new RequestException(
            response.code,
            response.status,
            'Resposta Nula'
          );
        }
      }
    }
    return response;
  }
}

class Resposta {
  constructor(labels = [], dados = [], error = null) {
    this.labels = labels;
    this.dados = dados;
    this.error = error;
  }
}

class Robo {
  /**
   * Robo
   */
  constructor() {
    this.requisicao = new Requisicao();
    this.cookies = '';
    this.headless = true;
  }

  /**
   * Acessa o site
   * @param {string} url URL do site
   * @param {string} method 'GET'ou 'POST'
   * @param {string} encoding tipo de codificacao
   * @param {boolean} usaProxy deve usar proxy
   * @param {boolean} usaJson é do tipo querystring
   * @param {object} params parametros para o form ou querystring
   * @param {object} headers headers
   * @param {boolean} randomUserAgent deve utilizar um user agent aleatorio?
   */
  async acessar({
    url,
    method = 'GET',
    encoding = null,
    usaProxy = false,
    usaJson = false,
    params = null,
    headers = {},
    randomUserAgent = false,
  } = {}) {
    if (!url || url == '') throw new Error('URL vazia!');

    headers['User-Agent'] = this.requisicao.obterUserAgent(randomUserAgent);

    const options = {
      url: url,
      headers: headers,
      method: method,
    };

    if (params) {
      if (usaJson) options.json = params;
      // Json
      else {
        // FormData
        let form = new FormData();
        for (let key in params) {
          form.append(key, params[key]);
        }
        options.data = form.getBuffer();
        options.headers = { ...options.headers, ...form.getHeaders() };
      }
    }

    if (usaProxy)
      options.proxy = {
        host: 'proxy-proadv.7lan.net',
        port: 8181,
        auth: { username: 'proadvproxy', password: 'C4fMSSjzKR5v9dzg' },
      };

    options.timeout = 60000;
    return this.requisicao.enviarRequest(options);
  }
}

module.exports.Resposta = Resposta;
module.exports.Requisicao = Requisicao;
module.exports.Robo = Robo;

const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const FormData = require('form-data');
const moment = require('moment');

const { RequestException } = require('../models/exception/exception');

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
    return cookies.filter((x) => {
      return !reProxy.test(x);
    });
  }

  async enviarRequest(options) {
    const promise = new Promise((resolve) => {

      // Alteração importante de segurança no código
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

      let statusCode = 500;
      axios(options)
        .then((res) => {
          if (res) {
            statusCode = res.status;

            //if (statusCode >= 200 && statusCode < 300) {
            if (statusCode === 200) {
              const corpo = res.data ? res.data : true;
              resolve({
                code: 'HTTP_200',
                status: statusCode,
                message: `StatusCode: ${statusCode}.`,
                responseContent: res,
                responseBody: corpo,
                cookies: this.validarCookies(res.headers['set-cookie']),
              });
            } else if ((statusCode === 204)) {
              resolve({
                code: 'HTTP_204',
                status: statusCode,
                message: `StatusCode: ${statusCode}.`,
                responseContent: res,
                responseBody: undefined,
                cookies: this.validarCookies(res.headers['set-cookie']),
              });
            }
            else {
              resolve({
                code: 'HTTP_STATUS_NOT_200',
                status: statusCode,
                message: `StatusCode: ${statusCode}.`,
                responseContent: res,
                responseBody: res.data,
              });
            }
          } else {
            resolve({
              code: 'HTTP_RESPONSE_FAIL',
              status: statusCode,
              message: `StatusCode: ${statusCode}.`,
              responseContent: null,
              responseBody: '',
            });
          }
        })
        .catch((err) => {
          console.log('----- Robo erro', err, '-----');
          let resposta = {};
          if (err.response) {
            resposta.status = err.response.status;
            resposta.message = err.response.statusText;
            resposta.responseBody = err.response.data ? err.response.data : '';
            resposta.headers = err.response.headers;
          }
          resposta.code = err.code;
          resolve(resposta);
        });
    });

    let response = await promise;

    if (response.code) {
      if (
        /ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNREFUSED|ENOPROTOOPT/.test(
          response.code
        )
      ) {
        const mensagem = `Parando script CODE: ${response.code
          } | ${moment().format('DD/MM/YYYY HH:mm:ss')}`;
        throw new RequestException(response.code, response.status, mensagem);
      } else if (/HTTP_STATUS_NOT_200|HTTP_REPONSE_FAIL/.test(response.code)) {
        if (this.contadorTentativas < 1) {
          console.log(
            `${response.code} | Tentativa ${this.contadorTentativas} para ${options.url
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

class Robo {
  /**
   * Robo
   */
  constructor() {
    this.requisicao = new Requisicao();
    this.cookies = '';
  }

  /**
   * Acessa o site
   * @param {Object} options opções para fazer a request
   * @param {string} options.url URL do site
   * @param {string} options.method 'GET'ou 'POST'
   * @param {string} options.encoding tipo de codificacao
   * @param {boolean} options.usaProxy deve usar proxy
   * @param {boolean} options.usaJson é do tipo querystring
   * @param {Object} options.params parametros para o form ou querystring
   * @param {Object} options.headers headers
   * @param {boolean} options.randomUserAgent deve utilizar um user agent aleatorio?
   */
  async acessar({
    url,
    method = 'GET',
    encoding = '',
    usaProxy = false,
    usaJson = false,
    params = null, // body!
    headers = {},
    randomUserAgent = false,
    responseType = ''
  } = {}) {
    if (!url || url === '') throw new Error('URL vazia!');

    headers['User-Agent'] = this.requisicao.obterUserAgent(randomUserAgent);

    const options = {
      url: url,
      headers: headers,
      method: method,
      responseType: responseType,


      strictSSL: false,
      encoding: encoding,
      followAllRedirects: true,
      timeout: 100000
    };

    if (params) {
      if (usaJson) options.data = params;
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

    if (usaProxy) {
      options.httpsAgent = new HttpsProxyAgent(
        'http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8181'
      );
    }
    //   host: 'proxy-proadv.7lan.net',
    //   port: 8181,
    //   auth: 'proadvproxy:C4fMSSjzKR5v9dzg'
    // });

    options.timeout = 60000;
    // console.log(options);
    return this.requisicao.enviarRequest(options);
  }
}

module.exports.Requisicao = Requisicao;
module.exports.Robo = Robo;

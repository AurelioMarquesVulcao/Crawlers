const axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
const FormData = require('form-data');
const moment = require('moment');

class Requisicao {
  constructor() {}

  async enviarRequest(options) {
    if (!options) {
      throw new Error('Options vazio');
    }

    let cookies = {};
    let res = await axios(options)
      .then((res) => {
        let objResponse = {};
        if (res) {
          if (res.status === 200) {
            objResponse.code = 'HTTP_200';
            objResponse.status = res.status;
            objResponse.headers = res.headers;
            objResponse.message = `${objResponse.code}_${objResponse.status}`;
            objResponse.responseContent = res;
            objResponse.responseBody = res.data ? res.data : true;
            cookies = this.tratarCookie(res.headers['set-cookie']);
          } else {
            objResponse.code = 'HTTP_STATUS_NOT_200';
            objResponse.status = res.status;
            objResponse.message = `${objResponse.code}_${objResponse.status}`;
            objResponse.responseContent = res;
            objResponse.responseBody = res.data ? res.data : true;
            objResponse.headers = res.headers;
          }
        } else {
          objResponse.code = 'HTTP_RESPONSE_FAIL';
          objResponse.status = res.status;
          objResponse.message = `${objResponse.code}_${objResponse.status}`;
        }
        return { objResponse: objResponse, cookies: cookies };
      })
      .catch((err) => {
        console.log('Erro ao acessar');
        let objResponse = {};
        objResponse.code = err.code;
        objResponse.status = err.response.status;
        objResponse.message = err.response.statusText;
        objResponse.responseBody = err.response.data ? err.response.data : '';
        objResponse.headers = err.response.headers;
        return { objResponse: objResponse };
      });

    if (res.objResponse.code) {
      if (
        /ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ECONNREFUSED|ENOPROTOOPT/.test(
          res.objResponse.code
        )
      ) {
        const mensagem = `Parando script CODE: ${
          res.objResponse.code
        } | ${moment().format('DD/MM/YYYY HH:mm:ss')}`;
        throw new Error(mensagem);
      }
    }

    return res;
  }

  tratarCookie(cookies = []) {
    let dictCookies = {};

    if (!cookies) return {};

    let reProxy = /SERVERID=.*;\spath=\//g;
    cookies = cookies.filter((x) => {
      return !reProxy.test(x);
    });
    cookies = cookies.map((element) => {
      return element.replace(/;\s?([Pp])ath.*/, '');
    });
    cookies
      .toString()
      .split(/\s*,\s*/)
      .forEach(function (pair) {
        pair = pair.split(/\s*=\s*/);
        dictCookies[pair[0]] = pair.splice(1).join('=');
      });

    return dictCookies;
  }
}

class Robo {
  constructor() {
    this.requisicao = new Requisicao();
    this.headers = {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36', // Chrome,
    };
    this.cookies = {};
  }

  /**
   * Realiza o request para uma url e aguarda a resposta.
   * @param {Object} options opcoes que compõem uma request.
   * @param {string} options.url url da request.
   * @param {string} options.method metodo da request.
   * @param {string} options.encoding encoding esperado.
   * @param {boolean} options.proxy opção para habilitar o uso de proxy.
   * @param {Object} options.queryString variavel que representa a query string.
   * @param {Object} options.formData variavel que representa o form-data.
   * @param {Object} options.json variavel que representa o json.
   * @param {Object} options.headers variavel que contem os headers.
   * @param {boolean} options.randomUserAgent opção para habilitar o userAgent aleatorio.
   * @param {number} options.timeout tempo de espera.
   * @returns {Promise<{Object}>}
   */
  async acessar({
    url,
    method = 'GET',
    encoding = 'latin1',
    proxy = false,
    queryString = {},
    formData = {},
    json = {},
    headers = {},
    randomUserAgent = false,
    timeout = 6000,
  } = {}) {
    if (!url || url === '') throw new Error('URL Vazia');

    if (randomUserAgent)
      this.setHeader({ 'User-Agent': this.requisicao.obterUserAgent() });

    let options = {
      url: url,
      method: method,
      responseEncoding: encoding,
    };

    if (Object.keys(queryString).length > 0) {
      options.url = url + this.converterQueryString(queryString);
    } else {
      if (Object.keys(formData).length > 0) {
        let fd = this.converterFormData(formData);
        this.setHeader(fd.header);
        options.data = fd.data;
      } else {
        // json
        this.setHeader({ 'Content-Type': 'application/json' });
        options.data = JSON.stringify(json);
      }
    }

    if (proxy) {
      options.httpsAgent = new HttpsProxyAgent(
        'http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8181'
      );
    }

    this.setHeader(headers, this.convertStrCookie());

    options.timeout = timeout;

    let resposta = await this.requisicao.enviarRequest(options);

    this.cookies = { ...this.cookies, ...resposta.cookies };

    console.log('cookies', this.cookies);
    return resposta.objResponse;
  }

  converterQueryString(queryString = {}) {
    let qs = [];
    for (let e in queryString) {
      qs.push(`${e}=${queryString[e]}`);
    }
    return `?${qs.join('&')}`;
  }

  setCookies(cookies = {}) {
    this.cookies = { ...this.headers.Cookie, ...cookies };
  }

  setHeader(headers = {}, cookies = {}) {
    this.setCookies(cookies);
    this.headers = { ...this.headers, ...headers };
  }

  converterFormData(formData = {}) {
    let fd = new FormData();
    for (let key in formData) {
      fd.append(key, formData[key]);
    }
    return { header: fd.getHeaders(), data: fd.getBuffer() };
  }

  convertStrCookie() {
    let strCookie = [];
    for (let c in this.cookies) {
      strCookie.push(`${c}=${this.cookies[c]}`);
    }
    return strCookie.join(';');
  }
}

module.exports.Robo = Robo;

const fs = require("fs");
const request = require("request");
const moment = require("moment");
const puppeteer = require("puppeteer");
const axios = require("axios");
const { Helper } = require("./util");
const { RequestException } = require("../models/exception/exception");

class Resposta {
  constructor(labels = [], dados = [], error = null) {
    this.Labels = labels;
    this.Dados = dados;
    this.error = error;
  }
};

class Requisicao {
  /**
   * Modelo Requisicao
   */
  constructor() {
    this.contadorTentativas = 1;
  }

  /**
   * Obtem um User Agent pra ser usado na requisicao
   */
  obterUserAgentAleatorio() {
    const agents = [
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36", // Chrome
      "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0", // Mozila
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.106 Safari/537.36 OPR/38.0.2220.41", //Opera
      "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_1 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) Version/10.0 Mobile/14E304 Safari/602.1", //Safari
      "Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)" // IE
    ];

    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * Envia uma request para um endereco http ou https presente no options
   * @param {JSON} options
   */
  async enviarRequest(options) {
    const promise = new Promise((resolve, reject) => {
      let statusCode = 500;

      request(options, (err, res, body) => {
        if (err) {
          reject({
            code: err.code,
            status: 502,
            message: err.message,
            responseContent: null,
            responseBody: ""
          });
        } else {
          if (res) {
            statusCode = res.statusCode;

            if (statusCode >= 200 && statusCode < 300) {
              const corpo = body ? body : true;
              resolve({
                code: "HTTP_200",
                status: statusCode,
                message: `StatusCode: ${statusCode}.`,
                responseContent: res,
                responseBody: corpo,
                cookies: res.headers["set-cookie"]
                  ? res.headers["set-cookie"]
                  : null
              });
            } else {
              reject({
                code: "HTTP_STATUS_NOT_200",
                status: statusCode,
                message: `StatusCode: ${statusCode}.`,
                responseContent: res,
                responseBody: body
              });
            }
          } else {
            reject({
              code: "HTTP_REPONSE_FAIL",
              message: "Não houve response do servidor!",
              status: statusCode,
              message: `StatusCode: ${statusCode}.`,
              responseContent: null,
              responseBody: ""
            });
          }
        }
      });
    });

    let response = await promise;

    // .then(res => res).catch(err => err);

    // logar requisicoes para saber quantas requisiçoes em media
    // const log = {
    //   data: `${moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS")}Z`,
    //   ...options
    // };
    // await new Request().inserir(log);
    // await sleep(600);

    if (response.code) {
      if (
        /ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ECONNREFUSED|ENOPROTOOPT/.test(
          response.code
        )
      ) {
        const mensagem = `Parando script|(ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ENOPROTOOPT)|${
          response.code
        }|${moment().format("DD/MM/YYYY HH:mm:ss")}`;
        // new Notificacao().enviarNotificacao(texto);        
        throw new RequestException(response.code, response.status, mensagem);
      } else if (/HTTP_STATUS_NOT_200|HTTP_REPONSE_FAIL/.test(response.code)) {
        if (this.contadorTentativas < 1) {
          console.log(
            `${response.code} | Tentativa ${this.contadorTentativas} para ${
              options.url
            } | ${options.proxy ? options.proxy : "sem proxy"}`
          );

          if (options.params) Helper.pretty(params);

          this.contadorTentativas += 1;

          response = await this.enviarRequest(options);
        } else {
          throw new RequestException(response.code, response.status, "Response veio nula");
        }
      }
    }

    return response;
  }
};

class Robo {
  /**
   * Robo do RPA
   */
  constructor() {
    this.requisicao = new Requisicao();
    this.cookies = "";
    this.headless = true;
  }

  /**
   * Acessa o site e retorna a response em html
   * @param {string}  url       Url a ser acessada
   * @param {string}  method    Verbo http POST, GET, PUT, PATCH, DELETE
   * @param {string}  encoding  Codificacao
   * @param {boolean} isProxied Boolean para identificar se a requisicao deve ser feita com proxy
   * @param {boolean} isJson    Boolean para identificar se os dados informados sao json ou nao
   * @param {JSON}    params    Dados de form para serem enviados
   * @param {JSON}    rHeaders  Objeton json de headers adicionais
   */
  async acessar(
    url,
    method = "post",
    encoding = null,
    isProxied = false,
    isJson = false,
    params = null,
    rHeaders = {}
  ) {
    if (!url || url == "") throw new Error("URL vazia!");

    const headers = {
      "User-Agent": this.requisicao.obterUserAgentAleatorio(),
      ...rHeaders
    };

    const options = {
      url: url,
      headers: headers,
      method: method,
      strictSSL: false,
      encoding: encoding,
      followAllRedirects: true,
      timeout: 100000
    };

    if (params) {
      if (isJson) options.json = params;
      else options.form = params;
    }    

    if (isProxied)
      options.proxy =
        "http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8181";

    return this.requisicao.enviarRequest(options);
  }

  /**
   * Acesso puppeteer
   */
  async acessarPuppeteer(url, callback) {    
    const launchOptions = {
      headless: this.headless,
      timeout: 50000,
      args: [        
        "--no-sandbox",        
        `--proxy-server=http://proxy-proadv.7lan.net:8181`,
        `--ignore-certificate-errors`
      ],
      ignoreDefaultArgs: ["--disable-extensions"]
    };

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setViewport({
      width: 1024,
      height: 768
    });

    await page.goto(url, {
      waitUntil: "load",
      timeout: 0
    });    

    return callback(page, browser);
  }

  /**
   * Salva imagem do captcha
   * @param {*} uri 
   * @param {*} cookies 
   * @param {*} filename 
   * @param {*} callback 
   */
  salvarImgCaptcha(uri, cookies, filename, callback) {
    request.head(uri, function(err, res, body) {
      console.log("salvarImgCaptcha@Cookie:", cookies);
      console.log(
        "salvarImgCaptcha@content-type:",
        res.headers["content-type"]
      );
      console.log(
        "salvarImgCaptcha@content-length:",
        res.headers["content-length"]
      );

      request({
        url: uri,
        headers: {
          Cookie: cookies
        }
      })
        .pipe(fs.createWriteStream(filename))
        .on("close", callback);
    });
  }
};

module.exports.Resposta = Resposta;
module.exports.Requisicao = Requisicao;
module.exports.Robo = Robo;
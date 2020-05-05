const cheerio = require('cheerio');
const moment = require('moment');
const { antiCaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const re = require('xregexp');

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJSPParser } = require('../parsers/TJSPParser');

class OabTJSP extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJSPParser();
    this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
  }

  async extrair(numeroDaOab) {
    try {
      let resultados = [];
      let preParse = {};
      let uuidCaptcha = '';
      let gResponse = '';
      let cookies = {};
      let listaProcessos = [];
      /**
       * Objeto cujo valor é o retorno do robo
       */
      let objResponse = {}; // Objeto cujo valor é o retorno do robô

      // Primeira parte: para pegar cookies e uuidcaptcha
      objResponse = await this.robo.acessar(
        'https://esaj.tjsp.jus.br/cpopg/open.do',
        'GET',
        'latin1',
        false,
        false,
        null
      );
      cookies = objResponse.cookies;
      cookies = cookies.map((element) => {
        return element.replace(/\;.*/, '');
      });
      cookies = cookies.join('; ');

      preParse = await this.preParse(objResponse.responseBody, cookies);
      uuidCaptcha = preParse.captcha.uuidCaptcha;
      gResponse = await this.getCaptcha();

      // Segunda parte: pegar a lista de processos

      listaProcessos = await this.getListaProcessos(
        numeroDaOab,
        cookies,
        uuidCaptcha,
        gResponse
      );

      // Terceira parte: passar a lista, pegar cada um dos codigos
      // resultantes e mandar para o parser

      if (listaProcessos.length > 0) {
        resultados = await this.extrairProcessos(listaProcessos, cookies);
        return Promise.all(resultados).then((args) => {
          return {
            resultado: args,
            sucesso: true,
            detalhes: '',
          };
        });
      }

      return {
        resultado: [],
        sucesso: false,
        detalhes: 'Lista de processos vazia',
      };
    } catch (error) {
      if (error instanceof AntiCaptchaResponseException) {
        throw new AntiCaptchaResponseException(error.code, error.message);
      }

      throw error;
    }
  }

  /**
   * Pré-processador da pagina a ser extraida
   * @param {string} content Página resultade de uma consulta do co Axios
   */
  async preParse(content, cookies) {
    const $ = cheerio.load(content);

    let preParse = {
      captcha: {
        hasCaptcha: false,
        uuidCaptcha: '',
      },
    };

    preParse.captcha.hasCaptcha = $('#rc-anchor-content');
    preParse.captcha.uuidCaptcha = await this.getCaptchaUuid(cookies);

    return preParse;
  }

  async getCaptcha() {
    let responseAntiCaptcha = {};
    responseAntiCaptcha = await antiCaptchaHandler(
      'https://esaj.tjsp.jus.br/cpopg/open.do',
      this.dataSiteKey,
      '/'
    );

    if (!responseAntiCaptcha) {
      throw new AntiCaptchaResponseException(
        'CAPTCHA',
        'Nao foi possivel recuperar a resposta para o captcha'
      );
    }

    return responseAntiCaptcha.gResponse;
  }

  async getCaptchaUuid(cookies) {
    let objResponse = await this.robo.acessar(
      'https://esaj.tjsp.jus.br/cpopg/captchaControleAcesso.do',
      'POST',
      'latin1',
      false,
      false,
      null,
      {
        Cookie: cookies,
      }
    );
    let uuid = objResponse.responseBody.uuidCaptcha;
    return uuid;
  }

  async getListaProcessos(numeroDaOab, cookies, uuidCaptcha, gResponse) {
    let condition = false;
    let processos = [];
    let url = `https://esaj.tjsp.jus.br/cpopg/search.do?conversationId=&dadosConsulta.localPesquisa.cdLocal=-1&cbPesquisa=NUMOAB&dadosConsulta.tipoNuProcesso=UNIFICADO&dadosConsulta.valorConsulta=${numeroDaOab}SP&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;

    do {
      let objResponse = await this.robo.acessar(
        url,
        'GET',
        'latin1',
        false,
        false,
        null,
        {
          Host: 'esaj.tjsp.jus.br',
          Connection: 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36',
          'Sec-Fetch-User': '?1',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-Mode': 'navigate',
          Referer: 'https://esaj.tjsp.jus.br/cpopg/search.do',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          Cookie: cookies,
        }
      );

      const $ = cheerio.load(objResponse.responseBody);

      try {
        processos = [...processos, ...this.extrairLinksProcessos($)];
        const proximaPagina = $('[title|="Próxima página"]').first();

        if (!proximaPagina.text()) return processos;

        condition = true;
        url = 'https://esaj.tjsp.jus.br' + proximaPagina.attr('href');
      } catch (error) {
        console.log('Problema ao pegar processos da página');
        condition = false;
      }
    } while (condition);

    return processos;
  }

  extrairLinksProcessos($) {
    const rawProcessos = $('.linkProcesso');
    const listaLinks = [];

    if (rawProcessos.length === 0) {
      console.warn('Links de processos não encontrados na página.');
      return [];
    }

    rawProcessos.each((index, element) => {
      let link = $(element).attr('href');
      listaLinks.push(link);
    });

    return listaLinks;
  }

  async extrairProcessos(listaProcessos, cookies) {
    // TODO teste de captcha em quantidade limitada, remover posteriormente
    listaProcessos = listaProcessos.slice(0, 5);
    let count = 1;

    let resultados = listaProcessos.map(async (element) => {
      console.log('PROCESSOS', count);
      count = count + 1;
      let body = await this.extrairProcessoHtml(element, cookies)
      if (body) {
        let extracao = await new TJSPParser().parse(body);
        let processo = extracao.processo;
        let andamentos = extracao.andamentos;
        await Andamento.salvarAndamentos(andamentos);
        let resultado = await processo.salvar();
        console.log('resultado', resultado);
        return Promise.resolve(resultado);
      } else {
        return Promise.resolve(false);
      }
    });
    return Promise.all(resultados).then((args) => {
      console.log(args);
      return args.filter(Boolean);
    });
  }

  extrairProcessoHtml(linkProcesso, cookies) {
    return new Promise(async (resolve, reject) => {
      let retry = false; //Se o processo já foi tratado com outro captcha
      let gResponse = await this.getCaptcha();
      do{
        let url = linkProcesso.replace(/(?<key>g-recaptcha-response=)(?<value>.+)&/, `$1${gResponse}&`);
        let objResponse = await this.robo.acessar(
          'https://esaj.tjsp.jus.br' + url,
          'GET',
          'latin1',
          false,
          false,
          null,
          {
            Host: 'esaj.tjsp.jus.br',
            Connection: 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.117 Safari/537.36',
            'Sec-Fetch-User': '?1',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            Referer: 'https://esaj.tjsp.jus.br/cpopg/search.do',
            'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
            Cookie: cookies,
          }
        );
        const $ = cheerio.load(objResponse.responseBody);
        if ($('#tabelaTodasMovimentacoes').length == 0) {
          if (!retry) {
            console.log('not retry');
            gResponse = await this.getCaptcha();
            retry = !retry;
          }
          else {
            return resolve(false)
          }
          retry = true;
        } else {
          return resolve(objResponse.responseBody);
        }
      }
      while(!retry)
    });
  }
}

module.exports.OabTJSP = OabTJSP;

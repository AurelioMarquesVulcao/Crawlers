const cheerio = require('cheerio');
const moment = require('moment');
const { antiCaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { Robo } = require('../lib/robo');
const { TJBAPortalParser } = require('../parsers/TJBAPortalParser');
const { TJSPParser } = require('../parsers/TJSPParser');
//  Aqui dentro terei os parsers para qualquer tipo de processo envolvendo o TJBA

class ExtratorBase {
  /**
   * Extrator Base
   * @param {string} url Url de acesso ao site.
   * @param {boolean} isDebug Esta rodando em modo debug?
   */
  constructor(url, isDebug) {
    this.isDebug = isDebug;
    this.url = url;
    this.robo = new Robo();
  }
}

class OabTJBAPortal extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJBAPortalParser();
  }

  async extrair(numeroDaOab) {
    try {
      let resultados = [];
      let objResponse = await this.robo.acessar(
        `${this.url}`,
        'POST',
        'latin1', //TODO verificar validade do LATIN1 como encoder para TJBA
        true, //proxy
        false,
        {
          tipo: 'NUMOAB',
          funcao: 'funcOAB',
          processo: numeroDaOab + 'BA',
          'g-recaptcha-response': '',
        }
      );
      let $ = cheerio.load(objResponse.responseBody);
      let codigoBusca = $.html().match(/var busca\s*=\s*'(.*)';/)[1];
      codigoBusca = codigoBusca.trim();

      let cookies = objResponse.responseContent.headers.cookies;
      objResponse = await this.robo.acessar(
        `https://www.tjba.jus.br/consulta-processual/api/v1/carregar/oab/${codigoBusca}/1/semCaptcha`,
        'GET',
        'latin1',
        true, //proxy
        false,
        null,
        cookies
      );

      let listaProcessos = objResponse.responseBody.lstProcessos;

      resultados = await listaProcessos.map(async (element) => {
        let extracao = new TJBAPortalParser().parse(element);
        let processo = extracao.processo;
        let andamentos = extracao.andamentos;
        Andamento.salvarAndamentos(andamentos);
        let resultado = await processo.salvar();
        return resultado;
      });

      return Promise.all(resultados).then((args) => {
        return {
          resultado: args,
          sucesso: true,
          detalhes: '',
        };
      });
    } catch (e) {
      if (e instanceof RequestException) {
        throw new RequestException(e.code, e.status, e.message);
      } else if (e instanceof BaseException) {
        throw new BaseException(e.code, e.message);
      } else if (e instanceof ExtracaoException) {
        if (/ERRO_CAPTCHA/.test(e.code)) {
          //refaz tentativas de captcha (deixar aqui mas portal tjba n usa captcha por enquanto)
          throw new ExtracaoException(e.code, null, e.message);
        } else {
          throw new BaseException(e.code, e.message);
        }
      } else {
        if (
          /ESOCKETTIMEDOUT|ETIMEDOUT|EBUSY|ECONNRESET|ENOPROTOOPT/.test(e.code)
        ) {
          throw new RequestException(e.code, e.status, e.message);
        }
      }
    }
  }
}

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
      objResponse = this.robo.acessar(
        'https://esaj.tjsp.jus.br/cpopg/open.do',
        'GET',
        'latin1',
        false,
        false,
        null
      );
      cookies = objResponse.responseContent.headers.cookies;

      preParse = this.preParse(objResponse.responseBody);
      uuidCaptcha = preParse.captcha.uuidCaptcha;
      gResponse = await this.getCaptcha();

      // Segunda parte: pegar a lista de processos
      listaProcessos = this.getListaProcessos(
        numeroDaOab,
        cookies,
        uuidCaptcha,
        gResponse
      );

      // Terceira parte: passar a lista, pegar cada um dos codigos
      // resultantes e mandar para o parser
      if (listaProcessos) {
        this.extrairProcessos(listaProcessos, cookies);
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
      if (e instanceof AntiCaptchaResponseException) {
        throw new AntiCaptchaResponseException(error.code, error.message);
      }
    }
  }

  /**
   * Pré-processador da pagina a ser extraida
   * @param {string} content Página resultade de uma consulta do co Axios
   */
  preParse(content) {
    const $ = cheerio.load(content);

    let preParse = {
      captcha: {
        hasCaptcha: false,
        uuidCaptcha: '',
      },
    };

    preParse.captcha.hasCaptcha = $('#rc-anchor-content');
    preParse.captcha.uuidCaptcha = $('#uuidCaptcha').val();

    return preParse;
  }

  getCaptcha() {
    return new Promise((resolve, reject) => {
      esponseAntiCaptcha = {};
      responseAntiCaptcha = antiCaptchaHandler(
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

      resolve(responseAntiCaptcha.gResponse);
    });
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
        cookies
      );

      const $ = cheerio.load(objResponse.responseBody);

      try {
        processos = [processos, ...this.extrairLinksProcessos($)];
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
      let link = $(element).attr('baseURI');
      listaLinks.push(link);
    });

    return listaLinks;
  }

  async extrairProcessos(listaProcessos, cookies) {
    let resultados = await listaProcessos.map(async (element) => {
      objResponse = await this.robo.acessar(
        element,
        'GET',
        'latin1',
        false,
        false,
        null,
        cookies
      );
      let extracao = new TJSPParser().parse(element);
      let processo = extracao.processo;
      let andamentos = extracao.andamentos;
      Andamento.salvarAndamentos(andamentos);
      let resultado = await processo.salvar();
      return resultado;
    });
    return resultados;
  }
}
module.exports.OabTJBAPortal = OabTJBAPortal;

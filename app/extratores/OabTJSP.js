const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const async = require('async');
const { enums } = require('../configs/enums');
const {
  antiCaptchaHandler,
  xcaptchasIOHandler,
  CaptchaHandler,
} = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const { Logger } = require('../lib/util');
const { ProcessoTJSP } = require('./ProcessoTJSP');

const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJSPParser } = require('../parsers/TJSPParser');

const { LogExecucao } = require('../lib/logExecucao');

class OabTJSP extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJSPParser();
    this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';
    this.logger = null;
  }

  async extrair(numeroOab, cadastroConsultaId) {
    console.log('cadastroConsultaId', cadastroConsultaId);
    this.numeroDaOab = numeroOab;
    let cadastroConsulta = {
      SeccionalOab: 'SP',
      TipoConsulta: 'processo',
      NumeroOab: numeroOab,
      _id: cadastroConsultaId,
    };

    const nomeRobo = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJSP}`;
    this.logger = new Logger('info', `logs/${nomeRobo}/${nomeRobo}Info.log`, {
      nomeRobo: nomeRobo,
      NumeroOab: numeroOab,
    });

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

      this.logger.info('Fazendo primeira conexão ao website');
      objResponse = await this.robo.acessar({
        url: this.url,
        method: 'GET',
        usaProxy: true,
        encoding: 'latin1',
      });

      cookies = objResponse.cookies;
      cookies = cookies.map((element) => {
        return element.replace(/\;.*/, '');
      });
      cookies = cookies.join('; ');

      this.logger.info('Fazendo pré-analise do website em busca de captchas');
      preParse = await this.preParse(objResponse.responseBody, cookies);
      uuidCaptcha = preParse.captcha.uuidCaptcha;
      this.logger.info('Analise do website concluida.');
      this.logger.info('Fazendo chamada para resolução do captcha.');
      gResponse = await this.getCaptcha();
      // gResponse =
      //   '03AGdBq27q2l_2WrptTO5a8Zluw3pUBSLS9nq1-dnzlxn2CJb_GGQpVI-1r_GdNwXmt84Rnd9QLy9_RwuPg0HuIRdMcu7Ey4tbYr-x0lyzjebu1SKnT2g0Md3mlA1tmGBDlRwh7J2yirglJmne3apSbfqZ3jsDPkrY9BA3NclmyQTckK1zilNlFUqMmuxgTwy9y-yyj_AWze30iuxAfvisgwu_NYfpApkQQML5GYlWBwe0BYyO_BzDIgZe6LwfB-N2csIhf3TK_f9yWPeVfjIq3IwT8OV-d2pn8bkZuPlPFxBJGyMfDupQvqoiBZ8ubigdZCnXmyHrkByg6UfWQLOfB7sgMxrcLk0GjTK59n1ttSl_vBb2DGNg6ZKLQNMOUcO8hlesI0hU970S1tNdz_DrBfSiBUPWubwm8RDv6AjkJgAbGo7nGGW5vMy3QbR0yO4u2CqVrF9qasoG';
      this.logger.info('Captcha resolvido');

      // Segunda parte: pegar a lista de processos
      this.logger.info('Recuperando lista de processos');
      let tentativa = 0;
      do {
        listaProcessos = await this.getListaProcessos(
          numeroOab,
          cookies,
          uuidCaptcha,
          gResponse
        );
        console.log(listaProcessos);
        this.logger.info('Lista de processos recuperada');

        // Terceira parte: passar a lista, pegar cada um dos codigos
        // resultantes e mandar para o parser
        if (listaProcessos.length > 0) {
          this.logger.info('Inicio do processo de extração de processos');

          let lista = await Processo.listarProcessos(2);
          listaProcessos = listaProcessos.filter((x) => !lista.includes(x));

          for (const processo of listaProcessos) {
            cadastroConsulta['NumeroProcesso'] = processo;
            this.logger.info(
              `Criando log de execução para o processo ${processo}.`
            );
            await LogExecucao.cadastrarConsultaPendente(cadastroConsulta);
            this.logger.info(
              `Log de execução do processo ${processo} feito com sucesso`
            );
            this.logger.info(
              `Enviando processo ${processo} a fila de extração.`
            );
            resultados.push(Promise.resolve(processo));
          }

          //resultados = await this.extrairProcessos(listaProcessos, cookies);
          return Promise.all(resultados)
            .then((resultados) => {
              this.logger.info('Processos extraidos com sucesso');
              return {
                resultado: resultados,
                sucesso: true,
                detalhes: '',
                logs: logger.logs,
              };
            })
            .catch((e) => {
              this.logger.info('Não houve processos bem sucedidos');
              return {
                resultado: [],
                sucesso: false,
                detalhes: 'Extração encontrou problemas',
                logs: this.logger.logs,
              };
            });
        }
        tentativa++;
      } while (tentativa < 5);

      this.logger.info('Lista de processos vazia;');
      return {
        resultado: [],
        sucesso: false,
        detalhes: 'Lista de processos vazia',
        logs: this.logger.logs,
      };
    } catch (error) {
      this.logger.log('error', error);
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
    const captchaHandler = new CaptchaHandler(5, 5000, 'OabTJSP', {
      numeroDaOab: this.numeroDaOab,
    });
    try {
      let captcha = {};
      captcha = await captchaHandler
        .resolveRecaptchaV2(
          // captcha = await antiCaptchaHandler(
          'https://esaj.tjsp.jus.br/cpopg/open.do',
          this.dataSiteKey,
          '/'
        )
        .catch((error) => {
          throw error;
        });

      //TODO retirar
      // console.log(responseAntiCaptcha)

      if (!captcha.sucesso) {
        throw new AntiCaptchaResponseException(
          'Falha na resposta',
          'Nao foi possivel recuperar a resposta para o captcha'
        );
      }

      return captcha.gResponse;
    } catch (error) {
      if (error instanceof AntiCaptchaResponseException) {
        throw new AntiCaptchaResponseException(error.code, error.message);
      }
      throw error;
    }
  }

  async getCaptchaUuid(cookies) {
    let objResponse = {};
    // TODO remover comentario caso funfe
    objResponse = await this.robo.acessar({
      url: 'https://esaj.tjsp.jus.br/cpopg/captchaControleAcesso.do',
      method: 'POST',
      encoding: 'latin1',
      usaProxy: true,
      headers: {
        Cookie: cookies,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        Referer: 'https://esaj.tjsp.jus.br/cpopg/search.do',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    let uuid = objResponse.responseBody.uuidCaptcha;
    return uuid;
  }

  async getListaProcessos(numeroOab, cookies, uuidCaptcha, gResponse) {

    await this.robo.acessar({
      url: 'https://esaj.tjsp.jus.br/cpopg/manterSessao.do?conversationId=',
      headers: {
        Cookie: cookies,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        Referer: 'https://esaj.tjsp.jus.br/cpopg/search.do',
        'Upgrade-Insecure-Requests': '1',
      },
      usaProxy: true
    });

    let condition = false;
    let processos = [];
    let url = `https://esaj.tjsp.jus.br/cpopg/search.do?conversationId=&dadosConsulta.localPesquisa.cdLocal=-1&cbPesquisa=NUMOAB&dadosConsulta.tipoNuProcesso=UNIFICADO&dadosConsulta.valorConsulta=${numeroOab}SP&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;
    console.log('cookies', cookies);
    console.log(url);
    let problema;
    do {
      let objResponse = {};
      // TODO remover caso o codigo funfe
      objResponse = await this.robo.acessar({
        url: url,
        method: 'GET',
        enconding: 'latin1',
        usaProxy: true,
        headers: {
          Cookie: cookies,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate, br',
          DNT: '1',
          Connection: 'keep-alive',
          Referer: 'https://esaj.tjsp.jus.br/cpopg/search.do',
          'Upgrade-Insecure-Requests': '1',
        },
      });
      const $ = cheerio.load(objResponse.responseBody);
      try {
        //processos = [...processos, ...this.extrairLinksProcessos($)];
        processos = [...processos, ...this.extrairNumeroProcessos($)];
        const proximaPagina = $('[title|="Próxima página"]').first();

        if (!proximaPagina.text()) return processos;

        condition = true;
        url = 'https://esaj.tjsp.jus.br' + proximaPagina.attr('href');
      } catch (error) {
        console.log('Problema ao pegar processos da página');
        console.log(error);
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

  extrairNumeroProcessos($) {
    const rawProcessos = $('a.linkProcesso');
    const listaNumeros = [];

    // if (rawProcessos.length) {
    //   // TODO console.log com logger
    //   return [];
    // }

    rawProcessos.each((index, element) => {
      let numero = $(element).text();
      listaNumeros.push(numero.trim());
    });

    return listaNumeros;
  }

  async extrairProcessos(listaProcessos, cookies) {
    let resultados = listaProcessos.map(async (element) => {
      let body = await this.extrairProcessoHtml(element, cookies);
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
      console.log(gResponse);
      do {
        let url = linkProcesso.replace(
          /(?<key>g-recaptcha-response=)(?<value>.+)&/,
          `$1${gResponse}&`
        );
        let objResponse = {};
        objResponse = await this.robo.acessar({
          url: 'https://esaj.tjsp.jus.br' + url,
          method: 'GET',
          encoding: 'latin1',
          headers: {
            Cookie: cookies,
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate, br',
            DNT: '1',
            Connection: 'keep-alive',
            Referer: 'https://esaj.tjsp.jus.br/cpopg/search.do',
            'Upgrade-Insecure-Requests': '1',
          },
          usaProxy: true
        });
        const $ = cheerio.load(objResponse.responseBody);
        if ($('#tabelaTodasMovimentacoes').length === 0) {
          if (!retry) {
            console.log('not retry');
            gResponse = await this.getCaptcha();
            retry = !retry;
          } else {
            return resolve(false);
          }
          retry = true;
        } else {
          return resolve(objResponse.responseBody);
        }
      } while (!retry);
    });
  }
}

module.exports.OabTJSP = OabTJSP;

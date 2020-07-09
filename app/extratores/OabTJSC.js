const cheerio = require('cheerio');
const { enums } = require('../configs/enums');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Logger } = require('../lib/util');

const {
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJSCParser } = require('../parsers/TJSCParser');

const { LogExecucao } = require('../lib/logExecucao');

class OabTJSC extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJSCParser();
    this.dataSiteKey = '6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL';
    this.logger = null;
  }

  async extrair(numeroOab, cadastroConsultaId) {
    // console.log('cadastroConsultaId', cadastroConsultaId);
    this.numeroDaOab = numeroOab;
    let cadastroConsulta = {
      SeccionalOab: 'SC',
      TipoConsulta: 'processo',
      NumeroOab: numeroOab,
      _id: cadastroConsultaId,
    };

    const nomeRobo = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJSC}`;
    this.logger = new Logger('info', `logs/${nomeRobo}/${nomeRobo}Info.log`, {
      nomeRobo: nomeRobo,
      NumeroOab: numeroOab,
    });

    try {
      let resultados = [];
      let preParse;
      let uuidCaptcha;
      let gResponse;
      let cookies;
      let listaProcessos = [];
      let objResponse;

      this.logger.info('Fazendo primeira conexão ao website');
      objResponse = await this.robo.acessar({
        url: this.url,
        method: 'GET',
        usaProxy: true,
        encoding: 'latin1',
      });

      // console.log(objResponse);
      cookies = objResponse.cookies;
      cookies = cookies.map((element) => {
        return element.replace(/;.*/, '');
      });
      cookies = cookies.join('; ');
      cookies = cookies.replace(/cposgtj\d/, 'cpopg3');

      this.logger.info('Fazendo pré-analise do website em busca de captchas');
      preParse = await this.preParse(objResponse.responseBody, cookies);
      uuidCaptcha = preParse.captcha.uuidCaptcha;
      this.logger.info('Analise do website concluida.');
      this.logger.info('Fazendo chamada para resolução do captcha.');
      gResponse = await this.getCaptcha();
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
        // console.log(listaProcessos);
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
            resultados.push(Promise.resolve({numeroProcesso: processo}));
          }

          //resultados = await this.extrairProcessos(listaProcessos, cookies);
          return Promise.all(resultados)
            .then((resultados) => {
              this.logger.info('Processos extraidos com sucesso');
              return {
                resultado: resultados,
                sucesso: true,
                detalhes: '',
                logs: this.logger.logs,
              };
            })
            .catch((e) => {
              this.logger.log('error', e);
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
        gResponse = await this.getCaptcha();
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
   * @param {String} cookies
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
    const captchaHandler = new CaptchaHandler(5, 5000, 'OabTJSC', {
      numeroDaOab: this.numeroDaOab,
    });
    let captcha;
    captcha = await captchaHandler
      .resolveRecaptchaV2(
        // captcha = await antiCaptchaHandler(
        'https://esaj.tjsc.jus.br/cpopg/open.do',
        this.dataSiteKey,
        '/'
      )
      .catch((error) => {
        throw error;
      });

    if (!captcha.sucesso) {
      throw new AntiCaptchaResponseException(
        'Falha na resposta',
        'Nao foi possivel recuperar a resposta para o captcha'
      );
    }

    return captcha.gResponse;
  }

  async getCaptchaUuid(cookies) {
    let objResponse;
    objResponse = await this.robo.acessar({
      url: 'https://esaj.tjsc.jus.br/cpopg/captchaControleAcesso.do',
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
        Referer: 'https://esaj.tjsc.jus.br/cpopg/search.do',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    return objResponse.responseBody.uuidCaptcha;
  }

  async getListaProcessos(numeroOab, cookies, uuidCaptcha, gResponse) {
    await this.robo.acessar({
      url: 'https://esaj.tjsc.jus.br/cpopg/manterSessao.do?conversationId=',
      headers: {
        Cookie: cookies,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        Referer: 'https://esaj.tjsc.jus.br/cpopg/search.do',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    let condition = false;
    let processos = [];
    let url = `https://esaj.tjsc.jus.br/cpopg/search.do?conversationId=&cbPesquisa=NUMOAB&dadosConsulta.valorConsulta=${numeroOab}&dadosConsulta.localPesquisa.cdLocal=-1&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;
    // console.log('cookies', cookies);
    // console.log(url);
    do {
      let objResponse = {};
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
          Referer: 'https://esaj.tjsc.jus.br/cpopg/search.do',
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
        url = 'https://esaj.tjsc.jus.br' + proximaPagina.attr('href');
      } catch (error) {
        this.logger.info('Problema ao pegar processos da página');
        this.logger.log(error);
        condition = false;
      }
    } while (condition);
    return processos;
  }

  extrairNumeroProcessos($) {
    const rawProcessos = $('a.linkProcesso');
    const listaNumeros = [];

    rawProcessos.each((index, element) => {
      let numero = $(element).text();
      listaNumeros.push(numero.trim());
    });

    return listaNumeros;
  }
}

module.exports.OabTJSC = OabTJSC;

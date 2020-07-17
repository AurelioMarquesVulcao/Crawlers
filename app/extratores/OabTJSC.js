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

const INSTANCIAS_URLS = require('../assets/TJSC/instancias_urls.json').INSTANCIAS_URL;

class OabTJSC extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJSCParser();
    this.dataSiteKey = '6LfzsTMUAAAAAOj49QyP0k-jzSkGmhFVlTtmPTGL';
    this.logger = null;
  }

  setInstanciaUrl(instancia) {
    instancia = instancia;
    this.url = INSTANCIAS_URLS[instancia - 1];
  }

  /**
   * Extrai os processos
   * @param {String|Number} numeroOab
   * @param {ObjectID} cadastroConsultaId
   * @param {Number} instancia
   * @returns {Promise<{resultado: [], sucesso: boolean, logs: *, detalhes: string}|{resultado: [], sucesso: boolean, logs: *, detalhes: string}|{resultado: [], sucesso: boolean, logs: *, detalhes: string}>}
   */
  async extrair(numeroOab, cadastroConsultaId, instancia = 1) {
    // console.log(
    //   `numeroOaa: ${numeroOab}\ncadastroConsultaId: ${cadastroConsultaId}\ninstancia: ${instancia}`
    // );
    this.numeroDaOab = numeroOab;
    this.instancia = Number(instancia);
    this.setInstanciaUrl(this.instancia)
    let cadastroConsulta = {
      SeccionalOab: 'SC',
      TipoConsulta: 'processo',
      NumeroOab: numeroOab,
      Instancia: instancia,
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
        url: `${this.url}/open.do`,
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
      // cookies = cookies.replace(/cposgtj\d/, 'cpopg3');

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
        this.logger.info(
          `Tentativa de recuperacao da lista de processos [TENTATIVA: ${
            tentativa + 1
          }]`
        );
        listaProcessos = await this.getListaProcessos(
          numeroOab,
          cookies,
          uuidCaptcha,
          gResponse
        );

        // Terceira parte: passar a lista, pegar cada um dos codigos
        // resultantes e mandar para o parser
        if (listaProcessos.length > 0) {
          this.logger.info('Lista de processos recuperada');
          this.logger.info('Inicio do processo de extração de processos');

          let lista = await Processo.listarProcessos(2);
          listaProcessos = listaProcessos.filter((x) => !lista.includes(x));

          for (const processo of listaProcessos) {
            cadastroConsulta['NumeroProcesso'] = processo;
            this.logger.info(
              `Verificando log de execução para o processo ${processo}.`
            );
            let logExec = await LogExecucao.cadastrarConsultaPendente(
              cadastroConsulta
            );
            this.logger.info(
              `Log de execução do processo ${processo} verificado com sucesso`
            );
            this.logger.info(logExec.mensagem);

            if (logExec.enviado)
              resultados.push(Promise.resolve({ numeroProcesso: processo }));
          }

          //resultados = await this.extrairProcessos(listaProcessos, cookies);
          return Promise.all(resultados)
            .then((resultados) => {
              this.logger.info(
                `${resultados.length} Processos enviados para extração`
              );
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
        } else {
          this.logger.info('Lista de processos vazia');
          tentativa++;
          gResponse = await this.getCaptcha();
        }
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
        `${this.url}/open.do`,
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
      url: `${this.url}/captchaControleAcesso.do`,
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
    let url = '';
    await this.robo.acessar({
      url: `${this.url}/manterSessao.do?conversationId=`,
      headers: {
        Cookie: cookies,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.8,en-US;q=0.5,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        DNT: '1',
        Connection: 'keep-alive',
        Referer: `${this.url}/search.do`,
        'Upgrade-Insecure-Requests': '1',
      },
    });

    let condition = false;
    let processos = [];

    // Verifica qual é a instancia e monta a url de acordo
    if (this.instancia === 2)
      url = `${this.url}/search.do;${cookies}?conversationId=&paginaConsulta=0&cbPesquisa=NUMOAB&dePesquisa=${numeroOab}&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;
    if (this.instancia === 3)
      url = `${this.url}/search.do;${cookies}?conversationId=&paginaConsulta=0&cbPesquisa=NUMOAB&dePesquisa=${numeroOab}&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;
    if (this.instancia === 1)
      url = `${this.url}/search.do?conversationId=&cbPesquisa=NUMOAB&dadosConsulta.valorConsulta=${numeroOab}&dadosConsulta.localPesquisa.cdLocal=-1&uuidCaptcha=${uuidCaptcha}&g-recaptcha-response=${gResponse}`;

    this.logger.info('Iniciando acesso a lista de processos');
    do {
      // console.log(url);
      // console.log(cookies);
      let objResponse = await this.robo.acessar({
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
          Referer: `${this.url}/search.do`,
          'Upgrade-Insecure-Requests': '1',
        },
      });
      const $ = cheerio.load(objResponse.responseBody);
      try {
        //processos = [...processos, ...this.extrairLinksProcessos($)];
        processos = [...processos, ...this.extrairNumeroProcessos($)];
        const proximaPagina = $('[title|="Próxima página"]').first();

        if (processos.length === 0) {
          this.logger.info('Oab devolve apenas um processo.');
          processos = this.preParseProcesso(objResponse.responseBody);
        }
        if (!proximaPagina.text()) return processos;

        url = 'https://esaj.tjsc.jus.br' + proximaPagina.attr('href');

        condition = true;
      } catch (error) {
        this.logger.info('Problema ao pegar processos da página');
        this.logger.log(error);
        condition = false;
      }
    } while (condition);
    return processos;
  }

  /**
   * Verifica se é redirecionado para uma pagina de processo unico diretamente
   * @param {string} body responseBody da pagina
   */
  preParseProcesso(body) {
    const $ = cheerio.load(body);

    if ($('h2.subtitle').length > 0) {
      return [$('span.unj-larger-1').text().trim()];
    }
    return [];
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

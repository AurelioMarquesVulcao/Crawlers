const cheerio = require('cheerio');
const { Robo } = require('../lib/newRobo');
const { ExtratorBase } = require('./extratores');
const { CaptchaHandler } = require('../lib/captchaHandler');
const { Logger } = require('../lib/util')

class OabTJCE extends ExtratorBase {
  constructor() {
    super();
    this.robo = new Robo();
    this.dataSiteKey = '6LeME0QUAAAAAPy7yj7hh7kKDLjuIc6P1Vs96wW3';
  }

  async extrair(numeroOab) {
    this.numeroOab = numeroOab;
    this.montarLogger(numeroOab);

    let objResponse;
    // Resposta para tentativa de primeiro acesso no site
    let primeiroAcesso;
    // UUID que representa algo como sua sessão
    let uuidCaptcha;
    // Responsta para Google Recaptcha
    let gResponse;
    let tentativa = 1;
    let limite = 5;

    try {
      primeiroAcesso = await this.fazerPrimeiroAcesso();

      if(!primeiroAcesso.sucesso) process.exit(0);

      objResponse = await this.acessarPaginaConsulta()

      uuidCaptcha = await this.consultarUUID();

      do {
        this.logger.info(`Tentativa de acesso [${tentativa}]`);
        gResponse = await this.resolverCaptcha()


      } while(tentativa !== limite)

    } catch (e) {
      console.log(e);
    } finally {
      console.log('terminou');
    }
  }

  /**
   * Monta o logger que sera usado no processo de extracao
   * @param {string} numeroOab numero da oab no formato \d+[A-Z]{2}
   */
  montarLogger(numeroOab) {
    this.logger = new Logger(
      'info',
      'logs/TJCE/oab.log',
      {
        nomeRobo: 'OabTJCE',
        numeroOab: numeroOab
      }
    )
  }

  /**
   * Realiza tentativas de acessar a pagina do site
   * @returns {Promise<{sucesso: Boolean}>}
   */
  async fazerPrimeiroAcesso() {
    this.logger.info('Fazendo primeiro acesso');
    let primeiroAcessoWait = 10000;
    let tentativa = 1;
    let primeiroAcessoTentativas = 5;
    let objResponse;

    do {
      this.logger.info(`Tentando realizar a primeira conexão. [Tentativa: ${tentativa}]`)

      objResponse = await this.realizaPrimeiraConexao().catch((err) => err);
      if (this.isDebug) console.log({ tentativa, status: objResponse.status });
      if (objResponse.status === 200) return { sucesso: true };

      this.logger.info('Falha ao tentar conectar no site.');
      tentativa++;
      await sleep(primeiroAcessoWait)
    } while(tentativa <= primeiroAcessoTentativas)

    return { sucesso: false }
  }

  /**
   * Faz a a primeira conexão
   * @returns {Promise<Object>}
   */
  async realizaPrimeiraConexao() {
    this.robo.setHeader({
      Host: 'esaj.tjce.jus.br',
      Connection: 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-User': '?1',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Sec-Fetch-Site': 'same-origin',
      'Sec-Fetch-Mode': 'navigate',
      Referer: `${this.url}/open.do`,
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    })

    return await this.robo.acessar({
      url: `${this.url}/open.do`,
      method: 'GET',
      proxy: true
    });
  }


  async acessarPaginaConsulta() {
    this.logger.info('Entrando na pagina de consulta');

    let options = {
      url: `${this.url}/search.do`,
      method: 'GET',
      queryString: {
        conversationId: '',
        'dadosConsulta.localPesquisa.cdLocal': '-1',
        cbPesquisa: 'NUMOAB',
        "dadosConsulta.tipoNuProcesso": 'UNIFICADO',
      },
      proxy: true,
    };

    return this.robo.acessar(options)
  }

  async consultarUUID() {
    this.logger.info('Consultado UUID do site');
    let objResponse;

    objResponse = await this.robo.acessar({
      url: `${this.url}/captchaControleAcesso.do`,
      method: 'POST',
      proxy: true
    })

    return objResponse.responseBody.uuidCaptcha;
  }

  async resolverCaptcha() {
    const ch = new CaptchaHandler(5, 10000, 'ProcessoTJCE', {numeroDoProcesso: this.numeroProcesso});

    this.logger.info('Tentando resolver captcha');
    let captcha = await ch.resolveRecaptchaV2(`${this.url}/open.do`, this.dataSiteKey, '/')
      .catch(err => {throw err})

    if(!captcha.sucesso) {
      throw new Error('Falha na resposta. Não foi possivel recuperar a resposta para o captcha');
    }

    this.logger.info('Retornada resposta da API');
    return captcha.gResponse;
  }


}

module.exports.OabTJCE = OabTJCE;

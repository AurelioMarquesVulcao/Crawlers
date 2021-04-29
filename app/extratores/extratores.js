const puppeteer = require('puppeteer');
const re = require('xregexp');
const { Robo } = require('../lib/robo');

/**
 * @typedef cnjDividido
 * @property {string} sequencial 7 digitos, marcando a ordem sequencial do cnj
 * @property {string} digito 2 digitos, numero de validação
 * @property {string} ano 4 digitos, ano do cnj
 * @property {string} tribunal 1 digito, codigo do tribunal em que o cnj de sencontra
 * @property {string} orgao 2 digitos, codigo indicativo do estado
 * @property {string} comarca 4 digitos, codigo indicativo da comarca do estado
 */

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

  debug(msg) {
    if (this.isDebug) {
      console.log(`DEBUG: ${msg}`);
    }
  }

  dividirNumeroProcesso(cnj) {
    let cnjRegex = re(
      `(?<sequencial>\\d{7})\\D?(?<digito>\\d{2})\\D?(?<ano>\\d{4})\\D?(?<tribunal>\\d{1})\\D?(?<orgao>\\d{1,2})\\D?(?<comarca>\\d{4})`
    );

    /**@type cnjDividido*/
    let cnjDividido = re.exec(cnj, cnjRegex);
    return cnjDividido;
  }
}

class ExtratorPuppeteer extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
  }

  /**
   * Inicia uma instancia do browser do Puppeteer
   * @returns {Promise<void>}
   */
  async iniciar() {
    this.logger.info('Iniciando Puppeteer');
    this.browser = await puppeteer.launch(this.launchOptions);
    this.logger.info('Puppeteer iniciado');
    this.debug('Iniciando Puppeteer');
    this.logger.info('Criando nova pagina');
    this.page = await this.browser.pages().then((pages) => pages[0]);
    await this.page.setViewport(this.viewPort);
    this.logger.info('Nova pagina criada');
  }

  /**
   * Acessa paginas do puppeteer
   * @param {String} url url da pagina
   * @param {Object} pageOptions seta opções para header entre outros
   * @param {Boolean} newPage decide se criará uma nova pagina
   * @returns {Promise<void>}
   */
  async acessar(url, pageOptions, newPage = false) {
    if (newPage) {
      this.page = await this.browser.newPage();
    }
    await this.page.goto(url, pageOptions);
  }

  /**
   * Fecha outras paginas que não sejam a pagina atual.
   * @returns {Promise<void>}
   */
  async fecharOutrasPaginas() {
    const pages = await this.browser.pages();

    for (let i = 0; i < pages.length; i++) {
      if (!(pages[i] == this.page)) {
        await pages[i].close();
      }
    }
  }

  /**
   * Fecha o browser e mata o processo Puppeteer
   * @returns {Promise<void>}
   */
  async finalizar() {
    const puppeteerPid = this.browser.process().pid;
    this.logger.info('Finalizando Puppeteer');
    await this.browser
      .close()
      .then(() => {
        process.kill(puppeteerPid);
      })
      .catch(() => {});
    this.logger.info('Puppeteer finalizado');
  }
}

module.exports.ExtratorBase = ExtratorBase;
module.exports.ExtratorPuppeteer = ExtratorPuppeteer;

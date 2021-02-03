require('../bootstrap');
const fs = require('fs');
const sleep = require('await-sleep');
const Path = require('path');
const { ExtratorPuppeteer } = require('./extratores');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const { CredenciaisAdvogados } = require('../models');

class PeticaoEsaj extends ExtratorPuppeteer {
  constructor({
    url = '',
    debug = false,
    timeout = 30000,
    headless = false,
    usuario = { username: '', password: '' },
  } = {}) {
    super(url, debug);
    this.debug('MODO DEBUG ATIVADO');
    this.timeout = timeout;
    this.headless = headless;
    if (usuario) this.usuario = usuario;

    this.args = [
      '--no-sandbox',
      `--proxy-server=http://proxy-proadv.7lan.net:8181`,
      `--ignore-certificate-errors`,
    ];
    this.ignore = ['--disable-extensions'];
    this.viewPort = { width: 1024, height: 768 };
    this.pageOptions = { waitUntil: 'load', timeout: 0 };
    this.launchOptions = {
      slowMo: 100,
      headless: this.headless,
      timeout: this.timeout,
      args: this.args,
      ignoreDefaultArgs: this.ignore,
    };

    this.idsUsadas = [];
  }

  /**
   * Extrai os arquivos iniciais do processo
   * @param {string} numeroProcesso numero do processo com mascara
   * @param {number} instancia default 1
   * @returns {Promise<{numeroProcesso: *}>}
   */
  async extrair(numeroProcesso, instancia = 1) {
    instancia = Number(instancia);
    // await new CredenciaisAdvogados({
    //   login: '103.890.517-64',
    //   senha: 'Senh@TJ123',
    //   estado: 'MS',
    //   nome: 'Karine Impacta Teste',
    // }).salvar();

    this.resposta = { numeroProcesso: numeroProcesso };
    this.numeroProcesso = numeroProcesso;
    this.instancia = instancia;
    if (!this.usuario.login)
      this.usuario = await this.getCredenciais(this.estado);

    this.numeroProcessoDetalhes = this.dividirNumeroProcesso(
      this.numeroProcesso
    );

    this.logger = new Logger('info', 'logs/TJCE/peticao.log', {
      nomeRobo: `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJMS}`,
      NumeroDoProcesso: numeroProcesso,
    });
    try {
      await this.iniciar();
      this.debug('Puppeteer iniciado');
      this.debug(`Paginas: ${this.browser.pages().length}`);
      await sleep(100);

      await this.acessar(
        `https://esaj.${this.tribunal.toLowerCase()}.jus.br/portal.do`,
        this.pageOptions
      );

      this.debug(`pageoptions: ${JSON.stringify(this.pageOptions)}`);
      await sleep(100);

      await this.login();

      this.debug(`Usuario: ${JSON.stringify(this.usuario)}`);
      await sleep(100);

      await this.consultarProcesso(numeroProcesso, instancia);
      await sleep(1000);

      // Tratamento caso resultado da consulta retorne algo invalido
      if ((await this.page.$('#mensagemRetorno')) !== null) {
        let alert = await this.page.$eval('#mensagemRetorno', (element) => {
          return {
            role: element.getAttribute('role'),
            msg: element.textContent,
          };
        });
        if (alert.role === 'alert') {
          throw new Error(alert.msg.trim());
        }
      }

      // Tratamento caso resultado da consulta retorne uma lista de processos
      let processos;
      if ((await this.page.$('a.linkProcesso')) !== null)
        processos = await this.page.$$eval('a.linkProcesso', (as) =>
          as.map((a) => a.href)
        );

      let tam = processos ? processos.length : 1;
      let count = 0;

      // Programação normal
      do {
        if (processos) {
          await this.acessar(processos[count], this.pageOptions, false);
        }
        await this.consultaAutos();
        await sleep(100);

        await this.fecharOutrasPaginas();

        await this.resgataDocumentos(); //TODO alterar essa função para resgatar todos os links de donwloads sem necessariamente ativar o download pelo chrome
        await sleep(100);

        await this.aguardaDownload();
        await sleep(100);

        count++;
      } while (count < tam);

      this.resposta.sucesso = true;
      this.logger.log(
        'info',
        `Finalizado processo de extração de documentos ${this.numeroProcesso}`
      );
    } catch (e) {
      console.log(e);
      this.logger.log('error', e);
      this.debug(`ERRO OCORRIDO:\n ${e}`);

      this.resposta.sucesso = false;
      this.resposta.detalhes = e.message;
    } finally {
      await this.finalizar();
      this.resposta.instancia = this.instancia;
      this.resposta.logs = this.logger.logs;
      return this.resposta;
    }
  }

  /**
   * Faz o login no site do tribunal
   * @returns {Promise<void>}
   */
  async login() {
    let continuar = 0;
    this.logger.info('Iniciando procedimento de login');
    this.logger.info('Acessando pagina de login');

    await new Promise(async (resolve) => {
      do {
        await this.acessar(
          `${this.loginUrl}?service`, //TODO verificar se esse link ainda é valido para os processos do TJMS
          this.pageOptions,
          false
        );
        this.logger.info('Pagina de login acessada');

        this.logger.info(
          `Credenciais: ${JSON.stringify(this.usuario.login)} - ${
            this.usuario.senha
          }`
        );
        this.logger.info('Digitando nome do usuario');
        await this.page.type('#usernameForm', this.usuario.login);
        this.logger.info('Digitando senha do usuario');
        await this.page.type('#passwordForm', this.usuario.senha);

        this.logger.info('Clicando em entrar');
        await Promise.all([
          this.page.waitForNavigation(),
          this.page.click('#pbEntrar'),
        ]);

        continuar = await this.page
          .$$('#mensagemRetorno')
          .then((selector) => Boolean(selector.length));

        if (continuar) {
          this.logger.log(
            'warning',
            `Usuário ou senha inválida. [${JSON.stringify(this.usuario)}]`
          );
          this.logger.info('Realizando nova tentativa de Login');
          this.usuario = await this.getCredenciais(this.estado);
        } else {
          this.logger.info('Terminado procedimento de login');
          this.debug('Terminado Login');
          return resolve(true);
        }

        await sleep(500);
      } while (true);
    });
  }

  async consultarProcesso(numeroProcesso, instancia = 1) {
    this.logger.info('Iniciando procedimento de consulta do processo');
    numeroProcesso = numeroProcesso.replace(
      `.${this.numeroProcessoDetalhes.tribunal}.${this.numeroProcessoDetalhes.orgao}.`,
      '.'
    );
    numeroProcesso = numeroProcesso.replace(/\W/gm, '');
    let url;
    this.logger.info(`Escolhendo url para ${instancia}`);
    url = `${this.url}/show.do`;

    this.logger.info(
      `Acessando pagina de consulta da ${this.instancia}a instancia`
    );

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(
        '#esajConteudoHome > table:nth-child(10) > tbody > tr > td.esajCelulaDescricaoServicos > a'
      ),
    ]);

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click(
        '#esajConteudoHome > table:nth-child(3) > tbody > tr > td.esajCelulaDescricaoServicos > a'
      ),
    ]);

    // await this.acessar(url, this.pageOptions, false);
    this.logger.info('Aguardando o carregamento da pagina');
    await sleep(700);

    this.debug('Aguardando carregamento da pagina');

    this.debug('Pagina carregada');
    this.logger.info('Pagina carregada');
    this.logger.info('Digitando numero do processo');
    await this.page.type('#numeroDigitoAnoUnificado', numeroProcesso);
    this.logger.info(`PROCESSO: ${this.numeroProcesso}`);

    this.logger.info('Clicando no botão de consultar');

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('input[type="submit"]'),
    ]);
    this.logger.info('Finalizando procedimento de consulta de processo');
  }

  async consultaAutos() {
    this.logger.info('Iniciando procedimento de consulta de Autos');
    this.logger.info('Aguardando carregamento da pagina');
    let selector = '#linkPasta';

    this.logger.info('Pagina carregada');
    this.logger.info('Acessando pagina com documentos do processo');
    let btn;
    const newPagePromise = new Promise((x) =>
      this.browser.once('targetcreated', (target) => x(target.page()))
    );

    if ((await this.page.$(selector)) === null)
      throw new Error('Não há link para peticao inicial');

    btn = await this.page.$(selector);
    await btn.click();

    this.page = await newPagePromise;
    await this.page.bringToFront();

    this.logger.info('Pagina Acessada');
    await this.page.waitForSelector('#divDocumento');
    this.logger.info('Finalizando procedimento de consulta de Autos');
  }

  /**
   * Resgata a listagem dos documentos
   * @returns {Promise<void>}
   */
  async resgataDocumentos() {
    this.logger.info('Iniciando procedimento de resgate dos documentos');
    this.logger.info('Verificando se existe o documento "DECISAO"');
    this.logger.info('Selecionando documentos de interessa para download');

    await this.page.evaluate(() => {
      let elements = $('#arvore_principal > ul > li > a');
      let tam = elements.length;

      for (let i = 0; i < tam; i++) {
        if (
          elements[i].innerText === 'Decisão' ||
          elements[i].innerText === 'Despachos'
        )
          break;
        elements[i].firstElementChild.click();
      }
    });
    this.logger.info('Documentos selecionados');
    this.logger.info('Preparar para download');

    await this.page.click('#salvarButton');

    await this.page.waitForSelector('td.modalTitulo');

    await this.page.click('#opcao2');

    await this.page.click('#botaoContinuar');

    await this.page.waitForSelector('#popupGerarDocumentoOpcoes', {
      timeout: 180000,
    });
    await this.page.waitForSelector('#popupGerarDocumentoOpcoes', {
      hidden: true,
    });
    await this.page.waitForSelector(
      'input.botaoPopupGeracaoDocumento.spwBotao.btBaixarDocumento'
    );

    this.logger.info('Iniciando download');

    this.filePath = Path.resolve(__dirname, '../downloads');
    console.log({ filePath: this.filePath });

    await this.page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: this.filePath,
    });

    // Interceptando request

    await this.page.setRequestInterception(true);
    this.page.on('request', async (request) => {
      if (/getPDFImpressao\.do/.test(request._url)) {
        this.resposta.urlOrigem = request._url;
      }
      request.continue();
    });
    await this.page.click('#btnDownloadDocumento');
    console.log('botaoClicado');
    this.logger.info('Download iniciado');
  }

  /**
   * Pega as credenciais de advogado para login
   * @param {string} estado o estado para o qual esta tentando pegar as credenciais.
   * @returns {Promise<*>}
   */
  async getCredenciais(estado) {
    const credenciais = await CredenciaisAdvogados.getCredenciais(
      estado,
      this.idsUsadas
    );
    this.idsUsadas.push(credenciais.id);
    // const credenciais = {login: "103.890.517-64", senha: "Senh@TJ123"}

    return credenciais;
  }

  /**
   * Aguarda o download ser concluido
   * @returns {Promise<unknown>}
   */
  async aguardaDownload() {
    const path = `${this.filePath}/${this.numeroProcesso}.zip`;
    const tempPath = `${this.filePath}/${this.numeroProcesso}.zip.crdownload`;

    return new Promise(async (resolve) => {
      do {
        if (fs.existsSync(path) && !fs.existsSync(tempPath)) {
          this.logger.info('Download finalizado');
          return resolve(true);
        }
        const size = fs.statSync(tempPath).size / 1000000.0;
        this.logger.info(`Download não finalizado | ${size} Mb baixados`);
        await sleep(5000);
      } while (true);
    });
  }
}

class PeticaoTJMS extends PeticaoEsaj {
  constructor() {
    super({
      url: 'https://esaj.tjms.jus.br/cpopg5',
    });
    this.loginUrl = 'https://esaj.tjms.jus.br/sajcas/login';
    this.estado = 'MS';
    this.tribunal = 'TJMS';
  }
}

(() => {
  new PeticaoTJMS()
    .extrair('0000135-74.2021.8.12.0031', 1)
    .then((r) => console.log(r));
})();

module.exports.PeticaoTJMS = PeticaoTJMS;

const puppeteer = require('puppeteer');
const { ExtratorBase } = require('./extratores');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const fs = require('fs');
const sleep = require('await-sleep');

class PeticaoTJSP extends ExtratorBase {
  constructor({
    url = '',
    debug = false,
    timeout = 50000,
    headless = false,
    usuario = { username: '', password: '' },
  } = {}) {
    super(url, debug);
    this.timeout = timeout;
    this.headless = headless;
    if (usuario) this.usuario = usuario;

    this.args = [
      '--no-sandbox',
      // `--proxy-server=http://proxy-proadv.7lan.net:8181`,
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
  }

  async extrair(numeroProcesso, instancia = 1) {
    this.numeroProcesso = numeroProcesso;
    this.instancia = instancia;
    console.log(this.numeroProcesso, this.instancia);
    if (!this.usuario.username) this.usuario = await this.getCredenciais('SP');

    this.logger = new Logger('info', 'logs/PeticaoTJSP/PeticaoTJSPInfo.log', {
      nomeRobo: `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJSP}`,
      NumeroDoProcesso: numeroProcesso,
    });

    await this.iniciar();
    await sleep(100);

    await this.acessar(
      'https://esaj.tjsp.jus.br/esaj/portal.do',
      this.pageOptions
    );
    await sleep(100);

    await this.login();
    await sleep(100);

    await this.consultarProcesso(numeroProcesso, instancia);
    await sleep(100);

    await this.consultaAutos();
    await sleep(100);

    await this.resgataDocumentos();
    await sleep(100);

    await this.aguardaDownload();
    await sleep(1000);

    await this.finalizar();
  }

  async iniciar() {
    this.logger.info('Iniciando Puppeteer');
    this.browser = await puppeteer.launch(this.launchOptions);
    this.logger.info('Puppeteer iniciado');

    this.logger.info('Criando nova pagina');
    this.page = await this.browser.newPage();
    this.logger.info('Nova pagina criada');
  }

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

  async acessar(url, pageOptions, newPage = false) {
    if (newPage) {
      this.page = await this.browser.newPage();
    }
    await this.page.setViewport(this.viewPort);
    await this.page.goto(url, pageOptions);
  }

  async login() {
    this.logger.info('Iniciando procedimento de login');
    this.logger.info('Acessando pagina de login');
    await this.acessar(
      'https://esaj.tjsp.jus.br/sajcas/login?service',
      this.pageOptions,
      false
    );
    this.logger.info('Pagina de login acessada');
    this.logger.info(`Credenciais: ${JSON.stringify(this.usuario)}`);
    this.logger.info('Digitando nome do usuario');
    await this.page.type('#usernameForm', this.usuario.username);
    this.logger.info('Digitando senha do usuario');
    await this.page.type('#passwordForm', this.usuario.password);

    this.logger.info('Clicando em entrar');
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('#pbEntrar'),
    ]);
    this.logger.info('Terminado procedimento de login');
  }

  async consultarProcesso(numeroProcesso, instancia = 1) {
    this.logger.info('Iniciando procedimento de consulta do processo');
    numeroProcesso = numeroProcesso.replace('.8.26.', '.');
    numeroProcesso = numeroProcesso.replace(/\W/gm, '');
    let url;
    this.logger.info(`Escolhendo url para ${instancia}`);
    if (instancia === 1) {
      url = 'https://esaj.tjsp.jus.br/cpopg/open.do';
    }
    if (instancia === 2) {
      url = 'https://esaj.tjsp.jus.br/cposg/open.do';
    }
    if (instancia === 3) {
      url = 'https://esaj.tjsp.jus.br/cposgcr/open.do';
    }

    // url = INSTANCIAS_URLS[instancia - 1]+'/open.do';

    this.logger.info(`Acessando pagina de consulta da ${this.instancia}a instancia`);
    await this.acessar(url, this.pageOptions, false);
    this.logger.info('Aguardando o carregamento da pagina');
    await this.page.waitForSelector('#conpass-tag > div > button');
    this.logger.info('Pagina carregada');
    this.logger.info('Digitando numero do processo');
    await this.page.type('#numeroDigitoAnoUnificado', numeroProcesso);
    this.logger.info(`PROCESSO: ${this.numeroProcesso}`);

    this.logger.info('Clicando no botão de consultar');
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('#botaoConsultarProcessos'),
    ]);
    this.logger.info('Finalizando procedimento de consulta de processo');
  }

  async consultaAutos() {
    this.logger.info('Iniciando procedimento de consulta de Autos');
    this.logger.info('Aguardando carregamento da pagina');
    await this.page.waitForSelector('#conpass-tag > div > button');
    this.logger.info('Pagina carregada');
    this.logger.info('Acessando pagina com documentos do processo');
    const link = await this.page.$('#linkPasta');

    const newPagePromise = new Promise((x) =>
      this.browser.once('targetcreated', (target) => x(target.page()))
    );
    await link.click({ button: 'middle' });
    this.page = await newPagePromise;
    await this.page.bringToFront();
    this.logger.info('Pagina Acessada');
    await this.page.waitForSelector('#divDocumento');
    this.logger.info('Finalizando procedimento de consulta de Autos');
  }

  async resgataDocumentos() {
    this.logger.info('Iniciando procedimento de resgate dos documentos');
    this.logger.info('Selecionando documentos de interessa para download');
    await this.page.evaluate(() => {
      let elements = $('#arvore_principal > ul > li > a');
      let tam = elements.length;

      for (let i = 0; i < tam; i++) {
        if (elements[i].innerText === 'Decisão') break;
        elements[i].firstElementChild.click();
      }
    });
    this.logger.info('Documentos selecionados');
    this.logger.info('Preparar para download');
    await this.page.click('#salvarButton');

    await this.page.waitForSelector('td.modalTitulo');

    await this.page.click('#opcao1');

    await this.page.click('#botaoContinuar');

    // await this.page.waitForSelector('#popupGerarDocumentoFinalizadoComSucesso');

    await this.page.waitForSelector('#popupGerarDocumentoOpcoes');
    await this.page.waitForSelector('#popupGerarDocumentoOpcoes', {
      hidden: true,
    });
    await this.page.waitForSelector(
      'input.botaoPopupGeracaoDocumento.spwBotao.btBaixarDocumento'
    );

    this.logger.info('Iniciando download');

    await this.page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: './temp/peticoes/tjsp',
    });

    await this.page.click('#btnDownloadDocumento');
    this.logger.info('Download iniciado');
  }

  async getCredenciais(Seccional) {
    if (Seccional === 'SP')
      return { username: '103.890.517-64', password: 'Senh@TJ123' };
  }

  async aguardaDownload() {
    const path = `./temp/peticoes/tjsp/${this.numeroProcesso}.pdf`;
    const tempPath = `./temp/peticoes/tjsp/${this.numeroProcesso}.pdf.crdownload`;

    return new Promise(async (resolve) => {
      do {
        if (fs.existsSync(path) && !fs.existsSync(tempPath)) {
          this.logger.info('Download finalizado');
          return resolve(true);
        }

        this.logger.info('Download não finalizado');
        await sleep(1000);
      } while (true);
    });
  }
}

module.exports.PeticaoTJSP = PeticaoTJSP;

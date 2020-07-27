const puppeteer = require('puppeteer');
const { ExtratorBase } = require('./extratores');

const INSTANCIAS_URLS = require('../assets/TJSC/instancias_urls.json')
  .INSTANCIAS_URL;

class PeticaoTJSP extends ExtratorBase {
  constructor(url, debug, instancia, timeout = 50000, headless=false, usuario=null) {
    super(url, debug);
    this.timeout = timeout;
    this.headless = headless;
    this.instancia = instancia;
    if (usuario)
      this.usuario = usuario;

    this.args = [
      "--no-sandbox",
      // `--proxy-server=http://proxy-proadv.7lan.net:8181`,
      `--ignore-certificate-errors`
    ];
    this.ignore = ["--disable-extensions"];
    this.viewPort = { width: 1024, height: 768 };
    this.pageOptions = { waitUntil: "load", timeout: 0 };
    this.launchOptions = {
      slowMo: 100,
      headless: this.headless,
      timeout: this.timeout,
      args: this.args,
      ignoreDefaultArgs: this.ignore
    };
  }

  async extrair(numeroProcesso, instancia=1) {
    if (!this.usuario)
      this.usuario = await this.getCredenciais('SP');

    await this.iniciar();

    await this.acessar('https://esaj.tjsp.jus.br/esaj/portal.do', this.pageOptions);

    await this.login();

    await this.consultarProcesso(numeroProcesso, instancia);

    await this.consultaAutos();

    await this.resgataDocumentos();

    // await this.finalizar()
    // await browser.close();
  }

  async iniciar() {
    this.browser = await puppeteer.launch(this.launchOptions)
    this.page = await this.browser.newPage();
  }

  async finalizar() {
    await this.browser.close();
  }

  async acessar(url, pageOptions, newPage = false) {
    await this.page.setViewport(this.viewPort);
    await this.page.goto(url, pageOptions);
  }

  async login() {
    await this.acessar('https://esaj.tjsp.jus.br/sajcas/login?service', this.pageOptions, false);
    await this.page.type('#usernameForm', this.usuario.username);
    console.log('Digitado o login', this.usuario.username);
    await this.page.type('#passwordForm', this.usuario.password);
    console.log('Digitando a senha', this.usuario.password);

    const [response2] = await Promise.all([
      this.page.waitForNavigation(),
      this.page.click("#pbEntrar")
    ]);
  }

  async consultarProcesso(numeroProcesso, instancia = 1){
    numeroProcesso = numeroProcesso.replace('.8.26.', '.')
    numeroProcesso = numeroProcesso.replace(/\W/gm, '');
    let url;
    if ( instancia === 1 ) {
      url = 'https://esaj.tjsp.jus.br/cpopg/open.do';
    }
    if ( instancia === 2 ) {
      url = 'https://esaj.tjsp.jus.br/cposg/open.do';
    }
    if (instancia === 3) {
      url = 'https://esaj.tjsp.jus.br/cposgcr/open.do'
    }

    await this.acessar(url, this.pageOptions, false);
    await this.page.waitForSelector('#conpass-tag > div > button');
    await this.page.type('#numeroDigitoAnoUnificado', numeroProcesso);
    console.log('Digitando o numero do processo', numeroProcesso);


    const [response2] = await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('#botaoConsultarProcessos')
    ])
  }

  async consultaAutos() {

    await this.page.waitForSelector('#conpass-tag > div > button')
    const link = await this.page.$('#linkPasta')

    const newPagePromise = new Promise(x => this.browser.once('targetcreated', target => x(target.page())));
    await link.click( {button: 'middle'} );
    this.page = await newPagePromise;
    await this.page.bringToFront();

    await this.page.waitForSelector('#divDocumento');

  }

  async resgataDocumentos () {
    let lista;
    let ListaDocs = [];

    lista = await this.page.$$('#arvore_principal > ul > li > a');
    let tam = lista.length;
    let i;



    await this.page.evaluate(() => {
      let elements = $('#arvore_principal > ul > li > a');
      let tam = elements.length;

      for (i = 0; i < tam; i++) {
        if (elements[i].innerText === 'Decisão') break;
        elements[i].firstElementChild.click();
      }
    })

    await this.page.click('#salvarButton');

    await this.page.waitForSelector('td.modalTitulo');

    await this.page.click('#opcao1');

    await this.page.click('#botaoContinuar');

    // await this.page.waitForSelector('#popupGerarDocumentoFinalizadoComSucesso');

    await this.page.waitForSelector('#popupGerarDocumentoOpcoes');
    await this.page.waitForSelector('#popupGerarDocumentoOpcoes', {hidden: true})
    await this.page.waitForSelector('input.botaoPopupGeracaoDocumento.spwBotao.btBaixarDocumento')

    // await this.page._client.send('Page.setDownloadBehavior', {behavior: 'allow', downloadPath: '../temp/peticoes/tjsp'});

    await this.page.click('#btnDownloadDocumento');

  }

  async getCredenciais(Seccional) {
    if (Seccional === 'SP')
      return { username: '103.890.517-64', password: 'Senh@TJ123' };
  }
}

module.exports.PeticaoTJSP = PeticaoTJSP;

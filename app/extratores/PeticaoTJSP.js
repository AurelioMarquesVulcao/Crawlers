const puppeteer = require('puppeteer');
const fs = require('fs');
const sleep = require('await-sleep');
const { ExtratorBase } = require('./extratores');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
// const { CredenciaisAdvogados } = require('../models/schemas/credenciaisAdvogados'); // TODO fazer .env local

class PeticaoTJSP extends ExtratorBase {
  constructor({
    url = '',
    debug = false,
    timeout = 30000,
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

    this.idsUsadas = [];
  }

  async extrair(numeroProcesso, instancia = 1) {

    // await new CredenciaisAdvogados({ login: '103.890.517-64', senha: 'Senh@TJ123', estado: 'SP', nome: 'Karine Sensei' }).salvar();

    this.resposta = { numeroProcesso: numeroProcesso};
    this.numeroProcesso = numeroProcesso;
    this.instancia = instancia;
    if (!this.usuario.username) this.usuario = await this.getCredenciais('SP');

    this.logger = new Logger('info', 'logs/PeticaoTJSP/PeticaoTJSPInfo.log', {
      nomeRobo: `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJSP}`,
      NumeroDoProcesso: numeroProcesso,
    });
    try {
      await this.iniciar();
      await sleep(100);

      await this.acessar(
        'https://esaj.tjsp.jus.br/esaj/portal.do',
        this.pageOptions
      );
      await sleep(100);

      await this.login();
      await sleep(100);

      // throw new Error('oi');

      await this.consultarProcesso(numeroProcesso, instancia);
      await sleep(100);

      await this.consultaAutos();
      await sleep(100);

      await this.resgataDocumentos();
      await sleep(100);

      await this.aguardaDownload();
      await sleep(1000);

      this.resposta.sucesso = true;
      this.logger.log('info', `Finalizado processo de extração de documentos ${this.numeroProcesso}`);

    } catch (e) {
      this.logger.log('error', e);

      this.resposta.sucesso = false;
      this.resposta.detalhes = e;
    } finally {
      await this.finalizar();
      this.resposta.logs = this.logger.logs;
      return this.resposta;
    }
  }

  async iniciar() {
    this.logger.info('Iniciando Puppeteer');
    this.browser = await puppeteer.launch(this.launchOptions);
    this.logger.info('Puppeteer iniciado');

    this.logger.info('Criando nova pagina');
    this.page = await this.browser.pages().then(pages => pages[0]);
    await this.page.setViewport(this.viewPort);
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
    await this.page.goto(url, pageOptions);
  }

  async login() {
    let continuar = 0;
    this.logger.info('Iniciando procedimento de login');
    this.logger.info('Acessando pagina de login');

    await new Promise(async resolve => {
      do {
        await this.acessar(
          'https://esaj.tjsp.jus.br/sajcas/login?service',
          this.pageOptions,
          false
        );
        this.logger.info('Pagina de login acessada');

        this.logger.info(`Credenciais: ${JSON.stringify(this.usuario.login)} - ${this.usuario.senha}`);
        this.logger.info('Digitando nome do usuario');
        await this.page.type('#usernameForm', this.usuario.login);
        this.logger.info('Digitando senha do usuario');
        await this.page.type('#passwordForm', this.usuario.senha);

        this.logger.info('Clicando em entrar');
        await Promise.all([
          this.page.waitForNavigation(),
          this.page.click('#pbEntrar'),
        ]);

        continuar = await this.page.$$('#mensagemRetorno')
          .then(selector => Boolean(selector.length));

        if (continuar) {
          this.logger.log('warning', `Usuário ou senha inválida. [${JSON.stringify(this.usuario)}]`);
          this.logger.info('Realizando nova tentativa de Login');
          this.usuario = await this.getCredenciais('SP');
        } else {
          this.logger.info('Terminado procedimento de login');
          console.log('terminado login')
          return resolve(true);
        }

        await sleep(500);

      } while(true);
    })

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
    // if (this.instancia === 1){
    //   await this.page.waitForSelector('#conpass-tag > div > button');
    // } else {
    //
    // }
    await sleep(1500);

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
    // await this.page.waitForSelector('#conpass-tag > div > button');
    await sleep(1500);
    this.logger.info('Pagina carregada');
    this.logger.info('Acessando pagina com documentos do processo');
    let link;
    const newPagePromise = new Promise((x) =>
      this.browser.once('targetcreated', (target) => x(target.page()))
    );
    if (this.instancia === 1){
      link = await this.page.$('#linkPasta');
      await link.click({ button: 'middle' });
    }else {
      link = await this.page.$('a[title="Pasta Digital"]')
      await link.click();
    }
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

  async getCredenciais(estado) {
    // const credenciais = await CredenciaisAdvogados.getCredenciais(estado, this.idsUsadas);
    // this.idsUsadas.push(credenciais._id);
    const credenciais = {login: "103.890.517-64", senha: "Senh@TJ123"}

    return credenciais;
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

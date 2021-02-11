require('../bootstrap');
const cheerio = require('cheerio');
const fs = require('fs');
const sleep = require('await-sleep');
const Path = require('path');
const { Robo } = require('../lib/newRobo');
const { ExtratorPuppeteer } = require('./extratores');
const { Logger } = require('../lib/util');
const { enums } = require('../configs/enums');
const { Helper } = require('../lib/util');
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
    this.robo = new Robo();
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

    this.resposta = { numeroProcesso: numeroProcesso };
    this.numeroProcesso = numeroProcesso;
    this.instancia = instancia;
    if (!this.usuario.login)
      this.usuario = await this.getCredenciais(this.estado);

    this.numeroProcessoDetalhes = this.dividirNumeroProcesso(
      this.numeroProcesso
    );

    let documentosSalvos;

    this.logger = new Logger('info', `logs/${this.tribunal}/peticao.log`, {
      nomeRobo: `${enums.tipoConsulta.Peticao}.${this.tribunal}`,
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

        documentosSalvos = await this.baixarDocumentos();

        count++;
      } while (count < tam);

      this.resposta.sucesso = true;
      this.nProcessos = documentosSalvos;
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
    this.logger.info(`Escolhendo url para ${instancia}`);

    this.logger.info(
      `Acessando pagina de consulta da ${this.instancia}a instancia`
    );

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.evaluate(() => {
        let aTags = document.querySelectorAll(
          '.esajCelulaDescricaoServicos > a'
        );
        let searchText = /(Consultas?\sProcessua(l|is)|(Consultas?))/;
        let found;

        for (let i = 0; i < aTags.length; i++) {
          if (searchText.test(aTags[i].textContent)) {
            found = aTags[i];
            break;
          }
        }
        found.click();
      }),
    ]);

    await Promise.all([
      this.page.waitForNavigation(),
      this.page.evaluate(() => {
        let aTags = document.querySelectorAll(
          '.esajCelulaDescricaoServicos > a'
        );
        let searchText = /Consulta\sde\sProcessos\s((d\w)|(-))\s1.\s?Grau/;
        let found;

        for (let i = 0; i < aTags.length; i++) {
          if (searchText.test(aTags[i].textContent)) {
            found = aTags[i];
            break;
          }
        }
        found.click();
      }),
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

    await this.page.click('#opcao1');

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
    const path = `${this.filePath}/${this.numeroProcesso}.pdf`;
    const tempPath = `${this.filePath}/${this.numeroProcesso}.pdf.crdownload`;

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

  async baixarDocumentos() {
    // 1 verificar os documentos que eu tenho que baixar
    this.logger.info('Iniciando procedimento de resgate dos documentos');
    this.logger.info('Verificando se existe o documento "DECISAO"');
    this.logger.info('Selecionando documentos de interessa para download');

    let body = await this.page.evaluate(
      () => document.querySelector('html').innerHTML
    );
    let $ = cheerio.load(body);

    let todosDocumentos = $('#arvore_principal > ul > li > a');
    let documentos = [];
    let documentoSalvo = [];
    for (let i = 1, tam = todosDocumentos.length; i <= tam; i++) {
      let selector = `#arvore_principal > ul > li:nth-child(${i}) > a`;
      if (/(Decisão)|(Despachos?)|(Ato\sOrdinatório)/.test($(selector).text()))
        break;
      documentos.push(selector);
    }

    this.logger.info('Documentos separados');

    //Setando comportamento de download
    this.filePath = Path.resolve(__dirname, '../downloads');
    console.log({ filePath: this.filePath });

    await this.page._client.send('Page.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: this.filePath,
    });

    for (let i = 0, tam = documentos.length; i < tam; i++) {
      let resposta = await this.downloadAndSave(documentos[i], $);
      documentoSalvo.push(resposta);
    }
  }

  // para

  async downloadAndSave(selector, $) {
    await this.page.click(`${selector} > i`);
    await sleep(200);
    let nomeArquivo = $(selector).text().trim();
    let urlDocumento = '';

    this.logger.info('Preparar para download');

    await this.page.click('#salvarButton');
    await sleep(500);

    await this.page.waitForSelector('td.modalTitulo');
    await sleep(500);

    $ = cheerio.load(
      await this.page.evaluate(() => document.querySelector('body').innerHTML)
    );

    if (!/display:\snone/.test($('#popupDividirDocumentos').attr().style)) {
      await this.page.click('#opcao1');

      await this.page.click('#botaoContinuar');
    }

    await this.page.waitForSelector('#popupGerarDocumentoOpcoes', {
      timeout: 180000,
    });
    await this.page.waitForSelector('#popupGerarDocumentoOpcoes', {
      hidden: true,
    });

    await this.page.click('#btnDownloadDocumento');

    // const xRequest = await new Promise((resolve) => {
    //   this.page.on('request', (interceptedRequest) => {
    //     if (/getPDFImpressao\.do/.test(interceptedRequest._url)) {
    //       interceptedRequest.abort();
    //       resolve(interceptedRequest);
    //     }
    //   });
    // });

    // await this.page.waitForSelector(
    //   'input.botaoPopupGeracaoDocumento.spwBotao.btBaixarDocumento'
    // );

    console.log('botaoClicado');
    this.logger.info('Download iniciado');
    this.logger.info(`Baixando arquivo: ${nomeArquivo}`);

    await this.aguardaDownload();

    await this.salvarArquivo(nomeArquivo);

    await this.page.click(`${selector} > i`);
    await sleep(200);
  }

  // para

  async salvarArquivo(nomeArquivo) {
    let path = Path.resolve(__dirname, '../downloads');
    nomeArquivo = nomeArquivo.replace(/\s/g, '_');
    nomeArquivo = nomeArquivo.replace(/(\.)|(\/)/g, '_');
    nomeArquivo = Helper.removerAcento(nomeArquivo);
    let filePath = `${path}/${nomeArquivo}.pdf`;

    this.logger.info(
      `Mudando nome do arquivo de ${this.numeroProcesso}.pdf => ${nomeArquivo}.pdf`
    );

    fs.renameSync(`${path}/${this.numeroProcesso}.pdf`, filePath);
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

class PeticaoTJSP extends PeticaoEsaj {
  constructor() {
    super({ url: 'https://esaj.tjsp.jus.br/cpopg' });
    this.loginUrl = 'https://esaj.tjsp.jus.br/sajcas/login';
    this.estado = 'SP';
    this.tribunal = 'TJSP';
  }
}

class PeticaoTJSC extends PeticaoEsaj {
  constructor() {
    super({ url: 'https://esaj.tjsc.jus.br/cpopg' });
    this.loginUrl = 'https://esaj.tjsc.jus.br/sajcas/login';
    this.estado = 'SC';
    this.tribunal = 'TJSC';
  }
}

// (() => {
//   new PeticaoTJMS()
//     .extrair('0000135-74.2021.8.12.0031', 1)
//     .then((r) => console.log(r));
// })();

module.exports = { PeticaoTJMS, PeticaoTJSP, PeticaoTJSC };

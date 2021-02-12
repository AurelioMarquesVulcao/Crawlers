const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const sleep = require('await-sleep');
const shell = require('shelljs');
require('dotenv/config');

const { JTEParser } = require('../parsers/JTEParser');
const { Logger } = require('./util');
const { enums } = require('../configs/enums');

var heartBeat = 0; // Verifica se a aplicação esta consumindo a fila, caso não ele reinicia o worker
setInterval(function () {
  heartBeat++;
  // if (logadoParaIniciais == false) {
  if (heartBeat > 60) {
    console.log(
      '----------------- Fechando o processo por inatividade -------------------'
    );
    // throw "erro de time"
    process.exit();
  }
  // }
  // console.log(heartBeat, "Segundos");
}, 1000);

// Senhas de login no tribunal
// const login = '11270311719';
// const senha = 'Impact@2020';
const login = '11167978790';
const senha = 'Impact@2020';
// 00011028820205090872
// const login = "08673849721";
// const senha = "ma221079";
// const login = '10389051764';
// const senha = 'Senh@JTE123';
// let email = "karine_mrm@hotmail.com";

// Variavel para controle da quantidade de arquivos a serem baixados
var numeroDocumentosTotal = 0;
// Variavel para controlar
var controlaLink = [];
var valorLinkTeste = [];
var links = [];

const ajustes = new JTEParser();

var timerSleep = 300;
var timerSleep1 = 1000;
var timerSleep2 = 2000;
var timerSleep3 = 3000;
var timerSleep9 = 9000;
var timerSleep5 = 5000;
var timeOut = 40000;

class RoboPuppeteer3 {
  constructor() {
    this.logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      NumeroDoProcesso: 'Puppeteer',
      // this.
    });
  }
  allLogs() {
    return this.logger.allLog();
  }
  resetLogs() {
    this.logger.resetLog();
  }

  async iniciar() {
    // para abrir o navegador use o headless: false
    this.browser = await puppeteer.launch({
      // headless: false,
      headless: true,
      slowMo: 50,
      // ignoreHTTPSErrors: true,
      //args: ['--ignore-certificate-errors', '--no-sandbox', '--proxy-server=socks4://96.9.77.192:55796']
      // args: ['--ignore-certificate-errors', '--no-sandbox', '--proxy-server=http://proxy-proadv.7lan.net:8181']
      // args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu', '--proxy-server=http://proxy-proadv.7lan.net:8181']
      // args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu']
      // args: ['--ignore-certificate-errors', '--proxy-server=http://proxy-proadv.7lan.net:8182']
      args: [
        '--ignore-certificate-errors',
        '--no-sandbox',
        '--headless',
        '--proxy-server=http://proxy-proadv.7lan.net:8182',
      ],
    });
    this.page = await this.browser.newPage();
    await this.page.authenticate({
      username: 'proadvproxy',
      password: 'C4fMSSjzKR5v9dzg',
    });
    // await this.acessar('https://www.meuip.com.br/');
    // await sleep(30000)
    console.log('O Puppeteer foi Iniciado corretamente');
    heartBeat = 0;
  }

  async extrair(numero, contador) {
    await this.preencheProcesso(numero, contador);
    heartBeat = 0;
    return await this.pegaHtml(contador, numero);
  }

  async extrairIniciais() {}

  async acessar(url) {
    let content;
    try {
      await this.page.goto(url, {
        waitUntil: 'load',
        timeout: 40000,
        // waitUntil: 'networkidle2'
      });
      // isso me da o url completo
      //content = await this.page.content();
    } catch (e) {
      console.log(e);
      process.exit();
    }
    console.log(`Tentando carregar a url => ${url}`);
    heartBeat = 0;
    return content;
  }

  async preencheTribunal(numero) {
    // para esperar carregar o elemento onde fica o tribunal
    await sleep(timerSleep);
    await this.page.waitFor('mat-form-field');
    await sleep(timerSleep);
    await this.page.waitFor(
      '#mat-select-1 > div > div.mat-select-arrow-wrapper'
    );
    await sleep(timerSleep);
    // console.log(!! await this.page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper'));
    await this.page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper');
    await sleep(timerSleep);
    await this.page.click(`#mat-option-${escolheEstado(numero)}`);
    await sleep(timerSleep1);
    await this.page.click(
      'ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span'
    );
    await sleep(timerSleep5);
    await sleep(timerSleep2);
    // await this.page.waitFor('#consultaProcessual')
    await this.page.click('#consultaProcessual');
    await sleep(timerSleep);
    //await console.log("Logado ao tribunal desejado");
    heartBeat = 0;
    this.logger.info('Tribunal Logado com sucesso.');
  }
  async preencheTribunal1(numero) {
    heartBeat = 0;
    let escolha = escolheEstado(numero) + 1;
    if (escolha == 25) {
      escolha = 2;
    }
    console.log('clianco no elemento button');

    await this.page.evaluate(() => {
      document
        .querySelector(
          `#inner > ion-toolbar > ion-buttons:nth-child(3) > ion-tab-button > i`
        )
        .click();
      console.log('estou tentando abrir o elemento');
    });

    // await this.page.click('#inner > ion-toolbar > ion-buttons:nth-child(3)');
    // await this.page.click('#inner > ion-toolbar > ion-buttons:nth-child(3)');
    // para esperar carregar o elemento onde fica o tribunal
    await sleep(timerSleep);

    // await this.page.waitFor('mat-form-field');
    await sleep(timerSleep);
    await this.page.waitFor('#mat-dialog-1');
    await sleep(timerSleep);
    // console.log(!! await this.page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper'));
    await this.page.evaluate(() => {
      document.querySelector(`#mat-select-3`).click();
      console.log('estou tentando abrir o elemento');
    });
    // await this.page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper');
    await sleep(timerSleep);
    await this.page.evaluate((escolha) => {
      document
        .querySelector(`#cdk-overlay-3 > div > div :nth-child(${escolha})`)
        .click();
      console.log('estou tentando abrir o elemento');
    }, escolha);
    // await this.page.click(`#mat-option-${escolha}`);
    await sleep(timerSleep1);

    await this.page.evaluate(() => {
      document
        .querySelector(
          `ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span`
        )
        .click();
      console.log('estou tentando abrir o elemento');
    });
    // await this.page.click(
    //   'ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span'
    // );
    await sleep(timerSleep5);
    await this.page.evaluate(() => {
      document
        .querySelector('#tituloLogin > ion-item:nth-child(5) > ion-label')
        .click();
      console.log('estou tentando abrir o elemento');
    });
    await sleep(timerSleep5);
    await this.page.type('#senha > input', senha);
    await sleep(timerSleep5);
    await this.page.evaluate(() => {
      document.querySelector('#formLogin > ion-toolbar > ion-button').click();
      console.log('estou tentando abrir o elemento');
    });
    await sleep(10000);
    // await this.page.waitFor('#consultaProcessual')
    // await this.page.evaluate(() => {
    //   document.querySelector("#consultaProcessual").click();
    //   console.log("estou tentando abrir o elemento");
    // });
    //  await this.page.evaluate(() => {
    //   document.querySelector("body > app-root > ion-app > ion-menu > ion-content > ion-list > ion-item:nth-child(2)").click();
    //   console.log("estou tentando abrir o elemento");
    // });
    // await this.page.click('#consultaProcessual');
    await sleep(timerSleep);
    //await console.log("Logado ao tribunal desejado");
    heartBeat = 0;
  }

  async preencheTribunal2(numero) {
    let escolha = escolheEstado(numero);
    // if (escolha == 25) {
    //   escolha = 2;
    // }
    console.log('clianco no elemento button');

    await this.page.evaluate(() => {
      document
        .querySelector(
          `#inner > ion-toolbar > ion-buttons:nth-child(3) > ion-tab-button > i`
        )
        .click();
      console.log('estou tentando abrir o elemento');
    });

    // await this.page.click('#inner > ion-toolbar > ion-buttons:nth-child(3)');
    // await this.page.click('#inner > ion-toolbar > ion-buttons:nth-child(3)');
    // para esperar carregar o elemento onde fica o tribunal
    await sleep(timerSleep);

    // await this.page.waitFor('mat-form-field');
    await sleep(30000);
    await this.page.waitFor('#mat-dialog-2');
    await sleep(timerSleep);
    // console.log(!! await this.page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper'));
    await this.page.evaluate(() => {
      document.querySelector(`#mat-select-5`).click();
      console.log('estou tentando abrir o elemento');
    });
    // await this.page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper');
    await sleep(timerSleep);
    if (escolha == 2) {
      await this.page.evaluate(() => {
        document.querySelector('#mat-option-54').click();
        console.log('estou tentando abrir o elemento');
      });
    } else {
      await this.page.evaluate((escolha) => {
        document
          .querySelector(`#cdk-overlay-5 > div > div :nth-child(${escolha})`)
          .click();
        console.log('estou tentando abrir o elemento');
      }, escolha);
    }

    // await this.page.click(`#mat-option-${escolha}`);
    await sleep(timerSleep1);

    await this.page.evaluate(() => {
      document
        .querySelector(
          `ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span`
        )
        .click();
      console.log('estou tentando abrir o elemento');
    });
    // await this.page.click(
    //   'ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span'
    // );
    // await sleep(timerSleep5);
    // await this.page.evaluate(() => {
    //   document.querySelector("#tituloLogin > ion-item:nth-child(5) > ion-label").click();
    //   console.log("estou tentando abrir o elemento");
    // });
    // await sleep(timerSleep5);
    // await this.page.type('#senha > input', senha);
    // await sleep(timerSleep5);
    // await this.page.evaluate(() => {
    //   document.querySelector("#formLogin > ion-toolbar > ion-button").click();
    //   console.log("estou tentando abrir o elemento");
    // });
    await sleep(10000);
    // await this.page.waitFor('#consultaProcessual')
    // await this.page.click('#consultaProcessual');
    // await sleep(timerSleep);
    await console.log('Logado ao tribunal desejado');
    await this.page.evaluate(() => {
      document
        .querySelector(
          'body > app-root > ion-app > ion-menu > ion-content > ion-list > ion-item:nth-child(2)'
        )
        .click();
      console.log('estou tentando abrir o elemento');
    });
    heartBeat = 0;
    await sleep(10000);
    heartBeat = 0;
    await sleep(10000);
    heartBeat = 0;
    await sleep(10000);
    heartBeat = 0;
    await sleep(10000);
    heartBeat = 0;
  }

  async loga() {
    this.logger.info('Login iniciado');
    // console.log('Login iniciado');
    await this.page.click('#inner > ion-toolbar > ion-buttons:nth-child(5)');
    // this.logger.info('');
    // console.log('clicado no item de login');
    await sleep(3500);
    await this.page.type('#formLogin > ion-item > ion-input > input', login);
    this.logger.info('Digitando login');
    // console.log('digitando login');
    await sleep(2500);
    await this.page.click('#formLogin > ion-toolbar > ion-button');
    // console.log('clicado no primeiro botão');
    await sleep(2500);
    try {
      await this.page.type('#senha > input', senha);
      this.logger.info('Digitando Senha');
      // console.log('digitando senha');
    } catch (e) {
      // Devo salvar no banco um contador de falhas e parar a aplicação.
    }

    await sleep(3500);
    await this.page.click('#formLogin > ion-toolbar > ion-button');
    this.logger.info('Confirmando Senha');
    // console.log('confirmando senha');
    await sleep(9000);
    await this.page.click('#consultaProcessual > ion-card');
    this.logger.info('Clicando na no botão de Busca');
    // console.log('clicado no botão de busca');
    heartBeat = 0;
  }

  async preencheProcesso(numero, contador) {
    let entrada = processaNumero(numero);
    //await console.log("leu a entrada: " + entrada.numeroprocesso);
    await console.log('O contador de processo esta em: ' + contador);

    //await this.page.click('#consultaProcessual')
    await sleep(timerSleep);

    await this.page.waitFor('#campoNumeroProcesso');
    await sleep(timerSleep);
    // const input1 = await this.page.$('#campoNumeroProcesso');
    await this.page.click('#campoNumeroProcesso', { clickCount: 3 });
    await this.page.type('#campoNumeroProcesso', `${entrada.numeroprocesso}`);

    const input2 = await this.page.$('#campoAno');
    await input2.click({ clickCount: 3 });

    await this.page.type('#campoAno', `${entrada.ano}`);

    const input3 = await this.page.$('#campoVara');
    await input3.click({ clickCount: 3 });

    await this.page.type('#campoVara', `${entrada.vara}`);
    await sleep(timerSleep);
    try {
      await this.page.click(
        '#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button'
      );
      await sleep(timerSleep);
      await this.page.click(
        '#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button'
      );
      await sleep(timerSleep);
      // await this.page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button')
    } catch (e) {
      console.log(
        '----- Este é o ultimo processo dessa comarca até o momento. -----'
      );
      throw 'Erro não mapeado';
    }

    //await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
    await sleep(timerSleep);
  }

  async pegaHtml(contador, numero) {
    //const contador = 0
    await sleep(timerSleep);
    try {
      await this.page.waitFor('#listaProcessoEncontrado > mat-tab-group > div');
    } catch (e) {
      console.log(
        '----- Este é o ultimo processo dessa comarca até o momento. -----'
      );
      throw 'ultimo processo';
    }
    await sleep(timerSleep);
    await sleep(timerSleep);
    await this.page.waitFor(
      `#mat-tab-content-${contador}-0 > div > detalhes-aba-geral > div`
    );
    // pega assunto
    await sleep(timerSleep);
    await sleep(timerSleep);
    await this.page.click(`mat-expansion-panel`);
    await sleep(timerSleep);
    await sleep(timerSleep1);
    await sleep(timerSleep);
    let html1 = await this.page.evaluate(async () => {
      await new Promise(function (resolve) {
        setTimeout(resolve, 200);
      });
      let text = await document.querySelector('body').innerHTML;
      return text;
    });

    //let html1 = await this.page.content();

    await sleep(timerSleep);
    await console.log(
      `info: JTE - CNJ: ${numero} - html da capa do processo extraido do Puppeteer`
    );
    const divButon =
      '#listaProcessoEncontrado > mat-tab-group > mat-tab-header > div.mat-tab-label-container > div > div';
    // esta travando a carregamento dos elementos aqui.
    await sleep(2000);
    await this.page.click(`#mat-tab-label-${contador}-1`);
    await sleep(timerSleep);
    await this.page.click(`#mat-tab-label-${contador}-1`);
    await sleep(timerSleep);
    await this.page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col');
    await sleep(timerSleep);

    let html2 = await this.page.evaluate(async () => {
      await new Promise(function (resolve) {
        setTimeout(resolve, 400);
      });
      let text = await document.querySelector('body').innerHTML;
      return text;
    });

    //let html2 = await this.page.content();

    await console.log(
      `info: JTE - CNJ: ${numero} - html dos andamentos extraido do Puppeteer`
    );
    return { geral: html1, andamentos: html2 };
  }

  /**
   * Cern da extração de documentos. È aqui que será aberto cada documento e capturado cada link
   */
  async pegaInicial() {
    // this.logger.info('');
    this.logger.info('Iniciando extração dos links de documentos');
    try {
      let iniciaisArray = await (await this.numerosIniciaisLaco()).numero2;
      let iniciaisMultiplas = await (await this.numerosIniciaisLaco()).numero3;
      this.logger.info(`Arquivos simples ${iniciaisArray}`);
      // console.log('Arquivos simples ' + iniciaisArray);
      numeroDocumentosTotal + iniciaisArray.length;
      this.logger.info(`Arquivos paginados ${iniciaisMultiplas}`);
      // console.log('Arquivos paginados ' + iniciaisMultiplas);

      this.logger.info(`Iniciando captura de documentos Multiplos`);
      // entra na terceira forma de apresentação de documentos.
      // documentos multiplus.
      for (let j = 0; j < (await iniciaisMultiplas).length; j++) {
        this.logger.info(`Cliquei no documento numero ${iniciaisArray[j]}`);
        await sleep(1500);
        let dataEProcesso = await this.page.evaluate(
          async (j, iniciaisMultiplas) => {
            return {
              data: document.querySelector(
                `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-label > ion-text > h4`
              ).innerText,
              numeroProcesso: document.querySelector(
                '#numeroProcessoFormatado > div'
              ).innerText,
            };
          },
          j,
          iniciaisMultiplas
        );
        await sleep(500);
        // entra no documento multiplo

        let buttonRun = null;
        while (buttonRun != 'Lista de documentos') {
          // console.log(buttonRun);
          // console.log('tentando click');
          this.logger.info(
            'Tentando click para abrir janela dos documentos multiplos'
          );
          await sleep(2000);

          await this.page.evaluate(
            (j, iniciaisMultiplas) => {
              document
                .querySelector(
                  `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-icon`
                )
                .click();
              console.log('estou tentando abrir o elemento');
            },
            j,
            iniciaisMultiplas
          );

          // await this.page.click(
          //   `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-icon`
          // );
          // await sleep(2000);
          // await this.page.click(
          //   `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-icon`
          // );

          // this.logger.info(
          //   `Cliquei no documento numero ${iniciaisMultiplas[j]}`
          // );

          this.logger.info('Finalizado tentativa');

          buttonRun = await this.page.evaluate(async () => {
            await new Promise(function (resolve) {
              setTimeout(resolve, 2000);
            });
            if (
              document.querySelector(
                '#menu-content > ng-component:nth-child(3) > app-toolbar > ion-header > ion-toolbar > ion-title'
              )
            ) {
              return document.querySelector(
                '#menu-content > ng-component:nth-child(3) > app-toolbar > ion-header > ion-toolbar > ion-title'
              ).innerText;
            } else {
              return null;
            }
          });

          // console.log(buttonRun);
          // console.log('tentei novamente');
          await sleep(1000);
        }
        this.logger.info('Consegui abrir a aba de documentos multiplos');
        // console.log('Sai do while ');

        // await this.page.click(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-icon`)

        await sleep(500);

        // conta quantos documentos devo raspar
        let quantidadeDocumentos = await this.page.evaluate(async () => {
          return document.querySelectorAll(
            '#popover-marcador-filtro > ion-item'
          ).length;
        });
        this.logger.info(`A aba possui ${quantidadeDocumentos} documentos`);
        // console.log(quantidadeDocumentos);
        numeroDocumentosTotal + quantidadeDocumentos;
        // let testeK = document.querySelector('#linkPDF').href;

        // for (let k = 1; k < quantidadeDocumentos + 1; k++) {
        for (let k = 1; k < quantidadeDocumentos + 1; k++) {
          // this.logger.info(
          //   `Cliquei no documento numero ${iniciaisArray[j]}-${iniciaisArray[k]}`
          // );
          this.logger.info(
            `Cliquei no documento numero ${iniciaisArray[j]}-${k}`
          );
          // console.log(`Cliquei no documento numero ${iniciaisArray[j]}-${k}`);
          await sleep(1500);
          // abro o popup e abro o link do documento

          let link = await this.baixaLink(k, dataEProcesso);
          await sleep(timerSleep);
          links.push(link);
        }
        // volta a pagina principal de busca de processos
        await sleep(timerSleep);
        await sleep(timerSleep);
        await sleep(timerSleep);
        await sleep(3000);
        await this.page.click(
          '#menu-content > ng-component:nth-child(3) > app-toolbar > ion-header > ion-toolbar > ion-buttons:nth-child(1) > ion-back-button'
        );
        await sleep(timerSleep);
      }

      this.logger.info(`Finalizado captura de documentos Multiplos`);

      this.logger.info(`Iniciando captura de documentos Simples`);

      for (let i = 0; i < (await iniciaisArray).length; i++) {
        await this.baixaLinkSimples(i, iniciaisArray);
        heartBeat = 0;
      }
      this.logger.info(`Finalizado captura de documentos Simples`);

      // console.log(links);
      let resultado = links;
      links = [];
      controlaLink = [];
      heartBeat = 0;
      return resultado;
    } catch (e) {
      links = [];
      controlaLink = [];
      console.log('Não pegou os Documentos');
      console.log(e);
    }
  }

  async baixaLink(k, dataEProcesso) {
    // while (1==2) {
    this.logger.info(`Abrindo documento numero ${k}`);
    // console.log("Entrei no while do click do documento da inicial");
    // console.log("erro");
    await this.page.click(
      `#popover-marcador-filtro > ion-item:nth-child(${k})> span`
    );
    this.logger.info(`Documeto ${k} aberto com sucesso`);
    // await this.page.evaluate((k) => {
    //   document.querySelector(
    //     `#popover-marcador-filtro > ion-item:nth-child(${k})> span`).click();
    // }, k);

    // console.log('Abri documento');
    await sleep(200);
    let link = await this.page.evaluate(
      async (k, dataEProcesso) => {
        await new Promise(function (resolve) {
          setTimeout(resolve, 600);
        });

        let link = document.querySelector('#linkPDF').href;
        let movimentacao = document
          .querySelector(
            `#popover-marcador-filtro > ion-item:nth-child(${k}) > span`
          )
          .innerText.replace('\n', ' ');
        let data = dataEProcesso.data;
        let numeroProcesso = dataEProcesso.numeroProcesso;
        let tipo = 'PDF';
        let numero = numeroProcesso.replace(/\-|\./gim, '');
        // console.log({ numeroProcesso, data, movimentacao, link, tipo })
        return { numeroProcesso, data, movimentacao, link, tipo };
        // passar as variaveis como argumento ao fim do codigo faz com que elas sejam passada coretamente para dentro do navegador
      },
      k,
      dataEProcesso
    );
    this.logger.info(`Link numero ${k} capturado`);
    // console.log('Capturei Link');
    // codigo que fecha a ultima aba do puppeteer.
    // com esse codigo consigo fechar os popup
    await sleep(300);
    this.logger.info(`Tentando fechar aba do Link`);
    // console.log(" vou rodar o fechador de link");
    let pages = await this.browser.pages();
    // console.log("cravei page como page");
    await sleep(300);
    let quebraLoop = 0;
    console.log('abaixo desse codigo é que da errro');
    // loop de tentativas de marcar a aba a ser desativada
    // while (pages.length == 2) {
    //   console.log("entrei no loop de identificação de pagina");
    //   quebraLoop++;
    //   await sleep(2000);
    //   // await console.log(pages.length)
    //   // await console.log("Aguarde mais um pouco")
    //   pages = await this.browser.pages();
    //   console.log('Identificando popup');
    //   if (quebraLoop > 10) {

    //     console.log("Deu erro !!!");
    //     // break
    //     const error = new Error('Tempo de tentativa de resolução esgotado');
    //     error.code = 'Resolver esse processo!';
    //     throw error;
    //     process.exit();
    //   }
    // }

    // console.log("vou fechar a pagina");

    // console.log(pages.length)
    if (pages.length != 2) {
      this.logger.info(`A Aba do documento ainda está aberta`);
      const popup = pages[pages.length - 1];
      console.log('Fechando popup');
      await popup.close();
    }

    // teste validade link;
    try {
      if (link.link) {
        this.logger.info(
          `O numero de links capturados é... ${controlaLink.length}`
        );
        // console.log("O numero de links capturados é...", controlaLink.length);
        this.logger.info(`O Link capturado é válido`);
        // console.log(" O Link é válido e foi capturado");
        if (controlaLink.length == 0) {
          console.log('primeiro link capturado com sucesso');
          controlaLink.push(link.link);
          // console.log(link);
          heartBeat = 0;
          return link;
        } else if (controlaLink.length > 0) {
          // console.log("Estou verificando demais links");
          if (controlaLink.indexOf(link.link) < 0) {
            this.logger.info(`O link é único, verificação concluida`);
            console.log(
              ' ------------------- O link é único, verificação concluida ------------------- '
            );
            controlaLink.push(link.link);
            // console.log(link);
            heartBeat = 0;
            return link;
          } else {
            this.logger.info(`Já capturei esse link, vou repetir o processo.`);
            // console.log("já peguei esse documento, vou repetir o processo.");

            throw 'O Link do Documento é repetido';
          }
        }
      }
    } catch (e) {
      heartBeat = 0;
      await this.baixaLink(k, dataEProcesso);
    }

    // return link
  }

  async baixaLinkSimples(i, iniciaisArray) {
    await sleep(timerSleep);
    await this.page.click(
      `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-icon`
    );
    await this.page.click(
      `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-icon`
    );
    this.logger.info(`Cliquei no documento numero ${iniciaisArray[i]}`);
    await sleep(timerSleep);
    // Apos clicar no icone, entro no console do navegador e opero os seguintes codigos
    let link = await this.page.evaluate(
      async (i, iniciaisArray) => {
        // sleep para poder dar tempo de fazer o if
        await new Promise(function (resolve) {
          setTimeout(resolve, 500);
        });
        // ser for um documento com link pegue o link
        if (
          !!document.querySelector(
            '#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div > iframe'
          )
        ) {
          let link = document.querySelector(
            '#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div > iframe'
          ).src;
          let movimentacao = document.querySelector(
            `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > div > p`
          ).innerText;
          let data = document.querySelector(
            `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > ion-text > h4`
          ).innerText;
          let numeroProcesso = document.querySelector(
            '#numeroProcessoFormatado > div'
          ).innerText;
          // if (!! document.querySelector("#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div > pdf-viewer")){ "pdf"};
          let tipo = 'pdf';
          // console.log({ numeroProcesso, data, movimentacao, link, tipo })

          // let numero = numeroProcesso.replace(/\-|\./gmi,"");

          return { numeroProcesso, data, movimentacao, link, tipo };
        } // se for um documento de texto
        else {
          // esse await new promise, vai criar um sleep manual no pupputeer, assim não gero problemas para capturar o documento.
          await new Promise(function (resolve) {
            setTimeout(resolve, 1200);
          });
          // let link = document.querySelector("#documentoEmbutido").innerHTML;
          let link = document.querySelector(
            '#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div'
          ).innerHTML;
          let movimentacao = document.querySelector(
            `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > div > p`
          ).innerText;
          let data = document.querySelector(
            `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > ion-text > h4`
          ).innerText;
          let numeroProcesso = document.querySelector(
            '#numeroProcessoFormatado > div'
          ).innerText;
          let tipo = 'HTML';
          // console.log({ numeroProcesso, data, movimentacao, link, tipo })
          // let numero = numeroProcesso.replace(/\-|\./gmi,"");
          return { numeroProcesso, data, movimentacao, link, tipo };
        }

        // passar as variaveis como argumento ao fim do codigo faz com que elas sejam passada coretamente para dentro do navegador
      },
      i,
      iniciaisArray
    );

    // teste validade link;
    try {
      if (link.link) {
        // console.log(heartBeat);
        this.logger.info(`Já capturamos  ${controlaLink.length} Links válidos`);
        heartBeat = 0;
        // console.log(heartBeat);
        // console.log('O numero de links capturados é...', controlaLink.length);
        // console.log(' O Link é válido e foi capturado');
        if (controlaLink.length == 0) {
          console.log('primeiro link capturado com sucesso');
          controlaLink.push(link.link);
          // console.log(link);
          links.push(link);
          return link;
        } else if (controlaLink.length > 0) {
          // console.log('Estou verificando demais links');
          if (controlaLink.indexOf(link.link) < 0) {
            this.logger.info(`O link é único, verificação concluida`);
            console.log(
              ' ------------------- O link é único, verificação concluida ------------------- '
            );
            controlaLink.push(link.link);
            // console.log(link);
            links.push(link);
          } else {
            console.log('já peguei esse documento, vou repetir o processo.');
            throw 'O Link do Documento é repetido';
          }
        }
      }
    } catch (e) {
      await this.baixaLinkSimples(i, iniciaisArray);
    }

    this.logger.info(`Peguei o documento numero ${iniciaisArray[i]}`);
    //let linkAjustado = { numeroProcesso: ajustes.mascaraNumero(link.numeroProcesso), data: ajustes.ajustaData(link.data), movimentacao: link.movimentacao, link: link.link };
    // console.log(link);

    await sleep(1000);
  }

  /**
   * Tenta entrar nos documentos multiplos para baixar seus links
   * @param {number} numero Numero do child da tabela.
   */
  async clicaMultiplo(numero) {
    await this.page.click(
      `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${numero}) > ion-icon`
    );
    await this.page.click(
      `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${numero}) > ion-icon`
    );
    this.logger.info(`Cliquei no documento numero ${numero}`);

    console.log('tentei');

    let buttonRun = await this.page.evaluate(async () => {
      await new Promise(function (resolve) {
        setTimeout(resolve, 400);
      });
      let teste = document.querySelector(
        '#menu-content > ng-component:nth-child(3) > app-toolbar > ion-header > ion-toolbar > ion-buttons:nth-child(1) > ion-back-button'
      );
      return teste;
    });
    console.log(buttonRun);
    if (buttonRun == null) {
      throw 'Erro tente novamente';
    }
  }

  // busca os numeros dos filhos da lista de movimentacoes que possuem:  documentos anexos e estão antes da petição inicial
  // dessa forma pego apenas os anexos das iníciais.
  async numerosIniciaisLaco() {
    let numeros = await this.page.evaluate(async () => {
      let numero = document.querySelectorAll('ion-item ion-label').length;
      let numero2 = [];
      let numero3 = [];
      for (let i = 1; i < numero; i++) {
        if (
          document.querySelector(
            `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-label > div > p`
          )
        ) {
          // busca o texto dos movimentos
          let buscaInicio = document.querySelector(
            `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-label > div > p`
          ).innerText;
          let inicioTexto = 'Distribuído por sorteio';
          let inicioTexto2 = 'Distribuído por dependência';
          // se o texto for distribuido para sorteio sei que é uma inicial e que devo iniciar a minha busca por documentos
          if (buscaInicio == inicioTexto || buscaInicio == inicioTexto2) {
            numero2.push(i);
          }
        }

        // só inicia a busca por iniciais depois de achar o primeiro movimento
        if (numero2[0] < i) {
          let movimentacao = document.querySelector(
            `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-label > div > p`
          ).innerText;
          // regex que verifica o seguinte: 94ac08d ]
          // assim só obtenhos os anexos simples
          if (!!movimentacao.match(/\[\s[a-z0-9]{7}\s\]/gim)) {
            // verifica se possui icone para clicar assim sei que possuo anexo
            if (
              document.querySelector(
                `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-icon`
              )
            ) {
              numero2.push(i);
            }
          } else {
            let iconeMovimentacao = document.querySelector(
              `#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-icon`
            );
            if (!!iconeMovimentacao) {
              numero3.push(i);
            }
          }
        }
      }
      numero2 = numero2.slice(1, numero2.length);
      return { numero2, numero3 };
    });
    return numeros;
  }

  processaNumero(numero) {
    let numeroProcesso = numero.trim().slice(0, 7);
    let ano = numero.trim().slice(9, 13);
    let vara = numero.trim().slice(numero.length - 4, numero.length);
    let estado = numero.trim().slice(numero.length - 6, numero.length - 4);
    estado = parseInt(estado);
    heartBeat = 0;
    return { numeroProcesso, ano, vara, estado };
  }

  async fechar() {
    // codigo que fecha a ultima aba do puppeteer.
    // com esse codigo consigo fechar os popup
    const pages = await this.browser.pages();
    const popup = pages[pages.length - 1];
    await popup.close();
    // https://github.com/puppeteer/puppeteer/issues/1830
    // https://www.codota.com/code/javascript/functions/puppeteer/Browser/close
  }

  async finalizar() {}
  async mudaTribunal(estado) {
    console.log('iniciando troca de estado');
    await shell.exec('pkill chrome');
    process.exit();
  }
}

function escolheEstado(numero) {
  numero = numero.slice(numero.length - 6, numero.length - 4);
  return parseInt(numero) + 1;
}
function processaNumero(numero) {
  let numeroProcesso = numero.trim().slice(0, 7);
  let ano = numero.trim().slice(9, 13);
  let vara = numero.trim().slice(numero.length - 4, numero.length);
  return {
    numeroprocesso: numeroProcesso,
    ano: ano,
    vara: vara,
  };
}

module.exports.RoboPuppeteer3 = RoboPuppeteer3;

const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const sleep = require('await-sleep')
require("dotenv/config");
const { JTEParser } = require('../parsers/JTEParser');
const shell = require('shelljs');
const { Logger } = require('./util');
const { enums } = require('../configs/enums');


const ajustes = new JTEParser();

var timerSleep = 200

class RoboPuppeteer3 {
  constructor() {
    this.logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      // NumeroDoProcesso: cnj,
    });
  }

  async iniciar() {
    // para abrir o navegador use o headless: false
    this.browser = await puppeteer.launch({
      headless: true,
      slowMo: 1,
      ignoreHTTPSErrors: true,
      //args: ['--ignore-certificate-errors', '--no-sandbox', '--proxy-server=socks4://96.9.77.192:55796']
      //args: ['--ignore-certificate-errors', '--no-sandbox', '--proxy-server=http://proxy-proadv.7lan.net:8181']
      args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu', '--proxy-server=http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182']
      // args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu']
      //args: [process.env.ARGS_PUPPETTER_CONECTION]
      // args: ['--ignore-certificate-errors']
    });
    this.page = await this.browser.newPage();
    // await this.acessar('https://www.meuip.com.br/');
    // await sleep(30000)
    console.log('O Puppeteer foi Iniciado corretamente');
  }

  async acessar(url) {
    let content;
    try {
      await this.page.goto(url, {
        waitUntil: "load",
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
    return content;
  }


  async mudaTribunal(estado) {
    let timerSleep2 = 1000
    console.log("iniciando troca de estado");
    // //await this.iniciar()
    // //this.browser.close();
    // //await this.acessar("https://jte.csjt.jus.br/")
    // const pages = await this.browser.pages();
    // await sleep(timerSleep2)
    // console.log("------------------------------------------" + pages.length)

    // const popup = pages[pages.length - 1];
    // console.log(popup)
    // await sleep(timerSleep2)
    // await popup.close();
    // await sleep(timerSleep2)
    // // this.page = await this.browser.newPage();

    // await sleep(timerSleep2)

    await shell.exec('pkill chrome');
    //this.finalizar()
    process.exit()
  }



  async preencheTribunal(numero) {
    // await console.log(`foi escolhido o estado numero ${escolheEstado(numero)}`);
    //await console.log(`info: JTE - CNJ: ${numero} - Puppeteer carregou a url => https://jte.csjt.jus.br/`);
    // para esperar carregar o elemento onde fica o tribunal
    await sleep(timerSleep)
    await this.page.waitFor('mat-form-field');
    await sleep(timerSleep)
    await this.page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper')
    await sleep(timerSleep)
    // console.log(!! await this.page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper'));
    await this.page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper')
    await sleep(timerSleep)
    await this.page.click(`#mat-option-${escolheEstado(numero)}`)
    await sleep(timerSleep)
    await this.page.click('ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span')
    await sleep(2200)
    // await this.page.waitFor('#consultaProcessual')
    await this.page.click('#consultaProcessual')
    await sleep(timerSleep)
    //await console.log("Logado ao tribunal desejado");

  }


  async preencheProcesso(numero, contador) {
    let entrada = processaNumero(numero)
    //await console.log("leu a entrada: " + entrada.numeroprocesso);
    await console.log("O contador de processo esta em: " + contador);

    //await this.page.click('#consultaProcessual')
    await sleep(timerSleep)


    await this.page.waitFor('#campoNumeroProcesso')
    await sleep(timerSleep)
    // const input1 = await this.page.$('#campoNumeroProcesso');
    await this.page.click('#campoNumeroProcesso', { clickCount: 3 })
    await this.page.type('#campoNumeroProcesso', `${entrada.numeroprocesso}`)

    const input2 = await this.page.$('#campoAno');
    await input2.click({ clickCount: 3 })

    await this.page.type('#campoAno', `${entrada.ano}`)

    const input3 = await this.page.$('#campoVara');
    await input3.click({ clickCount: 3 })

    await this.page.type('#campoVara', `${entrada.vara}`)
    await sleep(timerSleep)
    try {
      await this.page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button')
      await sleep(timerSleep)
      await this.page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button')
      await sleep(timerSleep)
      // await this.page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button')
      //console.log(`Processo ${numero} foi preenchido com sucesso, obtendo dados.`);
    } catch (e) {
      console.log("----- Este é o ultimo processo dessa comarca até o momento. -----");
      throw "Erro não mapeado"
    }


    //await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
    await sleep(timerSleep)
    return await this.pegaHtml(contador, numero)
  }


  async pegaHtml(contador, numero) {
    //const contador = 0
    await sleep(timerSleep)
    try {
      await this.page.waitFor('#listaProcessoEncontrado > mat-tab-group > div')
    } catch (e) {
      console.log("----- Este é o ultimo processo dessa comarca até o momento. -----");
      throw "ultimo processo"
    }
    await sleep(timerSleep)
    await sleep(timerSleep)
    await this.page.waitFor(`#mat-tab-content-${contador}-0 > div > detalhes-aba-geral > div`)
    // pega assunto
    await sleep(timerSleep)
    await sleep(timerSleep)
    await this.page.click(`mat-expansion-panel`)
    await sleep(timerSleep)
    await sleep(1000)
    await sleep(timerSleep)
    let html1 = await this.page.evaluate(async () => {
      await new Promise(function (resolve) { setTimeout(resolve, 200); });
      let text = await document.querySelector('body').innerHTML;
      return text
    })

    //let html1 = await this.page.content();

    await sleep(timerSleep)
    await console.log(`info: JTE - CNJ: ${numero} - html da capa do processo extraido do Puppeteer`);
    const divButon = '#listaProcessoEncontrado > mat-tab-group > mat-tab-header > div.mat-tab-label-container > div > div'
    // esta travando a carregamento dos elementos aqui.
    await sleep(2000)
    await this.page.click(`#mat-tab-label-${contador}-1`)
    await sleep(timerSleep)
    await this.page.click(`#mat-tab-label-${contador}-1`)
    await sleep(timerSleep)
    await this.page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col')
    await sleep(timerSleep)

    let html2 = await this.page.evaluate(async () => {
      await new Promise(function (resolve) { setTimeout(resolve, 400); });
      let text = await document.querySelector('body').innerHTML;
      return text
    })


    //let html2 = await this.page.content();

    await console.log(`info: JTE - CNJ: ${numero} - html dos andamentos extraido do Puppeteer`);
    return { geral: html1, andamentos: html2 }
  }



  async loga() {
    let login = "10389051764";
    let senha = "Senh@JTE123";
    console.log('Login iniciado');
    await this.page.click("#inner > ion-toolbar > ion-buttons:nth-child(5)")
    console.log('clicado no item de login');
    await sleep(2000)
    await this.page.type("#formLogin > ion-item > ion-input > input", login)
    console.log('digido login');
    await sleep(3000)
    await this.page.click("#formLogin > ion-toolbar > ion-button")
    console.log('clicado no primeiro botão');
    await sleep(1000)
    await this.page.type("#senha > input", senha)
    console.log('digitando senha');
    await sleep(2000)
    await this.page.click("#formLogin > ion-toolbar > ion-button")
    console.log('confirmando senha');
    await sleep(9000)
    await this.page.click('#consultaProcessual > ion-card')
    console.log('clicado no botão de busca');
  }

  /**
   * Cern da extração de documentos. È aqui que será aberto cada documento e capturado cada link
   */
  async pegaInicial() {
    try {
      let links = [];
      let iniciaisArray = await (await this.numerosIniciaisLaco()).numero2;
      let iniciaisMultiplas = await (await this.numerosIniciaisLaco()).numero3;
      console.log("Arquivos simples " + iniciaisArray)
      console.log("Arquivos paginados " + iniciaisMultiplas)

      for (let i = 0; i < (await iniciaisArray).length; i++) {
        await sleep(timerSleep)
        await this.page.click(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-icon`)
        this.logger.info(`Cliquei no documento numero ${iniciaisArray[i]}`);
        await sleep(timerSleep)
        // Apos clicar no icone, entro no console do navegador e opero os seguintes codigos
        let link = await this.page.evaluate(async (i, iniciaisArray) => {
          // sleep para poder dar tempo de fazer o if
          await new Promise(function (resolve) { setTimeout(resolve, 1000); });
          // ser for um documento com link pegue o link
          if (!!document.querySelector("#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div > iframe")) {
            let link = document.querySelector("#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div > iframe").src;
            let movimentacao = document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > div > p`).innerText;
            let data = document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > ion-text > h4`).innerText;
            let numeroProcesso = document.querySelector("#numeroProcessoFormatado > div").innerText;
            // if (!! document.querySelector("#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div > pdf-viewer")){ "pdf"};
            let tipo = "pdf"
            // console.log({ numeroProcesso, data, movimentacao, link, tipo })
            return { numeroProcesso, data, movimentacao, link, tipo }
          } // se for um documento de texto 
          else {
            // esse await new promise, vai criar um sleep manual no pupputeer, assim não gero problemas para capturar o documento.
            await new Promise(function (resolve) { setTimeout(resolve, 1000); });
            // let link = document.querySelector("#documentoEmbutido").innerHTML;
            let link = document.querySelector("#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div").innerHTML;
            let movimentacao = document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > div > p`).innerText;
            let data = document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisArray[i]}) > ion-label > ion-text > h4`).innerText;
            let numeroProcesso = document.querySelector("#numeroProcessoFormatado > div").innerText;
            let tipo = "HTML"
            // console.log({ numeroProcesso, data, movimentacao, link, tipo })
            return { numeroProcesso, data, movimentacao, link, tipo }
          }

          // passar as variaveis como argumento ao fim do codigo faz com que elas sejam passada coretamente para dentro do navegador
        }, i, iniciaisArray);
        this.logger.info(`Peguei o documento numero ${iniciaisArray[i]}`);
        //let linkAjustado = { numeroProcesso: ajustes.mascaraNumero(link.numeroProcesso), data: ajustes.ajustaData(link.data), movimentacao: link.movimentacao, link: link.link };
        links.push(link)
        await sleep(2000);
      }
      // entra na terceira forma de apresentação de documentos.
      // documentos multiplus.
      for (let j = 0; j < (await iniciaisMultiplas).length; j++) {
        await sleep(timerSleep)
        let dataEProcesso = await this.page.evaluate(async (j, iniciaisMultiplas) => {
          return {
            data: document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-label > ion-text > h4`).innerText,
            numeroProcesso: document.querySelector("#numeroProcessoFormatado > div").innerText
          }
        }, j, iniciaisMultiplas)
        await sleep(timerSleep)
        await sleep(timerSleep)
        // entra no documento multiplo
        await this.page.click(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-icon`)
        await this.page.click(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${iniciaisMultiplas[j]}) > ion-icon`)
        await sleep(timerSleep)
        // conta quantos documentos devo raspar
        let quantidadeDocumentos = await this.page.evaluate(async () => {
          return document.querySelectorAll('#popover-marcador-filtro > ion-item').length;
        })
        for (let k = 1; k < quantidadeDocumentos + 1; k++) {
          await sleep(1500)
          // abro o popup e abro o link do documento
          await this.page.click(`#popover-marcador-filtro > ion-item:nth-child(${k})> span`)
          await sleep(1000)
          let link = await this.page.evaluate(async (k, dataEProcesso) => {
            await new Promise(function (resolve) { setTimeout(resolve, 1000); });

            let link = document.querySelector("#linkPDF").href;
            let movimentacao = document.querySelector(`#popover-marcador-filtro > ion-item:nth-child(${k}) > span`).innerText.replace("\n", " ");
            let data = dataEProcesso.data;
            let numeroProcesso = dataEProcesso.numeroProcesso;
            let tipo = "PDF"
            // console.log({ numeroProcesso, data, movimentacao, link, tipo })
            return { numeroProcesso, data, movimentacao, link, tipo }
            // passar as variaveis como argumento ao fim do codigo faz com que elas sejam passada coretamente para dentro do navegador
          }, k, dataEProcesso);
          // codigo que fecha a ultima aba do puppeteer.
          // com esse codigo consigo fechar os popup
          let pages = await this.browser.pages();
          while (pages.length == 2) {
            await sleep(timerSleep)
            // await console.log(pages.length)
            // await console.log("Aguarde mais um pouco")
            pages = await this.browser.pages();
          }
          // console.log(pages.length)
          const popup = pages[pages.length - 1];
          await popup.close();
          await sleep(timerSleep)
          links.push(link)
        }
        // volta a pagina principal de busca de processos
        await sleep(timerSleep)
        await sleep(timerSleep)
        await sleep(timerSleep)
        await sleep(3000)
        await this.page.click("#menu-content > ng-component:nth-child(3) > app-toolbar > ion-header > ion-toolbar > ion-buttons:nth-child(1) > ion-back-button")
        await sleep(timerSleep)
      }
      // console.log(links);
      return links
    } catch (e) { console.log("Não pegou os Documentos"); console.log(e); }
  }

  // busca os numeros dos filhos da lista de movimentacoes que possuem:  documentos anexos e estão antes da petição inicial
  // dessa forma pego apenas os anexos das iníciais.
  async numerosIniciaisLaco() {
    let numeros = await this.page.evaluate(async () => {
      let numero = document.querySelectorAll('ion-item ion-label').length;
      let numero2 = [];
      let numero3 = [];
      for (let i = 1; i < numero; i++) {
        if (document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-label > div > p`)) {
          // busca o texto dos movimentos
          let buscaInicio = document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-label > div > p`).innerText;
          let inicioTexto = "Distribuído por sorteio";
          let inicioTexto2 = "Distribuído por dependência";
          // se o texto for distribuido para sorteio sei que é uma inicial e que devo iniciar a minha busca por documentos
          if (buscaInicio == inicioTexto || buscaInicio == inicioTexto2) { numero2.push(i) };
        }

        // só inicia a busca por iniciais depois de achar o primeiro movimento
        if (numero2[0] < i) {
          let movimentacao = document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-label > div > p`).innerText;
          // regex que verifica o seguinte: 94ac08d ]
          // assim só obtenhos os anexos simples
          if (!!movimentacao.match(/\[\s[a-z0-9]{7}\s\]/gmi)) {
            // verifica se possui icone para clicar assim sei que possuo anexo
            if (document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-icon`)) {
              numero2.push(i)
            };
          } else {
            let iconeMovimentacao = document.querySelector(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(${i}) > ion-icon`);
            if (!!iconeMovimentacao) {
              numero3.push(i)
            }
          }


        }

      };
      numero2 = numero2.slice(1, numero2.length)
      return { numero2, numero3 }
    })
    return numeros
  };


  async pegaDespacho() {

  }

  processaNumero(numero) {
    let numeroProcesso = numero.trim().slice(0, 7);
    let ano = numero.trim().slice(9, 13);
    let vara = numero.trim().slice(numero.length - 4, numero.length);
    let estado = numero.trim().slice(numero.length - 6, numero.length - 4);
    estado = parseInt(estado)
    return { numeroProcesso, ano, vara, estado }
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

  async finalizar() {
    //   const puppeteerPid = this.browser.process().pid;
    //   this.logger.info('Finalizando Puppeteer');
    //   await this.browser
    //     .close()
    //     .then(() => {
    //       process.kill(puppeteerPid);
    //     })
    //     .catch(() => {});
    //   this.logger.info('Puppeteer finalizado');
  }
}


function escolheEstado(numero) {
  let resultado;
  numero = numero.slice(numero.length - 6, numero.length - 4)
  // if (numero == 01) resultado = 2     // Rio de Janeiro
  // if (numero == 02) resultado = 03    // São Paulo
  // if (numero == 03) resultado = 4    // Minas Gerais
  // if (numero == 04) resultado = 5    // Bahia
  // if (numero == 05) resultado = 6    //
  // if (numero == 06) resultado = 7    
  // if (numero == 09) resultado = 10

  // if (numero == 15) resultado = 16    // São Paulo
  // if (numero == 21) resultado = 22    // Rio Grande do Norte

  // substitui o código acima
  return parseInt(numero) + 1;
}
function processaNumero(numero) {
  let numeroProcesso = numero.trim().slice(0, 7);
  let ano = numero.trim().slice(9, 13);
  let vara = numero.trim().slice(numero.length - 4, numero.length);
  return {
    numeroprocesso: numeroProcesso,
    ano: ano,
    vara: vara
  }
}
// (async () => {
//   let puppet = new RoboPuppeteer3()

//   await puppet.iniciar()

//   await sleep(1000)
//   await puppet.acessar("https://jte.csjt.jus.br/")
//   await sleep(1000)
//   await puppet.preencheTribunal('00002954820205050462')
//   await sleep(2000)
//   await puppet.loga()
//   await sleep(1000)
//   await puppet.preencheProcesso("00002954820205050462", 0)
//   await sleep(1000)
//   await puppet.pegaInicial()
// })()

module.exports.RoboPuppeteer3 = RoboPuppeteer3;
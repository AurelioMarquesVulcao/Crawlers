const puppeteer = require('puppeteer');
const sleep = require('await-sleep')
require("dotenv/config");

var timerSleep = 100

class RoboPuppeteer3 {


  async iniciar() {
    // para abrir o navegador use o headless: false
    this.browser = await puppeteer.launch({
      headless: true,
      slowMo: 1,
      ignoreHTTPSErrors: true,
      // args: ['--ignore-certificate-errors', '--no-sandbox', '--proxy-server=socks4://96.9.77.192:55796']
      // args: ['--ignore-certificate-errors', '--no-sandbox', '--proxy-server=http://proxy-proadv.7lan.net:8181']      
      //args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu', '--proxy-server=http://proxy-proadv.7lan.net:8181']
      //args: [process.env.ARGS_PUPPETTER_CONECTION]
      args: ['--ignore-certificate-errors']
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
        timeout: 30000,
        // waitUntil: 'networkidle2'
      });
      // isso me da o url completo
      //content = await this.page.content();
    } catch (e) {
      console.log(e);
      process.exit();
    }
    console.log(`Tentando carretagar a url => ${url}`);
    return content;
  }



  async preencheTribunal(numero) {
    // await console.log(`foi escolhido o estado numero ${escolheEstado(numero)}`);
    await console.log(`info: JTE - CNJ: ${numero} - Puppeteer carregou a url => https://jte.csjt.jus.br/`);
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
    await console.log("Logado ao tribunal desejado");

  }


  async preencheProcesso(numero, contador) {

    let entrada = processaNumero(numero)
    //await console.log("leu a entrada: " + entrada.numeroprocesso);
    await console.log("O contador de processo esta em: " + contador);


    //await this.page.click('#consultaProcessual')
    await sleep(timerSleep)
    // console.log('wait 600');

    // console.log(!! await this.page.waitFor('#campoNumeroProcesso'));

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
    await this.page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button')
    console.log(`Processo ${numero} foi preenchido com sucesso, obtendo dados.`);

    //await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
    await sleep(timerSleep)
    return await this.pegaHtml(contador, numero)
  }


  async pegaHtml(contador, numero) {
    //const contador = 0
    await sleep(timerSleep)
    await this.page.waitFor('#listaProcessoEncontrado > mat-tab-group > div')
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
      let text = await document.querySelector('body').innerHTML;
      return text
    })

    //let html1 = await this.page.content();

    await sleep(timerSleep)
    await console.log(`info: JTE - CNJ: ${numero} - html da capa do processo extraido do Puppeteer`);
    const divButon = '#listaProcessoEncontrado > mat-tab-group > mat-tab-header > div.mat-tab-label-container > div > div'
    await sleep(timerSleep)
    await this.page.click(`#mat-tab-label-${contador}-1`)
    await sleep(timerSleep)
    await this.page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col')
    await sleep(timerSleep)

    let html2 = await this.page.evaluate(async () => {
      let text = await document.querySelector('body').innerHTML;
      return text
    })


    //let html2 = await this.page.content();

    await console.log(`info: JTE - CNJ: ${numero} - html dos andamentos extraido do Puppeteer`);
    return { geral: html1, andamentos: html2 }
  }

  async pegaAudiencia() {
    // #mat-tab-content-0-0 > div > detalhes-aba-geral > div > mat-accordion > mat-expansion-panel
    // click para pegar o assunto
    await this.page.click(`mat-expansion-panel`)
    // click para pegar audiencias
    // #mat-expansion-panel-header-1 > span.mat-content > mat-panel-description

    await this.page.click(`#mat-expansion-panel-header-1 > span.mat-content > mat-panel-description`)
    await sleep(timerSleep)
    await sleep(2000)
    //await this.page.waitFor(`ion-item:nth-child(1)`)
    // click dos documentos
    //#cdk-accordion-child-2 > div > ion-list > ion-item:nth-child(1)
    //#cdk-accordion-child-2 > div > ion-list > ion-item:nth-child(2)
    //#cdk-accordion-child-2 > div > ion-list > ion-item:nth-child(2)
    await this.page.click(`#cdk-accordion-child-1 > div > ion-list > ion-item:nth-child(1) > div`)
    await sleep(2000)
    let html9 = await this.page.evaluate(async () => {
      let text = await document.querySelector('#menu-content > detalhe-documento > ion-content').innerText;
      return text
    })
    await console.log(html9);
    await sleep(timerSleep)

    await sleep(2000)
    await this.page.click(`#menu-content > detalhe-documento > app-toolbar > ion-header > ion-toolbar > ion-buttons:nth-child(1) > ion-back-button > button`)

    await sleep(timerSleep)
    //await page.pdf({ path: 'app', format: 'A4' });

  }

  async pegaDespacho() {
    // #divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item.ng-star-inserted.item.md.ion-focusable.item-label.hydrated.active > ion-icon

    // #divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item.ng-star-inserted.item.md.ion-focusable.item-label.hydrated.active
    // #divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(6)


    // #divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div


    await sleep(timerSleep)
    await this.page.click(`#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-movimentos.ng-star-inserted.md.hydrated > ion-item:nth-child(11)`)
    await sleep(1000)
    let html8 = await this.page.evaluate(async () => {
      let text = await document.querySelector('#divMovBrowser1 > ion-grid > ion-row > ion-col.coluna-documento.ng-star-inserted.md.hydrated > div').innerText;
      return text
    });
    await console.log(html8)



  }


  async fechar() {
    await this.browser.close()


  }
}


function escolheEstado(numero) {
  let resultado;
  numero = numero.slice(numero.length - 6, numero.length - 4)
  if (numero == 01) resultado = 2     // Rio de Janeiro
  if (numero == 02) resultado = 03    // São Paulo
  if (numero == 21) resultado = 22    // Rio Grande do Norte
  if (numero == 15) resultado = 16    // São Paulo
  if (numero == 03) resultado = 4    // Minas Gerais
  if (numero == 05) resultado = 6    // Bahia
  return resultado
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

//   //await sleep(10000)
//   await puppet.acessar("https://jte.csjt.jus.br/")
//   await puppet.preencheTribunal('00002225820175050017')
//   await sleep(1000)
//   await puppet.preencheProcesso("00002225820175050017", 0)
// })()
module.exports.RoboPuppeteer3 = RoboPuppeteer3;
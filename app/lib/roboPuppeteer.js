const puppeteer = require('puppeteer');
const sleep = require('await-sleep')

var timerSleep = 30

class RoboPuppeteer3 {
  async iniciar() {
    // para abrir o navegador use o headless: false
    this.browser = await puppeteer.launch({
      headless: true,
      slowMo: 1,
      ignoreHTTPSErrors: true,
      //args: ['--ignore-certificate-errors', '--no-sandbox']
      args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu', '--proxy-server=http://proxy-proadv.7lan.net:8181']
      //args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu']
    });
    this.page = await this.browser.newPage();
    this.acessar('https://www.google.com/');
    console.log('O Puppeteer foi Iniciado corretamente');
  }

  async acessar(url) {
    let content;
    try {
      await this.page.goto(url, {
        waitUntil: "load",
        timeout: 0,
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
    await sleep(1200)
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
    await sleep(timerSleep)
    
    let html1 = await this.page.evaluate(async () => {
      let text = await document.querySelector('html').innerHTML;
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
      let text = await document.querySelector('html').innerHTML;
      return text
    })
    
    //let html2 = await this.page.content();
    
    await console.log(`info: JTE - CNJ: ${numero} - html dos andamentos extraido do Puppeteer`);
    return { geral: html1, andamentos: html2 }
  }


  async fechar() {
    await this.browser.close();
  }
}


function escolheEstado(numero) {
  let resultado;
  numero = numero.slice(numero.length - 6, numero.length - 4)
  if (numero == 01) resultado = 2     // Rio de Janeiro
  if (numero == 02 || numero == 05) resultado = 03    // São Paulo
  if (numero == 21) resultado = 22    // Rio Grande do Norte
  if (numero == 15) resultado = 16    // São Paulo
  if (numero == 03) resultado = 4    // São Paulo
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
module.exports.RoboPuppeteer3 = RoboPuppeteer3;
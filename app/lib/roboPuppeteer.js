const puppeteer = require('puppeteer');


const processaNumero2 = (numero) => {
    let numeroProcesso = numero.trim().slice(0, 7);
    let ano = numero.trim().slice(9, 13);
    let vara = numero.trim().slice(numero.length - 4, numero.length);
    return {
        numeroprocesso: numeroProcesso,
        ano: ano,
        vara: vara
    }
}
const escolheEstado = (numero) => {
    let resultado;
    numero = numero.slice(numero.length-6, numero.length-4)
    if (numero == 01) resultado = 2     // Rio de Janeiro
    if (numero == 02 || numero == 05) resultado = 03    // São Paulo
    return resultado
}

const roboVersao1 = async (numero) => {
    console.time('robo-1')
    entrada = processaNumero2(numero)
    console.log(entrada);

    const slow = numeroAleatorio(200, 350);
    const delay = numeroAleatorio(10, 40);
    // console.log('delay é : ' + delay);
    // console.log('slowMo é : ' + slow);

    // para abrir o navegador use o headless: false
    var browser = await puppeteer.launch({
        headless: false, slowMo: slow,
        ignoreHTTPSErrors: true,
        //executablePath: '/usr/bin/chromium-browser',
        args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu']
        //args: ['--ignore-certificate-errors', '--disable-gpu']
    });
    console.log('ligou puppeteer');
    

    var page = await browser.newPage();

    let preencheTribunal = async () => {
        // deixa a pagina menor a fim de economizar memoria
        await page.goto('https://jte.csjt.jus.br/', {waitUntil: 'networkidle2'})
        // await page.goto('https://jte.csjt.jus.br/')
        // await page.setViewport({ width: 600, height: 8000 })
        console.log('entrou na pagina puppeteer');
        // para esperar carregar o elemento onde fica o tribunal
        // await page.waitFor(50)
        //console.log(!! await page.waitFor('mat-form-field'));
        await page.waitFor(900)
        await page.waitFor('mat-form-field');
        // espera pelo botão do tribunal, é importante!
        await page.waitFor(900)
        await page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper', { slowMo: slow })
        // clica na pesquisa por tribunal
        await page.waitFor(900)
        await page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper', { slowMo: slow })
        // aqui que escolho o tribunal de 0 a 24 --- option-2 --- está marcado opcao 2 -- rio
        await page.waitFor(900)
        await page.click(`#mat-option-${escolheEstado(numero)}`, { slowMo: slow })
        // clica no confirmar - esse seletor pode quebrar ficar atento
        await page.click('ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span')
        // aqui a pagia faz uma requisicao ao tribunal -- costuma quebrar aqui.
        // vou setar um await e restart aqui.
        await page.waitFor(900)
        // await page.waitFor('#consultaProcessual')
        await page.click('#consultaProcessual')
    }
    // faz novas tentativas até conseguir logar no tribunal
    let logaTribunal = async () => {
        try {
            await preencheTribunal()
        } catch (e) { // console.log(e); 
            await browser.close()
            // await page.close()
            // await page.newPage()
        }
    }
    await logaTribunal()
    let preencheProcesso = async () => {
        await page.waitFor(900)
        //await page.waitFor('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > div')
        // aqui inicio o preenchimento do processo
        await page.type('#campoNumeroProcesso', `${entrada.numeroprocesso}`, { delay: delay })
        await page.type('#campoAno', `${entrada.ano}`, { delay: delay })
        await page.type('#campoVara', `${entrada.vara}`, { delay: delay })
        await page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button', { delay: delay })
        // await page.waitFor('#listaProcessoEncontrado')
        await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
    }

    let buscaProcesso = async () => {
        try {
            await preencheProcesso()
        } catch (e) {
            // temporariameten estou entando infinitamente
            await preencheProcesso()
        }
    }
    await buscaProcesso()

    // aguardo o retorno se o processo existir
    // await page.waitFor('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row')
    // await page.waitFor('#listaProcessoEncontrado')
    await page.waitFor('#listaProcessoEncontrado > mat-tab-group > div')

    // await page.click('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row > ion-col:nth-child(2)')
    // await page.click('#mat-tab-label-0-0')
    await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
    // se o processo existir pego os dados gerais.
    let html1 = await page.evaluate(() => {
        // let text = document.querySelector('#mat-tab-content-0-0 > div > detalhes-aba-geral > div').innerText;
        let text = document.querySelector('html').innerHTML;
        return text
    })
    await console.log('processo ok');
    //await console.log(html1);
    // await page.click('#menu-content > detalhes-processo > ion-segment > ion-segment-button:nth-child(2)')
    await page.click('#mat-tab-label-0-1')
    await page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col')
    // pego os andamentos do processo
    let html2 = await page.evaluate(() => {
        // let text = document.querySelector('#divMovBrowser1').innerText
        let text = document.querySelector('html').innerHTML;
        return text
    })
    //await console.log(html2);
    await console.log('andamentos ok');
    // await page.close()
    await browser.close()
    console.timeEnd('robo-1')
    return { geral: html1, andamentos: html2 }
}

function numeroAleatorio(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
module.exports.RoboPuppeteer = roboVersao1
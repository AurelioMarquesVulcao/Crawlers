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
    numero = numero.slice(numero.length - 6, numero.length - 4)
    if (numero == 01) resultado = 2     // Rio de Janeiro
    if (numero == 02 || numero == 05) resultado = 03    // São Paulo
    if (numero == 21) resultado = 22    // Rio Grande do Norte
    if (numero == 15) resultado = 16    // São Paulo
    if (numero == 03) resultado = 4    // São Paulo
    return resultado
}

const roboVersao1 = async (numero) => {
    entrada = processaNumero2(numero)
    // console.log(entrada);
    const slow = numeroAleatorio(200, 350);
    const delay = numeroAleatorio(10, 40);

    // para abrir o navegador use o headless: false
    var browser = await puppeteer.launch({
        headless: true, slowMo: slow,
        ignoreHTTPSErrors: true,
        //executablePath: '/usr/bin/chromium-browser',
        args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu']
        // args para rodar localmente.
        //args: ['--ignore-certificate-errors', '--disable-gpu']
    });


    // se tirar isso travará a aplicacao
    await console.log(`info: JTE - CNJ: ${numero} - Puppeteer foi ativado`);


    var page = await browser.newPage();

    let preencheTribunal = async () => {
        // deixa a pagina menor a fim de economizar memoria
        await page.goto('https://jte.csjt.jus.br/', { waitUntil: 'networkidle2' })
        // await page.goto('https://jte.csjt.jus.br/')
        await page.setViewport({ width: 300, height: 300 })


        // se tirar isso travará a aplicacao
        // console.log('entrou na pagina puppeteer');
        await console.log(`info: JTE - CNJ: ${numero} - Puppeteer entrou na pagina => https://jte.csjt.jus.br/`);



        // para esperar carregar o elemento onde fica o tribunal
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
        // aqui a pagina faz uma requisicao ao tribunal -- atenção a possivel quebra
        // vou setar um await e restart aqui.
        await page.waitFor(900)
        // await page.waitFor('#consultaProcessual')
        await page.click('#consultaProcessual')
    }
    // faz novas tentativas até conseguir logar no tribunal
    let logaTribunal = async () => {
        try {
            await preencheTribunal()
        } catch (e) {
            console.log("\033[31m info: JTE - CNJ: " + numero + " - ERRO!!! NÃO FOI POSSIVEL ABRIR O TRIBUNAL");
            await browser.close()
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
            // temporariamente estou tentando infinitamente
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
    await console.log(`info: JTE - CNJ: ${numero} - html da capa do processo extraido do Puppeteer`);
    // await page.click('#menu-content > detalhes-processo > ion-segment > ion-segment-button:nth-child(2)')
    await page.click('#mat-tab-label-0-1')
    await page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col')
    // pego os andamentos do processo
    let html2 = await page.evaluate(() => {
        // let text = document.querySelector('#divMovBrowser1').innerText
        let text = document.querySelector('html').innerHTML;
        return text
    })
    await console.log(`info: JTE - CNJ: ${numero} - html dos andamentos extraido do Puppeteer`);
    // await page.close()
    await browser.close()
    return { geral: html1, andamentos: html2 }
}

function numeroAleatorio(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
module.exports.RoboPuppeteer = roboVersao1
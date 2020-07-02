const puppeteer = require('puppeteer');

// modelo de entrada de dados no robo.
const entrada = {
    numeroprocesso: '101091',
    ano: '2017',
    vara: '48'
}


const roboVersao1 = async () => {
    const slow = numeroAleatorio(200, 350);
    const delay = numeroAleatorio(50, 200)
    console.log('delay é : ' + delay);
    console.log('slowMo é : ' + slow);

    console.time('robo-1')
    const browser = await puppeteer.launch({
        headless: false, slowMo: slow
    });
    const page = await browser.newPage();
    await page.setViewport({
        width: 600,
        height: 1080
    })
    await page.goto('https://jte.csjt.jus.br/')
    // para deixar mais lento a busca
    const info = await page.evaluate(() => {
        return { title: document.title }
    })
    console.log(info)
    // para esperar carregar o elemento onde fica o tribunal
    await page.waitFor('mat-form-field', { delay: delay });
    // Clicar na pesquisa
    await page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper', { delay: delay })
    await page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper')
    await page.click('#mat-option-2', { delay: delay })
    await page.click('ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span')
    await page.waitFor('#consultaProcessual', { delay: delay })
    await page.click('#consultaProcessual', { delay: delay })
    await page.waitFor('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > div', { delay: delay })
    await page.type('#campoNumeroProcesso', '101091', { delay: delay })
    await page.type('#campoAno', `${entrada.ano}`, { delay: delay })
    await page.type('#campoVara', '48', { delay: delay })
    await page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button', { delay: delay })
    await page.waitFor('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row', { delay: delay })
    await page.click('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row > ion-col:nth-child(2)', { delay: delay })
    await page.waitFor('#detalhes-processo > div > detalhes-aba-geral > div > div.ng-star-inserted > div:nth-child(3) > div > div > div.item-painel-cabecalho', { delay: delay })
    let html = await page.evaluate(() => {
        let text = document.querySelector('#detalhes-processo > div > detalhes-aba-geral > div').innerText;
        return {
            text,
        }
    })
    await console.log(html);
    await page.click('#menu-content > detalhes-processo > ion-segment > ion-segment-button:nth-child(2)', { delay: delay })
    await page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col', { delay: delay })
    let html2 = await page.evaluate(() => {
        let text = document.querySelector('#detalhes-processo').innerText
        return {
            text,
        }
    })
    await console.log(html2);
    await browser.close()
    console.timeEnd('robo-1')
}
roboVersao1()


// funções complementares

// gera numero aleatório para preencher os campos os dados
function numeroAleatorio(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


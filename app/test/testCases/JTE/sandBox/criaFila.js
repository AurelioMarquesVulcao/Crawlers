const puppeteer = require('puppeteer');


const criaPost = () => {
let post = `{
	"ExecucaoConsultaId" : "${makeid()}",
	"ConsultaCadastradaId" : "${makeid()}",
	"DataEnfileiramento" : "2020-06-04T20:59:31.035Z",
	"NumeroProcesso" : null,
	"NumeroOab" : "10020581420175020088",
	"SeccionalOab" : "SP"
}`
return post
}

const roboVersao1 = async () => {
    console.time('robo-1')
    const slow = numeroAleatorio(5, 10);
    const delay = numeroAleatorio(1, 5);
    // para abrir o navegador use o headless: false
    var browser = await puppeteer.launch({
        headless: true, slowMo: slow,
        ignoreHTTPSErrors: true,
        args: ['--ignore-certificate-errors']
    });
    var page = await browser.newPage();

    await page.goto('http://0.0.0.0:15673/#/queues/%2F/oab.JTE.extracao.novos')
    await page.setViewport({ width: 1800, height: 92000 })

    await page.waitFor('#login > form > table > tbody > tr:nth-child(1) > td > input[type=text]');
    await page.type('#login > form > table > tbody > tr:nth-child(1) > td > input[type=text]', 'admin')
    await page.type('#login > form > table > tbody > tr:nth-child(2) > td > input[type=password]', 'crawler480')
    await page.click('#login > form > table > tbody > tr:nth-child(3) > td > input[type=submit]')
    
    await page.waitFor('#main > div:nth-child(5)')
    await page.click('#main > div:nth-child(5)')

    // colocar laço
    await page.type('#main > div.section-hidden.section-visible > div > form > table > tbody > tr:nth-child(5) > td > textarea', `${criaPost()}`)
    await page.click('#main > div.section-hidden.section-visible > div > form > input[type=submit]:nth-child(5)')
    console.log(criaPost());
    


    //await page.waitFor(900)
    await browser.close()





    //     await page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper', { slowMo: slow })
    //     // aqui que escolho o tribunal de 0 a 24 --- option-2 --- está marcado opcao 2 -- rio

    //     await page.click('#mat-option-3', { slowMo: slow })
    //     // clica no confirmar - esse seletor pode quebrar ficar atento
    //     await page.click('ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span')
    //     // aqui a pagia faz uma requisicao ao tribunal -- costuma quebrar aqui.
    //     // vou setar um await e restart aqui.

    //     await page.waitFor(900)
    //     // await page.waitFor('#consultaProcessual')
    //     await page.click('#consultaProcessual')

    // // faz novas tentativas até conseguir logar no tribunal

    //     await page.waitFor(900)
    //     await page.waitFor('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > div')
    //     // aqui inicio o preenchimento do processo
    //     await page.type('#campoNumeroProcesso', `${entrada.numeroprocesso}`, { delay: delay })
    //     await page.type('#campoAno', `${entrada.ano}`, { delay: delay })
    //     await page.type('#campoVara', `${entrada.vara}`, { delay: delay })
    //     await page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button', { delay: delay })
    //     //await page.waitFor('#listaProcessoEncontrado')
    //     await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')




    // // aguardo o retorno se o processo existir
    // // await page.waitFor('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row')
    // // await page.waitFor('#listaProcessoEncontrado')
    // await page.waitFor('#listaProcessoEncontrado > mat-tab-group > div')

    // // await page.click('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row > ion-col:nth-child(2)')
    // //await page.click('#mat-tab-label-0-0')
    // await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
    // // se o processo existir pego os dados gerais.
    // let html1 = await page.evaluate(() => {
    //     // let text = document.querySelector('#mat-tab-content-0-0 > div > detalhes-aba-geral > div').innerText;
    //     let text = document.querySelector('html').innerHTML;
    //     return { text, }
    // })
    // await console.log('processo ok');
    // await console.log(html1);
    // //await page.click('#menu-content > detalhes-processo > ion-segment > ion-segment-button:nth-child(2)')
    // await page.click('#mat-tab-label-0-1')
    // await page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col')
    // // pego os andamentos do processo
    // let html2 = await page.evaluate(() => {
    //     // let text = document.querySelector('#divMovBrowser1').innerText
    //     let text = document.querySelector('html').innerHTML;
    //     return { text, }
    // })
    // await console.log(html2);
    // await console.log('andamentos ok');

    // //await page.close()
    // await browser.close()

    // console.timeEnd('robo-1')
    // // return { geral: html1, andamentos: html2 }

    // // em caso de erro tem que fechar e reiniciar
    // //await page.close()
    // //await browser.close()

}
roboVersao1()




// gera numero aleatório para preencher os campos os dados
function numeroAleatorio(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// gera id aleatorio não unico
function makeid() {
    let text = "5ed9";
    let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    let letra = "abcdefghijklmnopqrstuvwxyz";
    let numero = "0123456789";

    for (var i = 0; i < 20; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

console.log(makeid());
//module.exports.RoboPuppeteer = roboVersao1
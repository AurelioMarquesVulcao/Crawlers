const puppeteer = require('puppeteer');
const fs = require('fs');


const roboVersao1 = async (numero) => {
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
    await page.type('#main > div.section-hidden.section-visible > div > form > table > tbody > tr:nth-child(5) > td > textarea', `${criaPost(numero)}`)
    await page.click('#main > div.section-hidden.section-visible > div > form > input[type=submit]:nth-child(5)')
    //console.log(criaPost(numero));

    //await page.waitFor(900)
    await browser.close()
}
const processos = [
    "10014783320185020028",
    "10005288720195020028",
    "10006336420195020028",
    "10012121220195020028",
    "10006085120195020028",
    "10008882220195020028",
    "10011982820195020028",
    "10010553920195020028",
    "10010727520195020028",
    "10011619820195020028",
    "00000053120155020029",
    "00000787120135020029",
    "10013602020195020029",
    "10013585020195020029",
    "10013905520195020029",
    "10013731920195020029",
    "10013966220195020029",
    "10008885320185020029",
    "10009347620175020029",
    "10010135520175020029",
    "01461001120075020029",
    "00018344720155020029",
    "00009230620135020029",
    "10003045420165020029",
    "10005591220165020029",
    "10021922420175020029",
    "10020120520175020030",
    "10004944620185020029",
    "10016114320165020029",
    "10005337720175020029",
    "10009202420195020029",
    "10008951120195020029",
    "10013758620195020029",
    "10013853320195020029",
    "10020072020165020029",
    "10010739120185020029",
    "10015658320185020029",
    "10014783020185020029",
    "10000740720195020029",
    "10009725420185020029",
    "10009494220175020030",
    "00022695720115020030",
    "10004332220175020030",
    "00012285020145020030",
    "10006096420185020030",
    "00921007319985020030",
    "00016959220155020030",
    "10011368420165020030",
    "00032037820125020030"
]

const post = async () => {
    for (let i = 0; i < processos.length; i++) {
        await roboVersao1(processos[i])
        await console.log('processo : ' + processos[i] + ' adicionado');

    }
}
post()


function criaPost(numero) {
    let post = `{
        "ExecucaoConsultaId" : "${makeid()}",
        "ConsultaCadastradaId" : "${makeid()}",
        "DataEnfileiramento" : "${new Date}",
        "NumeroProcesso" : null,
        "NumeroOab" : "${numero}",        "SeccionalOab" : "SP"
    }`
    return post
}

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

// console.log(makeid());
//module.exports.RoboPuppeteer = roboVersao1
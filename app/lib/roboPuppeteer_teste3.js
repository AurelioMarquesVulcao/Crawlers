const puppeteer = require('puppeteer');


class RoboPuppeteer3 {
    async iniciar() {
        // para abrir o navegador use o headless: false
        this.browser = await puppeteer.launch({
            headless: false,
            slowMo: 60,
            ignoreHTTPSErrors: true,
            args: ['--ignore-certificate-errors']
            // args: ['--ignore-certificate-errors', '--no-sandbox', '--headless', '--disable-gpu']
        });
        this.page = await this.browser.newPage();
        this.acessar('http://www.google.com', { waitUntil: 'networkidle2' });
        //var contador = 0
        console.log('ligou o Puppertter-3');
    }

    async acessar(url) {
        let content;
        try {
            //console.log(params);
            await this.page.goto(url, {
                waitUntil: "load",
                timeout: 0,
                waitUntil: 'networkidle2'
            });
            // isso me da o url completo
            //content = await this.page.content();
            // provisório
            content = true


        } catch (e) {
            console.log(e);
            process.exit();
        }
        console.log(`Tentou ir para a pagina ${url}`);
        return content;
    }

    async preencheTribunal(numero) {
        console.log(`foi escolhido o estado numero ${escolheEstado(numero)}`);

        await console.log(`info: JTE - CNJ: ${numero} - Puppeteer entrou na pagina => https://jte.csjt.jus.br/`);
        // para esperar carregar o elemento onde fica o tribunal
        await this.page.waitFor(900)
        await this.page.waitFor('mat-form-field');
        await this.page.waitFor(900)
        await this.page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper')
        await this.page.waitFor(900)
        await this.page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper')
        await this.page.waitFor(900)
        await this.page.click(`#mat-option-${escolheEstado(numero)}`)
        await this.page.click('ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span')
        await this.page.waitFor(1200)
        await this.page.waitFor('#consultaProcessual')
        await this.page.click('#consultaProcessual')
        console.log("tribunal preenchido");

    }


    async preencheProcesso(numero, contador) {
        let entrada = processaNumero(numero)
        console.log("leu a entrada: " + entrada.numeroprocesso);

        //await this.page.click('#consultaProcessual')
        await this.page.waitFor(600)
        await this.page.waitFor('#campoNumeroProcesso')
        // const input1 = await this.page.$('#campoNumeroProcesso');
        await this.page.click('#campoNumeroProcesso', { clickCount: 3 })
        await this.page.type('#campoNumeroProcesso', `${entrada.numeroprocesso}`)

        const input2 = await this.page.$('#campoAno');
        await input2.click({ clickCount: 3 })

        await this.page.type('#campoAno', `${entrada.ano}`)

        const input3 = await this.page.$('#campoVara');
        await input3.click({ clickCount: 3 })

        await this.page.type('#campoVara', `${entrada.vara}`)
        await this.page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button')
        console.log("preencheu processo");

        //await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
        return await this.pegaHtml(contador, numero)
    }


    async pegaHtml(contador, numero) {
        //const contador = 0

        await this.page.waitFor('#listaProcessoEncontrado > mat-tab-group > div')

        console.log(contador);

        await this.page.waitFor(`#mat-tab-content-${contador}-0 > div > detalhes-aba-geral > div`)
        // se o processo existir pego os dados gerais.
        let html1 = await this.page.evaluate(() => {

            let text = document.querySelector('html').innerHTML;
            return text
        })
        await console.log(`info: JTE - CNJ: ${numero} - html da capa do processo extraido do Puppeteer`);

        const divButon = '#listaProcessoEncontrado > mat-tab-group > mat-tab-header > div.mat-tab-label-container > div > div'
        // #listaProcessoEncontrado > mat-tab-group > mat-tab-header
        await this.page.click(`#mat-tab-label-${contador}-1`)
        //await page.click(divButon)[0].children[1]
        await this.page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col')
        // pego os andamentos do processo
        let html2 = await this.page.evaluate(() => {

            let text = document.querySelector('html').innerHTML;
            return text
        })
        await console.log(`info: JTE - CNJ: ${numero} - html dos andamentos extraido do Puppeteer`);
        // await page.close()
        //await browser.close()
        //contador ++
        return { geral: html1, andamentos: html2 }
    }


    async fechar() {
        await this.browser.close();
    }
}



(async () => {
    let puppet = new RoboPuppeteer3();
    await puppet.iniciar()
    let content = await puppet.acessar('http://jte.csjt.jus.br/');

    await puppet.preencheTribunal("00002870320145150107")

    const processosMG = ["00106981920175150134",
        "00109663320175150115",
        "00002870320145150107",
        "00104016120185150074",
        "00112776420165150113",
        "00119648120175150056",
        "00113178620165150132",
        "00113300320165150030",
        "00100520320155150094",
        "00100960920165150087",
        "00105528020165150079",
        "00105618720175150085",
        "00101236820175150018",
        "00104975420165150007",
        "00106981920175150134",
        "00109511920175150130",
        "00110012620175150007",
        "00114699320155150060",
        "00104907920155150045",
        "00104943920175150145",
        "00126096020165150018",
        "00132353920165150096",
        "00128307720165150039",
        "00107701520175150131",
        "00100210520185150085",
        "00120465420155150001",
        "00106823920185150099",
        "00118381120155150053",
        "00131724520155150097",
        "00103444020165150130",
        "00100358420175150097",
        "00100432820185150032",
        "00100086120185150099",
        "00125888120175150137",
        "00102632820145150012",
        "00102674520165150093",
        "00105980820165150067",
        "00102769720185150105",
        "00106060920165150059",
        "00015382520135150064",
        "00113827220145150093",
        "00118299520175150015",
        "00123039320165150082",
        "00102852220185150085",
        "00106184620175150137",
        "00104611620155150017",
        "00104756020175150039",
        "00102981920185150118",
        "00127213220165150017",
        "00110148120155150108",
        "00105554520175150129",
        "00127450220175150025",
        "00110152320175150035",
        "00110269420165150097",
        "00110554820175150053",
        "00120552220155150096",
        "00117218720175150105",
        "00102242820165150152",
        "00133817120165150002",
        "00110303120155150077",
        "00110844920175150134",
        "00115135820165150099",
        "00110592020175150010",
        "00125295020155150077",
        "00127495820155150009",
        "00106401520175150102",
        "00127675620165150070",
        "00106405520185150045",
        "00106471920175150001",
        "00107747720165150134",
        "00106457420175150122",
        "00113574220155150152",
        "00114384720165150122",
        "00106466020185150078",
        "00112569720185150152",
        "00106467220175150053",
        "00115935720165150152",
        "00100021320185150145",
        "00128272520165150039",
        "00120100320165150122",
        "00102651620165150145",
        "00126083620155150010",
        "00103911320185150043",
        "00114974720165150021",
        "00128584520165150039",
        "00103298620175150146",
        "00109390920155150022",
        "00131929320165150099",
        "00104084020175150122",
        "00128722920165150039",
        "00119241520145150021",
        "00116759020165150022",
        "00116552020175150134",
        "00118516020165150122",
        "00124864120165150025",
        "00107811620185150032",
        "00118134020165150060",
        "00100685420185150060",
        "00133092620175150010"]
    console.time('time de 100')
    for (i in processosMG) {
        let resultado = await puppet.preencheProcesso(processosMG[i], i)
        console.log(resultado);

    }
    console.timeEnd('time de 100')




    // await puppet.fechar();
})();

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
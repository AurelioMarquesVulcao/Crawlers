const puppeteer = require('puppeteer');

const roboVersao1 = async()=>{
    console.time('robo-1')
    const browser = await puppeteer.launch({
        headless:false, slowMo: 250
    });
    const page = await browser.newPage();
    await page.setViewport({
        width:600,
        height:1080
    })
    await page.goto('https://jte.csjt.jus.br/')
    // para deixar mais lento a busca
    const info = await page.evaluate(()=>{
        return {title: document.title }
    })
    console.log(info)
    // para esperar carregar o elemento onde fica o tribunal
    await page.waitFor('mat-form-field',{delay:2600});
    // Clicar na pesquisa
    await page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper',{delay:600})
    await page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper')
    
    await page.click('#mat-option-2',{delay:600})
    
    await page.click('ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span')
    

    await page.waitFor('#consultaProcessual',{delay:500})
    await page.click('#consultaProcessual',{delay:700})
    await page.waitFor('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > div',{delay:600})
    await page.type('#campoNumeroProcesso','101091',{delay:200})
    await page.type('#campoAno','2017',{delay:400})
    await page.type('#campoVara','48',{delay:300})
    await page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button',{delay:100})
    await page.waitFor('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row',{delay:600})
    await page.click('#listaProcessoEncontrado > resumo-processo > ion-grid > ion-row > ion-col:nth-child(2)',{delay:100})
    await page.waitFor('#detalhes-processo > div > detalhes-aba-geral > div > div.ng-star-inserted > div:nth-child(3) > div > div > div.item-painel-cabecalho',{delay:200})

    let html = await page.evaluate(()=>{
        let text = document.querySelector('#detalhes-processo > div > detalhes-aba-geral > div').innerText;
        
        return{
            text,
        }
    })

    await console.log(html);
    await page.click('#menu-content > detalhes-processo > ion-segment > ion-segment-button:nth-child(2)',{delay:100})
    await page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col',{delay:2600})
    

    let html2 = await page.evaluate(()=>{
        let text = document.querySelector('#detalhes-processo').innerText
        
        return{
            text,
        }
    })

    await console.log(html2);
    
    
    await browser.close()
    console.timeEnd('robo-1')
}
roboVersao1()
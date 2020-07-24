const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const fs = require('fs');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');


(async () => {
    const fila = new CriaFilaJTE()
    // let varaTrabalho = await fila.filtraTrunal()
    // for (let i = 0; i < varaTrabalho.length; i++) {
    //     console.log(varaTrabalho[i]);

    // }
    // verifica banco!!!
    await console.log(await fila.filtraTrunal());

    // chuta Numeros!!!
    // await fila.procura(11000,0002,100)
    //await fila.procura(11000,0003,100)
    //await fila.procura(10900, 0004, 550)
    // await fila.procura(10500,0005,500)
    // await fila.procura(10700,0006,200)
    // await fila.procura(10500,0006,200)
    await fila.procura(10500,0007,900)
    // await fila.procura(11000,0008,100)
    // await fila.procura(11000,0009,100)


    //await fila.salvaUltimo({ NumeroProcesso: "0010981-48.2020.5.15.0001", DataCadastro: "2020-07-21T19:45:45.000Z" })
    // await fila.enviaFila(await fila.buscaDb(1,0))
    //console.log(await fila.buscaDb(1, 0));

    //await fila.enviaFila()

    //console.log(fila.relogio());
    await sleep(1000)
    process.exit()

})();


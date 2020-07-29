const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');



(async () => {
    const fila = new CriaFilaJTE()

    // função de criação de busca
    let parametroBusca = {

    };
   //await fila.procura5(10554,"0113",2)

    var buscar = await fila.abreUltimo(parametroBusca);
    console.log(buscar.length);
    let mediaSequendial = [];
    let maiorSequencial = [];
    let menorSequencial = [];
    for (let i = 0; i < buscar.length; i++) {
        let sequencial = buscar[i].numeroProcesso.slice(0, 7);
        let numero = buscar[i].numeroProcesso
        let comarca = buscar[i].numeroProcesso.slice(16, 20);
        let dia = buscar[i].data.dia;
        let mes = buscar[i].data.mes;
        if (mes < 4 && mes > 2) {
            // console.log({ dia, mes, sequencial, comarca });
            if (sequencial == "0010550") {
                //console.log({ dia, mes, sequencial, comarca });
                //await fila.procura(10900, comarca, 1)
                //await fila.procura(10550,comarca,1)
                // await fila.procura(10600,comarca,1)

            }
        }
        if (comarca == "0113") {
            console.log({ dia, mes, sequencial, comarca });
        };

    };


    await sleep(5000)
    process.exit()

})();


async function insert0(n) {
    for (let i = 1; i < 10; i++) {
        await fila.procura5(10000 + n, `000${i}`, 5)
    }
}
async function insert1(n) {
    for (let i = 1; i < 100; i++) {
        await fila.procura5(10000 + n, `00${i}`, 5)
    }
}

async function insert2(n) {
    for (let i = 100; i < 164; i++) {
        await fila.procura5(10000 + n, `0${i}`, 5)
    }
}
//await insert2(300)
// await insert1(300)
//await insert0(300)
//await insert2(400)
// await insert1(400)
//await insert0(400)
// await insert2(100)
// await insert1(100)
//await insert0(100)

// await insert2(50)
// await insert1(50)
// await insert0(50)
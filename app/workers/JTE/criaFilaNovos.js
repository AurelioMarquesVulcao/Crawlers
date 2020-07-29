const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');



(async () => {
    const fila = new CriaFilaJTE()

    // função de criação de busca
    let parametroBusca = {
        "data.dia": 10
    };
    var buscar = await fila.abreUltimo(parametroBusca);

    // for (let i = 0; i < buscar.length; i++) {
    //     await console.log(buscar[i].numeroProcesso.slice(0, 7))
    //     await console.log(buscar[i].origem);
    // };












    // let varaTrabalho = await fila.filtraTrunal()
    // for (let i = 0; i < varaTrabalho.length; i++) {
    //     console.log(varaTrabalho[i]);

    // }
    // verifica banco!!!
    // let dados = await fila.filtraTrunal()
    // for (i in dados) await console.log(dados[i]);

    // let busca = await fila.abreUltimo(2)
    // await console.log(busca);
    //await fila.salvaUltimo(busca)

    // chuta Numeros!!!
    //await fila.procura(7000,0000,200)
    // await fila.procura(11000,0002,300)
    // await fila.procura(10500,0001,500)
    //await fila.procura(11000,0003,100)
    //await fila.procura(10900, 0004, 550)
    // await fila.procura(10500,0005,500)
    // await fila.procura(10700,0006,200)
    // await fila.procura(10500,0006,200)
    // await fila.procura(10500,0007,900)
    // await fila.procura(11000,0008,100)
    
    
    await fila.procura4(6200, "0000", 15)
    await fila.procura4(7200, "0000", 15)
    await fila.procura4(7300, "0000", 15)
    await fila.procura4(7500, "0000", 15)
    await fila.procura4(7700, "0000", 96)

    //await fila.procura(10500, "0052", 200)
    // await fila.procura(11026, "0009", 3)

    async function insert1(n) {
        for (let i = 1; i < 100; i++) {
            await fila.procura(10100+n, `00${i}`, 2)
        }
    }
    insert1(0)
    async function insert2(n) {
        for (let i = 100; i < 164; i++) {
            await fila.procura(10100+n, `00${i}`, 2)
        }
    }
    insert2(0)


    // 00110262820205150009

    //await fila.salvaUltimo({ NumeroProcesso: "0010981-48.2020.5.15.0001", DataCadastro: "2020-07-21T19:45:45.000Z" })
    // await fila.enviaFila(await fila.buscaDb(1,0))
    //console.log(await fila.buscaDb(1, 0));

    //await fila.enviaFila()

    // await fila.procura(10500, i, 600)


    // console.log(new Date(2020,6,20)<new Date());

    //console.log(fila.relogio());
    await sleep(5000)
    process.exit()

})();


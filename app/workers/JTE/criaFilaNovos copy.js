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
    var buscar = await fila.abreUltimo(parametroBusca);
    console.log(buscar.length);
    let mediaSequendial = [];
    let maiorSequencial = [];
    let menorSequencial = [];
    for (let i = 0; i < buscar.length; i++) {
        let sequencial = buscar[i].numeroProcesso.slice(0, 7);
        let comarca = buscar[i].numeroProcesso.slice(16, 20);
        let dia = buscar[i].data.dia;
        let mes = buscar[i].data.mes;
        if (mes < 4 && mes > 2) {
            // console.log({ dia, mes, sequencial, comarca });
            if (sequencial == "0010500") {
                console.log({ dia, mes, sequencial, comarca });
                //await fila.procura(10900, comarca, 1)
                await fila.procura(10550,comarca,1)
                await fila.procura(10600,comarca,1)

            }
        }
        if (comarca == "0110") {
            //console.log({ dia, mes, sequencial, comarca });
        };

    };













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


    // await fila.procura4(6200, "0000", 15)
    // await fila.procura4(7200, "0000", 15)
    // await fila.procura4(7300, "0000", 15)
    // await fila.procura4(7500, "0000", 15)
    // await fila.procura4(7700, "0000", 96)

    //await fila.procura(10500, "0052", 200)
    // await fila.procura(11026, "0009", 3)

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


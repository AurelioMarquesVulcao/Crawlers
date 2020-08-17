const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');

const fila = new CriaFilaJTE();

(async () => {

    let second = 0;
    let contaOrigem = 90;

    for (let w = 0; w < 1;) {
        second++
        let timer = fila.relogio();
        //console.log(timer.seg);
        // if (timer.min == 20 && timer.seg == 01 || timer.min == 47) {
        if ("a") {
            let relogio = fila.relogio();
            console.log(relogio);
            try {
                // string de busca no banco de dados
                let parametroBusca = { "tribunal": 15, "origem": contaOrigem };
                let buscar = await fila.abreUltimo(parametroBusca);
                console.log(buscar.length);
                let sequencial = maiorSequencial(buscar)
                let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
                console.log(numeroSequencial);
                let comarca = sequencial.numeroProcesso.slice(16, 20);
                // pegará os processos
                console.log("Estamos na comarca: " + contaOrigem);

                if (sequencial.data.dia < relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes <= relogio.mes - 1) {
                        await fila.procura10(numeroSequencial, comarca, 2, 15)
                    } else {
                        await fila.procura(numeroSequencial, comarca, 3, 15)
                    }

                    await sleep(500)
                };
                console.log(sequencial);
            } catch (e) {
                console.log(e);
                // await fila.procura5('0010500', `${contaOrigem}` ,2)
                // await fila.procura5('0010300', `${contaOrigem}` ,2)
                console.log("------------- A comarca :" + contaOrigem + ' falhou na busca------');
            }

            if (contaOrigem == 153) { contaOrigem = 0 } else { contaOrigem++ };
        };
        await sleep(5000)
    };



    await sleep(5000)
    process.exit()

})();


async function procuraUltimoProcesso(tribunal) {

    let relogio = fila.relogio();
    console.log(relogio);
    try {
        // string de busca no banco de dados
        let parametroBusca = { "origem": contaOrigem };
        let buscar = await fila.abreUltimo(parametroBusca);
        console.log(buscar.length);
        let sequencial = maiorSequencial(buscar)
        let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
        console.log(numeroSequencial);
        let comarca = sequencial.numeroProcesso.slice(16, 20);
        // pegará os processos
        console.log("Estamos na comarca: " + contaOrigem);

        if (sequencial.data.dia < relogio.dia && sequencial.data.mes <= relogio.mes) {
            if (sequencial.data.mes <= relogio.mes - 1) {
                await fila.procura10(numeroSequencial, comarca, 2, tribunal)
            } else {
                await fila.procura(numeroSequencial, comarca, 3, tribunal)
            }

            await sleep(500)
        };


        console.log(sequencial);
    } catch (e) {
        console.log(e);
        // await fila.procura5('0010500', `${contaOrigem}` ,2)
        // await fila.procura5('0010300', `${contaOrigem}` ,2)
        console.log("------------- A comarca :" + contaOrigem + ' falhou na busca------');
    }

    if (contaOrigem == 153) { contaOrigem = 0 } else { contaOrigem++ };
}







function maiorSequencial(obj) {
    let resultado=obj[0]
    let teste = parseInt(obj[0].numeroProcesso.slice(0, 7));
    //console.log(teste);
    console.log(obj[0].numeroProcesso);
    for (let i = 0; i < obj.length; i++) {
        let sequencial = parseInt(obj[i].numeroProcesso.slice(0, 7));
        //console.log(sequencial);
        if (sequencial > teste) {
            teste = sequencial
            resultado = obj[i]
        }
    };
    return resultado
}


async function insert0(n) {
    for (let i = 1; i < 10; i++) {
        await fila.procura5(10000 + n, `000${i}`, 5)
    }
}
async function insert1(n) {
    for (let i = 102; i < 103; i++) {
        await fila.procura5(10000 + n, `00${i}`, 15)
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
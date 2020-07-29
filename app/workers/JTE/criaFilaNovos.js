const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');

const fila = new CriaFilaJTE();

(async () => {
    let second = 0;
    let contaOrigem = 60;

    for (let w = 0; w < 1;) {
        second++
        // let relogio = fila.relogio();
        let relogio = fila.relogio();
        console.log(relogio);
        //if (relogio.min == 39 && relogio.seg == 30) {
        if ("a") {
            try {
                // string de busca no banco de dados
                let parametroBusca = { "origem": contaOrigem };
                let buscar = await fila.abreUltimo(parametroBusca);
                console.log(buscar.length);
                let sequencial = maiorSequencial(buscar)
                let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
                console.log(numeroSequencial);
                let comarca = sequencial.numeroProcesso.slice(16, 20);
                // isso que vai pegar os processos
                if (sequencial.data.dia < relogio.dia && sequencial.data.mes < relogio.mes) {
                    await fila.procura0(numeroSequencial, comarca, 10)
                    await sleep()
                }
                console.log(sequencial);
            } catch (e) { }








            if (contaOrigem == 163) { contaOrigem = 0 } else { contaOrigem++ };

        };
        await sleep(40000)
    };





    await sleep(5000)
    process.exit()

})();

function maiorSequencial(obj) {
    let resultado;
    let teste = obj[0].numeroProcesso.slice(0, 7);

    for (let i = 0; i < obj.length; i++) {
        let sequencial = obj[i].numeroProcesso.slice(0, 7);
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
    for (let i = 10; i < 100; i++) {
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
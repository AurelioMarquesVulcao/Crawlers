const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const fila = new CriaFilaJTE()

console.log('até aqui');

(async () => {
    var origem = [
        '0000', '0001', '0002', '0003',
        '0004', '0005', '0006', '0007',
        '0008', '0009', '0010', '0011',
        '0012', '0013', '0014', '0101',
        '0121', '0131', '0132', '0141',
        '0151', '0152', '0161', '0181',
        '0191'
      ]
    console.log('carregou a var');
    //console.log( await fila.filtraTrunal());
    //await fila.procura("0000282", `0000`, 5, "05")
    for (let i = 0; i < origem.length; i++) {
        await fila.procura("0000290", `${origem[i]}`, 1, "09")
        console.log(origem[i]);
        //await insert2(0, origem[i])
    }

})();


// async function insert0(n) {
//     for (let i = 0; i < 1; i++) {
//         await fila.procura(1000250, `${i}`, 2, "02")
//     }
//     await sleep(5000)
// }
// async function insert1(n) {
//     for (let i = 601; i < 615; i++) {
//         await fila.procura(0000050, `${i}`, 2, "02")
//     }
//     await sleep(5000)
// }



// async function insert2(n, origem) {
//     //console.log(origem);
//     origem = parseInt(origem)
//     console.log(origem);
//     for (let i = origem; i < origem + 1; i++) {
//         await fila.procura("0000140", `${i}`, 2, "05")
//     }
//     // await sleep(1000)
// }
// // await insert2(0,origem)
// //await insert1(0)
// //await insert0(0)


var processo;

 //localizaProcessos()
//console.log( fila.buscaDb(6000, 0));
async function localizaProcessos() {

    let dados = processo//await fila.buscaDb(6000, 0);
    let processosDesejados = [];
    let teste = [];
    for (i in dados) {
        let processos = processo[i];
        //console.log(processos);
        let origem = processos.slice(processos.length - 4, processos.length);
        let ano = processos.slice(processos.length - 11, processos.length - 7)
        let sequencial = processos.slice(0, 7)
        
        if (origem == "0898") {
            //console.log(processos);
        }
        let obj = [origem, sequencial, ano];
        //console.log(obj);
        //console.log((processosDesejados.indexOf(obj.origem)!= -1));
        // console.log(obj[0]);
        //console.log(teste.indexOf("oi"));
        teste.push(obj[0])
        if (processosDesejados.indexOf(obj[0]) == -1) {
            //console.log("passou aqui");
            //teste.push(obj[0])
            processosDesejados.push(teste[i])
        }

    }
    console.log(processosDesejados.sort().slice(0,500));
}

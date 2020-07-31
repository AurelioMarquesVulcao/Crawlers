const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const fila = new CriaFilaJTE()


async function localizaProcessos() {

    let dados = await fila.buscaDb(6000, 0);
    let processosDesejados = [];
    let teste = [];
    for (i in dados) {
        let processos = dados[i].NumeroProcesso;
        let origem = processos.slice(processos.length - 4, processos.length)
        let ano = processos.slice(processos.length - 11, processos.length - 7)
        let sequencial = processos.slice(0, 7)
        if (origem == "0898") {
            //console.log(processos);
        }
        let obj = [origem, sequencial, ano];
        //console.log(obj);
        //console.log((processosDesejados.indexOf(obj.origem)!= -1));
        if (teste.indexOf(obj[0]) == 0) {
            teste.push(obj[0])
            processosDesejados.push(obj)
        }

    }
    console.log(processosDesejados.sort());
}




    (async () => {
        var origem = [
            '0000', '0001', '0002', '0003', '0004', '0005', '0006',
            '0007', '0008', '0009', '0010', '0011', '0012', '0013',
            '0014', '0015', '0016', '0017', '0018', '0019', '0020',
            '0021', '0022', '0023', '0024', '0025', '0026', '0027',
            '0028', '0029', '0030', '0031', '0032', '0033', '0034',
            '0035', '0036', '0037', '0038', '0039', '0101', '0102',
            '0121', '0122', '0131', '0132', '0133', '0134', '0161',
            '0191', '0192', '0193', '0194', '0195', '0196', '0201',
            '0221', '0222', '0251', '0271', '0281', '0291', '0311',
            '0341', '0342', '0371', '0401', '0421', '0431', '0461',
            '0462', '0463', '0464', '0491', '0492', '0493', '0511',
            '0521', '0531', '0551', '0561', '0581', '0611', '0612',
            '0621', '0631', '0641', '0651', '0661'
        ]
        //console.log( await fila.filtraTrunal());
        await fila.procura("0000540", `0000`, 10, "05")
        for (let i = 0; i < origem.length; i++) {
            
            //await insert2(0, origem[i])
        }

    })()


async function insert0(n) {
    for (let i = 0; i < 1; i++) {
        await fila.procura(1000250, `${i}`, 2, "02")
    }
    await sleep(5000)
}
async function insert1(n) {
    for (let i = 601; i < 615; i++) {
        await fila.procura(0000050, `${i}`, 2, "02")
    }
    await sleep(5000)
}



async function insert2(n, origem) {
    //console.log(origem);
    origem = parseInt(origem)
    console.log(origem);
    for (let i = origem; i < origem + 1; i++) {
        await fila.procura("0000140", `${i}`, 2, "05")
    }
    // await sleep(1000)
}
// await insert2(0,origem)
//await insert1(0)
//await insert0(0)
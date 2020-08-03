const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');

const fila = new CriaFilaJTE();

(async () => {
    let second = 0;
    let origens = [
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
      
    let contaOrigem = 0;
    for (let w = 0; w < 1;) {
        second++
        let timer = fila.relogio();
        // if (timer.min == 20 && timer.seg == 01 || timer.min == 47) {
        if ("a") {
            let relogio = fila.relogio();
            try {
                // string de busca no banco de dados
                let parametroBusca = { "tribunal": 5, "origem": origens[contaOrigem] };
                console.log(origens[contaOrigem]);
                let buscar = await fila.abreUltimo(parametroBusca);
                console.log(buscar.length);
                //console.log(buscar);
                let sequencial = maiorSequencial(buscar)

                //console.log(sequencial);
                let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
                console.log(numeroSequencial);
                let comarca = sequencial.numeroProcesso.slice(16, 20);
                // isso que vai pegar os processos
                console.log("Estamos na comarca: " + origens[contaOrigem]);
                // console.log(sequencial.data.dia == relogio.dia);
                // console.log(sequencial.data.mes < relogio.mes);
                if (sequencial.data.dia == relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes) {
                        await fila.procura10(numeroSequencial, comarca, 4, '05')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 2, '05')
                    }
                    await sleep(500)
                } else if (sequencial.data.dia <= relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes) {
                        await fila.procura10(numeroSequencial, comarca, 3, '05')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 3, '05')
                    }
                    await sleep(500)
                } else if (sequencial.data.dia >= relogio.dia && sequencial.data.mes <= relogio.mes)  {
                    if (sequencial.data.mes < relogio.mes) {
                        await fila.procura10(numeroSequencial, comarca, 3, '05')
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 3, '05')
                    }
                    await sleep(500)
                }
                console.log(sequencial);
            } catch (e) {
                console.log(e);
                console.log("------------- A comarca :" + origens[contaOrigem] + ' falhou na busca--------------------');
            }
            //if (contaOrigem == 219) { break } else { contaOrigem++ };
            let pausaNaConsulta = 3600000 // Tempo de espera entre consultas no momento está 1 hora.
            if (contaOrigem == 88) { contaOrigem = 0; await sleep(pausaNaConsulta) } else { contaOrigem++ };
        };
        await sleep(7000)
    };
    await sleep(2000)
})();


function maiorSequencial(obj) {
    let resultado = obj[0]
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
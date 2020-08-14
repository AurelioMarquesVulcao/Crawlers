const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const  comarcas = require('../../assets/jte/comarcas');

const fila = new CriaFilaJTE();
const comarca = comarcas.comarcas;

//console.log(comarca);
//const origens = COMARCAS
(async () => {
    let arrayTemp = [];
    let contador = 0;
    for (i in comarca){if (comarca[i].length>0){arrayTemp.push(comarca[i])}; };
    //console.log(arrayTemp);
    for (let w = 0; w < 1;) {
        await sleep(1000)
        let relogio = fila.relogio();
        
        console.log(relogio);
        if (relogio.min == 1 && relogio.seg == 00 || contador == 0) {
            
            criador(arrayTemp[contador], contador, "${contador}", comarca.length)
            contador ++
            console.log(contador);
        }
    }
})()

async function criador(origem, tribunal, codigo, max) {
    let second = 0;
    let contaOrigem = 0;
    for (let w = 0; w < 1;) {
        second++
        let relogio = fila.relogio();
        let timer = fila.relogio();
        //if (timer.min == 20 && timer.seg == 01 || timer.min == 47) {
        //if(relogio.min == 51 && relogio.seg==00){
        if ("a") {
            let relogio = fila.relogio();
            try {
                // string de busca no banco de dados
                let parametroBusca = { "tribunal": tribunal, "origem": origem[contaOrigem] };
                // console.log(origem.length);
                let buscar = await fila.abreUltimo(parametroBusca);
                console.log(buscar.length);
                let sequencial = maiorSequencial(buscar)
                let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
                console.log(numeroSequencial);
                let comarca = sequencial.numeroProcesso.slice(16, 20);
                // Pegara os processos
                console.log("Estamos na comarca: " + origem[contaOrigem]);
                // console.log(sequencial.data.dia == relogio.dia);
                // console.log(sequencial.data.mes < relogio.mes);
                if (sequencial.data.dia == relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes - 1) {
                        await fila.procura10(numeroSequencial, comarca, 4, codigo)
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 1, codigo)
                    }
                    await sleep(500)
                } else if (sequencial.data.dia <= relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes - 1) {
                        await fila.procura10(numeroSequencial, comarca, 3, codigo)
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 1, codigo)
                    }
                    await sleep(500)
                } else if (sequencial.data.dia >= relogio.dia && sequencial.data.mes <= relogio.mes) {
                    if (sequencial.data.mes < relogio.mes - 1) {
                        await fila.procura10(numeroSequencial, comarca, 3, codigo)
                        console.log("----------------------- Estou dando um salto no Tempo--------------------------");
                    } else {
                        await fila.procura(numeroSequencial, comarca, 1, codigo)
                    }
                    await sleep(500)
                }
                console.log(sequencial);
            } catch (e) {
                console.log(e);
                console.log("------------- A comarca :" + origem[contaOrigem] + ' falhou na busca--------------------');
            }
            //if (contaOrigem == 219) { break } else { contaOrigem++ };
            let pausaNaConsulta = 3600000 / 2; // Tempo de espera entre consultas no momento está 1 hora.
            if (contaOrigem == max) {
                contaOrigem = 0;
                //await sleep(pausaNaConsulta)
            } else { contaOrigem++ };
            // console.log("----------------passei aqui----------------");
            //await sleep(1000)
            if (relogio.min == 59) { break }
        }
        await sleep(1000)
    };
    await sleep(2000)
};


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
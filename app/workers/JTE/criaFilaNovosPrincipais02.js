const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const comarcas = require('../../assets/jte/comarcas');


const fila = new CriaFilaJTE();
const comarca1 = comarcas.comarcas;


// con
(async () => {
    let arrayTemp = [];
    let contador = 2;
    let codigo;
    for (i in comarca1) { if (comarca1[i].length > 0) { arrayTemp.push(comarca1[i]) }; };
    let laco = arrayTemp.length - 1;
    // console.log(arrayTemp.length + "----------");
    console.log("quantidade de estados " + laco);
    for (let w = 0; w < 1;) {
        await sleep(1000)
        let relogio = fila.relogio();
        console.log(relogio);
        if (relogio.min == 1 && relogio.seg == 00 || contador == 2) {
            if (contador < 10) {
                contador++
                codigo = "0" + contador;
                //console.log(codigo);
                contador--
            } else {
                contador++
                codigo = contador ;
                contador--
            }
            await criador(arrayTemp[contador], contador + 1, codigo, arrayTemp[contador].length)
            contador++
            console.log(contador);
        }

        if (contador == laco) { contador == 0 }
    }
})()

// Criador de fila:
// Busca no banco de dados qual o ultimo processesso do estado/comarca,
// Após isso tenta pegar o proximo processo em ordem númerica.
async function criador(origens, tribunal, codigo, max) {
    let second = 0;
    let contaOrigem = 0;
    for (let w = 0; w < 1;) {
        second++
        let timer = fila.relogio();
        // if (timer.min == 20 && timer.seg == 01 || timer.min == 47) {
        if ("a") {
            let relogio = fila.relogio();
            // Informa o momento em que essa aplicação para.
            if (relogio.min == 50) { break }
            // esse tempo da o ritmo de busca de processos, 
            //3000 - nos da a velocidade de 20 processos por minuto
            await sleep(4000)
            try {
                // string de busca no banco de dados
                let parametroBusca = { "tribunal": tribunal, "origem": origens[contaOrigem] };
                // console.log(origens.length);
                let buscar = await fila.abreUltimo(parametroBusca);
                console.log(buscar.length);
                let sequencial = maiorSequencial(buscar)
                let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
                console.log(numeroSequencial);
                let comarca = sequencial.numeroProcesso.slice(16, 20);
                // Pegará os processos
                console.log("Estamos na comarca: " + origens[contaOrigem]);
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
                console.log("------------- A comarca :" + origens[contaOrigem] + ' falhou na busca--------------------');
            }
            //if (contaOrigem == 219) { break } else { contaOrigem++ };
            let pausaNaConsulta = 3600000 // Tempo de espera entre consultas no momento está 1 hora.
            if (contaOrigem == max) {
                contaOrigem = 0;

            } else { contaOrigem++ };
        };
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
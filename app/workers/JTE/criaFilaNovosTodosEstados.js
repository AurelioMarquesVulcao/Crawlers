const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const comarcas = require('../../assets/jte/comarcas');
const Estados = require('../../assets/jte/comarcascopy.json');


const Fila = new CriaFilaJTE();


(async () => {
  let origens;  // Comarcas de origens para serem inseridas.
  let tribunal; // numero do tribunal do tipo Int.
  let codigo;   // numero do tribunal do tipo String.
  let max;      // quantidade de comarca do tribunal
  let timer;    // tempo entre o envio de cada teste, isso marca o ritmo de envio de processos
  let fila = "";  // string de escolha de fila
  let contador = 0;
  let start = 0;
  let estados = [
    Estados.rs, Estados.ba, Estados.pe, Estados.ce, Estados.pa,
    Estados.to, Estados.am, Estados.sc, Estados.ac, // Estados.pb,
    Estados.ma, Estados.es, Estados.go, Estados.al, Estados.se,
    Estados.pi, Estados.mt, // Estados.rn, Estados.ms,
    Estados.rj, Estados.sp2, Estados.mg, Estados.pr, Estados.sp15
  ];
  for (let w = 0; w < 1;) {
    let relogio = Fila.relogio();

    console.log(estados[contador].estado);

    await sleep(1000);
    if (relogio.min == 1 && relogio.seg == 00 || start == 0) {
      // se mudar start para zero não terá pausa de 10 minudos entre os tribunais.
      start = 1
      origens = estados[contador].comarcas;
      tribunal = parseInt(estados[contador].codigo);
      codigo = estados[contador].codigo;
      max = estados[contador].comarcas.length;
      timer = estados[contador].tempo;
      await criador(origens, tribunal, codigo, max, timer, fila)

      contador++
    }

    console.log(relogio);
    if (contador == estados.length) { contador = 0 }
  }
})()

// Criador de fila:
// Busca no banco de dados qual o ultimo processesso do estado/comarca,
// Após isso tenta pegar o proximo processo em ordem númerica.
async function criador(origens, tribunal, codigo, max, tempo, fila) {
  let second = 0;
  let contaOrigem = 0;
  for (let w = 0; w < 1;) {
    second++
    //let timer = fila.relogio();
    // if (timer.min == 20 && timer.seg == 01 || timer.min == 47) {
    if ("a") {
      let relogio = Fila.relogio();
      // Informa o momento em que essa aplicação para.
      if (relogio.min == 50) { break }
      // esse tempo da o ritmo de busca de processos, 
      await sleep(tempo)
      try {
        // string de busca no banco de dados
        let parametroBusca = { "tribunal": tribunal, "origem": origens[contaOrigem] };
        // console.log(origens.length);
        let buscar = await Fila.abreUltimo(parametroBusca);
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
            await Fila.procura10(numeroSequencial, comarca, 4, codigo, fila)
            console.log("----------------------- Estou dando um salto no Tempo--------------------------");
          } else {
            await Fila.procura(numeroSequencial, comarca, 1, codigo, fila)
          }
          await sleep(500)
        } else if (sequencial.data.dia <= relogio.dia && sequencial.data.mes <= relogio.mes) {
          if (sequencial.data.mes < relogio.mes - 1) {
            await Fila.procura10(numeroSequencial, comarca, 3, codigo, fila)
            console.log("----------------------- Estou dando um salto no Tempo--------------------------");
          } else {
            await Fila.procura(numeroSequencial, comarca, 1, codigo, fila,)
          }
          await sleep(500)
        } else if (sequencial.data.dia >= relogio.dia && sequencial.data.mes <= relogio.mes) {
          if (sequencial.data.mes < relogio.mes - 1) {
            await Fila.procura10(numeroSequencial, comarca, 3, codigo, fila)
            console.log("----------------------- Estou dando um salto no Tempo--------------------------");
          } else {
            await Fila.procura(numeroSequencial, comarca, 1, codigo, fila)
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
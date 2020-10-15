const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const comarcas = require('../../../assets/jte/comarcas');
const Estados = require('../../../assets/jte/comarcascopy.json');
const { getFilas } = require('./get_fila');
const { Helper, Logger } = require('../../../lib/util');
const { GerenciadorFila } = require("../../../lib/filaHandler");
const desligar = require('../../../assets/jte/horarioRoboJTE.json');


const Fila = new CriaFilaJTE();
const rabbit = new GerenciadorFila();
var fila = ".2"; // string de escolha de fila
var nomeFila = 'processo.JTE.extracao.novos.2';
// var desligado = [];
var desligado = desligar.worker
var estados = [
  Estados.sp15, Estados.mg, Estados.ba,
];


(async () => {
  let origens;  // Comarcas de origens para serem inseridas.
  let tribunal; // numero do tribunal do tipo Int.
  let codigo;   // numero do tribunal do tipo String.
  let max;      // quantidade de comarca do tribunal
  let timer;    // tempo entre o envio de cada teste, isso marca o ritmo de envio de processos
  let contador = 0;
  let start = 0;  // cria uma condição que permite que a aplicação inicie ao ligar o worker.

  embaralha(estados)

  let devDbConection = process.env.MONGO_CONNECTION_STRING;

  mongoose.connect(devDbConection, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try{
    for (let w = 0; w < 1;) {
      let relogio = Fila.relogio();
      // console.log(estados[contador].estado);
      let statusFila = await testeFila(nomeFila); // Se a fila estiver vazia libera para download
      await sleep(100);
      // esse if mantem o enfilerador desligado na hora desejada
      if (!desligado.find(element => element == relogio.hora)) {
  
        // if (start == 0 || !statusFila) {
        if (start == 0 || !statusFila) {
          // se mudar start para zero não terá pausa de 10 minudos entre os tribunais.
          start = 1
          // if (!statusFila) {
          origens = estados[contador].comarcas;
          tribunal = parseInt(estados[contador].codigo);
          codigo = estados[contador].codigo;
          max = estados[contador].comarcas.length;
          timer = estados[contador].tempo;
          await criador(origens, tribunal, codigo, max, timer, fila)
          contador++
          // }
        }
        console.log(relogio);
        if (contador == estados.length) { contador = 0 }
      }
    }
  }catch(e){
    await sleep(120000);
    process.exit()
  }
})()

// Criador de fila:
// Busca no banco de dados qual o ultimo processesso do estado/comarca,
// Após isso tenta pegar o proximo processo em ordem númerica.
async function criador(origens, tribunal, codigo, max, tempo, fila) {
  let mensagens = [];
  let second = 0;
  let contaOrigem = 0;
  let contaLaco = 0;
  for (let w = 0; w < 1000;) {
    second++
    if ("a") {
      try {
        let relogio = Fila.relogio();
        //console.log("funcao criador");
        // if (relogio.min == 20) { break }
        // string de busca no banco de dados
        let parametroBusca = { "tribunal": tribunal, "origem": parseInt(origens[contaOrigem]) };
        console.log(parametroBusca);
        let buscar = await Fila.abreUltimo(parametroBusca);
        let sequencial = maiorSequencial(buscar)
        let numeroSequencial = sequencial.numeroProcesso.slice(0, 7);
        let comarca = sequencial.numeroProcesso.slice(16, 20);
        let statusComarca = await Fila.verificaComarcas(`${codigo}`, comarca);


        if (statusComarca) {
          contaLaco++
          console.log("Estamos na comarca: " + origens[contaOrigem]);
          console.log("Código do Estado.: " + codigo);
          console.log("status comarca " + statusComarca);



          if (sequencial.data.dia == relogio.dia && sequencial.data.mes <= relogio.mes) {
            if (sequencial.data.mes < relogio.mes - 1) {
              mensagens.push(
                await Fila.procura10(numeroSequencial, comarca, 1, codigo, fila)
              );
            } else {
              mensagens.push(
                await Fila.procura(numeroSequencial, comarca, 1, codigo, fila));
            }
          } else if (sequencial.data.dia <= relogio.dia && sequencial.data.mes <= relogio.mes) {
            if (sequencial.data.mes < relogio.mes - 1) {
              mensagens.push(
                await Fila.procura10(numeroSequencial, comarca, 1, codigo, fila)
              );
            } else {
              mensagens.push(
                await Fila.procura(numeroSequencial, comarca, 1, codigo, fila));
            }
          } else if (sequencial.data.dia >= relogio.dia && sequencial.data.mes <= relogio.mes) {
            if (sequencial.data.mes < relogio.mes - 1) {
              mensagens.push(
                await Fila.procura10(numeroSequencial, comarca, 1, codigo, fila)
              );
            } else {
              mensagens.push(
                await Fila.procura(numeroSequencial, comarca, 1, codigo, fila));
            }
          }

        }
        // console.log("O contador vale.: " + contaLaco);
      } catch (e) {
        //console.log(e);
        console.log("------------- A comarca: " + origens[contaOrigem] + ' falhou na busca--------------------');
        let buscaProcesso = { "estadoNumero": codigo, "comarca": origens[contaOrigem] };
        await Fila.salvaStatusComarca(`00000000020205${codigo}${origens[contaOrigem]}`, "", "", buscaProcesso);
      }

      if (contaOrigem == max - 1) {
        console.log(mensagens.length);
        await rabbit.enfileirarLoteTRT(nomeFila, mensagens);
        mensagens = [];

        if (contaLaco > 0) {
          await sleep(20000)
        }
        await paraServico()
        contaOrigem = 0;
        // pausa o envio de processos até que a fila fique limpa.
        console.log("O contador vale.: " + contaLaco);
        await testeFila(nomeFila, contaLaco);
        if (contaLaco == 0) {
          console.log("++++++++++++++++++++++++++++++!!!! parei esses estado !!!! +++++++++++++++++++++++++++++++++++++");
          break
        }
        contaLaco = 0;

      } else { contaOrigem++ };
    };
  };
  // await sleep(1000)
};

function maiorSequencial(obj) {
  let resultado = obj[0]
  let teste = parseInt(obj[0].numeroProcesso.slice(0, 7));
  //console.log(teste);
  //console.log(obj[0].numeroProcesso);
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

// embaralhador de array, faz com que a ordem de consumo da fila mude 
// para que não baixe apenas o mesmo estado toda vez que inicie a aplicação.
function embaralha(lista) {
  for (let indice = lista.length; indice; indice--) {
    const indiceAleatorio = Math.floor(Math.random() * indice);
    // guarda de um índice aleatório da lista
    const elemento = lista[indice - 1];
    lista[indice - 1] = lista[indiceAleatorio];
    lista[indiceAleatorio] = elemento;
  }
}

// me informa true ou undefined para:
// fila limpa = true, fila com processos = undefined.
async function verificaFila(nomeFila) {
  let filas = await getFilas();
  console.log(filas);
  //console.log(filas);
  if (filas.length > 0) {
    for (let i = 0; i < filas.length; i++) {
      if (filas[i].nome == nomeFila) {
        return true
      }
    }
  }
}

// aguarda a fila ficar limpa para inserir novos processos
async function testeFila(nomeFila, contador) {
  for (let w = 0; w < 1;) {
    let relogio = Fila.relogio();
    let statusFila = await verificaFila(nomeFila);
    //console.log(statusFila + "----------------");
    //console.log("funcao teste fila");
    // if (contador == 0) { break }
    if (!statusFila) {
      console.log("A fila ainda não consumiu...");
      await sleep(10000)
    } else { break }
  }
}

async function paraServico() {
  let teste = await aguardaServico();
  let filas = await getFilas();
  for (l in filas) {
    if (filas[l].nome == nomeFila && teste == true) {
      await mongoose.connection.close()
      process.exit();
    }
  }
}

async function aguardaServico() {
  let filas = await getFilas();
  for (l in filas) {
    if (filas[l].nome == nomeFila) {
      await sleep(300000);  // aguardar 5 minutos.
      return true;
    } else {
      return false
    }
  }
}
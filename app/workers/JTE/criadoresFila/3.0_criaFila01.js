const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const comarcas = require('../../../assets/jte/comarcas');
const { Variaveis } = require('../../../lib/variaveisRobos');
// const Estados = require('../../../assets/jte/comarcascopy.json');
const { getFilas } = require('./get_fila');
const { Helper, Logger, Cnj } = require('../../../lib/util');
const desligar = require('../../../assets/jte/horarioRoboJTE.json');
const { GerenciadorFila } = require("../../../lib/filaHandler");


const Fila = new CriaFilaJTE();
const rabbit = new GerenciadorFila();
var fila = ".1";  // string de escolha de fila
var nomeFila = 'processo.JTE.extracao.novos.1';
var desligado = desligar.worker;



(async () => {
  let mensagens = [];
  let contador = 0;
  let start = 0;  // cria uma condição que permite que a aplicação inicie ao ligar o worker.
  const variaveis = await Variaveis.catch({ "codigo": "000001" });
  const Estados = variaveis.variaveis;
  var estados = [
    Estados[0].rj, // Estados[0].sp2,
  ];

  embaralha(estados)
  // conecta com o Banco de dados...
  let devDbConection = process.env.MONGO_CONNECTION_STRING;

  mongoose.connect(devDbConection, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  try {
    for (let w = 0; w < 1;) {
      let relogio = Fila.relogio();

      let statusFila = await testeFila(nomeFila); // Se a fila estiver vazia libera para download
      console.log(statusFila);
      let comarcas = await CriaFilaJTE.getEstado(estados[contador].codigo);
      // console.log(comarcas);
      // console.log(extraiDados(comarcas));
      let processos = extraiDados(comarcas);

      processos.map(x => {
        let arrayMensages = Fila.procura(x.numero.sequencial, x.numero.comarca, 4, x.numero.estado)
        console.log(arrayMensages);
        for (let ii = 0; ii < arrayMensages.length; ii++) {
          mensagens.push(arrayMensages[ii]);
        }
      })

      console.log(mensagens);

      await rabbit.enfileirarLoteTRT(nomeFila, mensagens);



      console.log(relogio);
      if (contador == estados.length) { contador = 0 }
      await sleep(10000);
      // process.exit();
    }
  } catch (e) {
    console.log(e);
  }
})()



function extraiDados(comarcas) {
  return comarcas.map(x => {
    if (x.status != 'Ultimo Processo') {
      return {
        numero: Cnj.processoSlice(x.numeroUltimoProcecesso)
      }
    } else {
      return null
    }
  }).filter((x => x != null))
  // console.log(dados);

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
  // console.log(filas);
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
    if (!statusFila) {
      console.log("A fila ainda não consumiu...");
      await sleep(10000)
    } else { break }
  }
}


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
const awaitSleep = require("await-sleep");
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../../../models/schemas/jte');


const Fila = new CriaFilaJTE();
const rabbit = new GerenciadorFila();
var fila = ".1";  // string de escolha de fila
var nomeFila = 'processo.JTE.extracao.novos.1';
var desligado = desligar.worker;



(async () => {
  // let mensagens = [];
  let contador = 0;
  let start = 0;  // cria uma condição que permite que a aplicação inicie ao ligar o worker.
  const variaveis = await Variaveis.catch({ "codigo": "000001" });
  const Estados = variaveis.variaveis;
  var estados = [
    // Estados[0].rj,
    Estados[0].sp2,
    // Estados[0].mg,
  ];

  embaralha(estados)
  // conecta com o Banco de dados...
  let devDbConection = process.env.MONGO_CONNECTION_STRING;

  mongoose.connect(devDbConection, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
  try {
    // fara com que as 18:00 reset todos as comarcas
    setInterval(async function () {
      let { hora, min } = Fila.relogio();
      if (hora == 16 && min == 00) {
        for (let y = 0; y < estados; y++) {
          await CriaFilaJTE.getEstado(estados[y].codigo);
        }
        await sleep(60000);
      }
      console.log(min);
    }, 60000);
    for (let w = 0; w < 1;) {
      let mensagens = [];
      let relogio = Fila.relogio();
      let statusFila = await testeFila(nomeFila); // Se a fila estiver vazia libera para download
      // faz com que todas as comarcas sejam colocadas para download todos os dias.
      await atualizaStatusDownload(estados[contador].codigo, relogio);
      // pega as comarcas já atualizadas
      let comarcas = await CriaFilaJTE.getEstado(estados[contador].codigo);
      // console.log(comarcas);

      // process.exit();
      let status = comarcas.filter(x => x.ano == '2021' || x.status == 'Atualizado' || x.status == 'Novo');
      // let status = comarcas.filter(x => x.estadoNumero == "02"&& x.comarca == "0003");
      // Pega apenas as comarcas que não são ultimo estado
      let processos = extraiDados(status);
      // console.log(comarcas);
      console.log(status);
      // process.exit()
      console.log(processos.length);

      if (processos.length > 0) {
        mensagens = [];
        processos.map(x => {
          // Para a virada do ano será usado esse código.
          if (x.numero.ano != new Date().getFullYear()) {
            // Gera um numero de Start Para a comarca.
            // console.log(x);
            if (x.numero.sequencial != "0000000") {
              let sequencial = trataSequencial(x)
              let arrayMensages = Fila.procura(sequencial, x.numero.comarca, 4, x.numero.estado)
              // console.log(arrayMensages);
              for (let ii = 0; ii < arrayMensages.length; ii++) {
                mensagens.push(arrayMensages[ii]);
              }
            }
          } else {

            let arrayMensages = Fila.procura(x.numero.sequencial, x.numero.comarca, 4, x.numero.estado)
            console.log(arrayMensages);
            for (let ii = 0; ii < arrayMensages.length; ii++) {
              mensagens.push(arrayMensages[ii]);
            }
          }

        })
        // console.log(mensagens);
        // let find 
        // await statusEstadosJTE.findOneAndUpdate(find, update)
        // process.exit()
        await rabbit.enfileirarLoteTRT(nomeFila, mensagens);
        mensagens = [];
      }
      mensagens = [];

      console.log(relogio);
      if (status.length == 0) { contador++ }
      if (contador == estados.length) { contador = 0 }
      await sleep(20000);
      // process.exit();
    }
  } catch (e) {
    console.log(e);
  }
})()

async function atualizaStatusDownload(estado, relogio) {
  let comarcas = await CriaFilaJTE.getEstado(estado);
  let { dia, hora } = relogio;
  console.log(dia);
  let desatualizadas = comarcas.filter(x => x.dataBusca.dia != 9);
  // console.log(desatualizadas);
  if (desatualizadas.length != 0) {
    for (let i = 0; i < desatualizadas.length; i++) {
      let { _id } = desatualizadas[i];
      await CriaFilaJTE.updateEstado(_id)
    }
  }
}

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

function trataSequencial(x) {
  // console.log(x);
  // return comarcas.map((x) => {
  // console.log(
  //   Cnj.processoSlice(x.numeroUltimoProcecesso).sequencial,
  //   Cnj.processoSlice(x.numeroUltimoProcecesso).estado,
  //   Cnj.processoSlice(x.numeroUltimoProcecesso).comarca
  // );
  // let processo = [Cnj.processoSlice(x.numeroUltimoProcecesso).sequencial];
  let processo = [x.numero.sequencial];
  if (processo == "0000000") {
    return processo
  } else {
    // console.log(processo);
    let number = [];
    processo.map((y) => {
      for (let i = 0; i < y.length; i++) {
        number.push(y[i]);
      }
      return number
    })
    // console.log(number);
    let zeros = "";
    while (true) {
      if (number[0] == '0') {
        number.splice(0, 1);
        zeros += "0"
      } else if (number[0] != '0' || number.length == 1) {
        break
      }
    }
    // console.log(number.join(""));
    // console.log(number.length);
    if (number.length >= 5) {
      for (let i = 1; i < number.length; i++) {
        if (i < number.length - 1) {
          number[i] = "0"
        } else {
          // ajustei para zero para a função procura fila acrescentar 4 numeros ao zero
          // ficando 1--2--3 e não 2--3--4
          number[i] = "0"
        }
      }
    } else if (number.length <= 4) {
      for (let i = 0; i < number.length; i++) {
        if (i < number.length - 1) {
          number[i] = "0"
        } else {
          // ajustei para zero para a função procura fila acrescentar 4 numeros ao zero
          // ficando 1--2--3 e não 2--3--4
          number[i] = "0"
        }
      }
    }
    // console.log(zeros + number.join(""));
    return zeros + number.join("");
  }
  // console.log(number);
  // process.exit();
  // })
}


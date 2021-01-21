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
const { statusEstadosJTE } = require("../../../models/schemas/jte");
const { StatusTribunais } = require('../../../models/schemas/monitoria');


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
    Estados[0].rj,
    Estados[0].sp2,
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
      if (hora == 14 && min == 00) {
        console.log("vou rodar aqui");
        for (let y = 0; y < estados.length; y++) {
          // await CriaFilaJTE.getEstado(estados[y].codigo);
          await CriaFilaJTE.resetEstado(estados[y].codigo)
        }
        await sleep(60000);
      }
      console.log(min);
    }, 60000);
    for (let w = 0; w < 1;) {
      let mensagens = [];
      let relogio = Fila.relogio();
      console.log(" ---------------- ", "Estado numero: ", estados[contador].codigo, " ---------------- ");
      let statusFila = await testeFila(nomeFila); // Se a fila estiver vazia libera para download
      // Se o site do estado estiver off vou para o proximo estado
      let tribunalStatus = await tribunalOn(estados[contador].codigo);
      if (tribunalStatus == false) { contador++ }
      if (contador == estados.length) { contador = 0 }
      // faz com que todas as comarcas sejam colocadas para download todos os dias.
      console.log(estados[contador].codigo);
      
      await atualizaStatusDownload(estados[contador].codigo, relogio);
      // pega as comarcas já atualizadas
      let comarcas = await CriaFilaJTE.getEstado(estados[contador].codigo);
      let status = comarcas.filter(x => x.status == 'Atualizado' || x.status == 'Novo');
      status = status.filter(x => x.dataBusca);
      console.log("Filtrado dados da comarca");
      // Pega apenas as comarcas que não são ultimo estado
      let processos = extraiDados(status);
      console.log(processos.length);

      if (processos.length > 0) {
        mensagens = [];
        processos.map(async x => {
          // Para a virada do ano será usado esse código.
          if (x.numero.ano != new Date().getFullYear()) {
            // Gera um numero de Start Para a comarca.
            // console.log(x);
            if (x.numero.sequencial != "0000001") {
              let sequencial = trataSequencial(x)
              // console.log(sequencial);

              let arrayMensages = await Fila.procura(sequencial, x.numero.comarca, 4, x.numero.estado, x.estado)
              // console.log(arrayMensages);
              // process.exit()
              for (let ii = 0; ii < arrayMensages.length; ii++) {
                mensagens.push(arrayMensages[ii]);
              }
            }
          } else {

            let arrayMensages = await Fila.procura(x.numero.sequencial, x.numero.comarca, 4, x.numero.estado, x.estado)
            // console.log(arrayMensages);
            for (let ii = 0; ii < arrayMensages.length; ii++) {
              mensagens.push(arrayMensages[ii]);
            }
          }

        })
        await sleep(2000);
        await rabbit.enfileirarLoteTRT(nomeFila, mensagens);
        mensagens = [];
      }
      mensagens = [];

      console.log(relogio);
      // muda o estado quando termina de baixar todas as comarcas
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
  // new Date().getMonth()
  let validaData = comarcas.filter(x => x.dataBusca);
  // console.log(validaData[0].dataBusca.getDate(),"data", validaData[0].dataBusca, "dia", new Date().getDay());
  let desatualizadas = validaData.filter(x =>
    x.dataBusca.getDate() < new Date().getDate() || x.dataBusca.getMonth() < new Date().getMonth()
  );
  console.log(desatualizadas);
  if (desatualizadas.length != 0) {
    for (let i = 0; i < desatualizadas.length; i++) {
      let { _id } = desatualizadas[i];
      await CriaFilaJTE.updateEstado(_id)
    }
  }
}


function extraiDados(comarcas) {
  return comarcas.map(x => {
    if (x.ano == 2020) {
      // if (new Date().getDay() == "1" && new Date().getMonth() == "1") {
      // if (true){
      if (x.status != 'Ultimo Processo') {
        return {
          numero: Cnj.processoSlice(x.numeroUltimoProcecesso),
          estado: x.estado
        }
      } else {
        return null
      }
    } else {
      if (x.status != 'Ultimo Processo' && x.ano == new Date().getFullYear()) {
        return {
          numero: Cnj.processoSlice(x.numeroUltimoProcecesso),
          estado: x.estado
        }
      } else {
        return null
      }
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
  let processo = [x.numero.sequencial];
  if (processo == "000000") {
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
    console.log(zeros, number.join(""));
    return zeros + number.join("");
  }
}

async function tribunalOn(estado){
  let numeroEstado = parseInt(estado);
  let teste = await StatusTribunais.aggregate([
    {
      $match: {
        "ufCode": numeroEstado,
        "site" : "pje"
      }
    },
    {
      $project: {
        "status": 1,
        "site" : 1
      }
    },
    { $sort: { _id: -1 } },
    { $limit: 3 }
  ]);
  let filtro = teste.filter(x => x.status !== true);
  if (filtro.length == 0) {
    console.log("tribunal ta on");
    return true
  } else {
    console.log("tribunal ta off");
    return false
  }
}

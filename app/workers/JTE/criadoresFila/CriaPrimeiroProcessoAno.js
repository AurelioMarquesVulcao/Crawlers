const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const sleep = require('await-sleep');
const { enums } = require("../../../configs/enums");
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const comarcas = require('../../../assets/jte/comarcas');
const { Variaveis } = require('../../../lib/variaveisRobos');
// const Estados = require('../../../assets/jte/comarcascopy.json');
const { getFilas } = require('./get_fila');
const { Helper, Logger, Cnj, CnjValidator } = require('../../../lib/util');
const desligar = require('../../../assets/jte/horarioRoboJTE.json');
const { GerenciadorFila } = require("../../../lib/filaHandler");
const awaitSleep = require("await-sleep");
const { statusEstadosJTE } = require("../../../models/schemas/jte");
const { Processo } = require("../../../models/schemas/processo");
const rabbit = new GerenciadorFila();




function trataSequencial(x) {
  let processo = [x]
  // let processo = [x.numero.sequencial];
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
    // console.log(number);
    if (x == "0000000") {
      return "0000001"
    } else {
      number.splice(number.length - 1, 1, "1")
    }
    // console.log(number);
    // console.log(zeros, number.join(""));
    return zeros + number.join("");
  }
}

(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose.connection.on('error', (e) => {
    console.log(e);
  });
  let comarcas = await statusEstadosJTE.find({});
  let numeros1 = [];
  let mensagens = [];
  for (i in comarcas) {
    let processo = (comarcas[i].numeroUltimoProcecesso).slice(0, 7);

    let sequencial = trataSequencial(processo);
    let numero1 = `${sequencial}00${new Date().getFullYear()}5${comarcas[i].estadoNumero}${comarcas[i].comarca}`


    let obj = {
      "NumeroProcesso": numero1,
      "NovosProcessos": "true",
      "estado": comarcas[i].status
    };
    numeros1.push(obj)
  }
  // numeros1.length = 20;
  for (j in numeros1) {
    let { ano, estado, comarca, tipo, sequencial } = Cnj.processoSlice(numeros1[j].NumeroProcesso)
    let xx = CnjValidator.calcula_mod97(sequencial, ano, `5${estado}`, comarca);
    let find = {
      "detalhes.numeroProcesso": `${sequencial}${xx}${ano}5${estado}${comarca}`
    }
    let teste = await Processo.find(find);
    if (teste.length != 1) {
      mensagens.push(`{"NumeroProcesso": "${numeros1[j].NumeroProcesso}", "NovosProcessos": "${numeros1[j].NovosProcessos}", "estado": "${numeros1[j].estado}", "estado" : "Principal"}`)
      // mensagens.push(numeros1[j])
    }
  }
  // console.log(mensagens);
  let nomeFila = "ReprocessamentoJTE"
  await rabbit.enfileirarLoteTRT(nomeFila, mensagens);

  await sleep(100)
  process.exit()
})()




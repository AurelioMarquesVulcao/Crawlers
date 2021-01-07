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
const { Processo } = require('../../../models/schemas/processo');
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../../../models/schemas/jte');


const Fila = new CriaFilaJTE();
const rabbit = new GerenciadorFila();
var fila = ".1";  // string de escolha de fila
var nomeFila = 'processo.JTE.extracao.novos.1';
var desligado = desligar.worker;



(async () => {
  let teste = "0036";
  console.log(!/-/.test(teste));
  let estados = ["05", "01", "02", "03", "04", "06", "07", "08", '09', "10", "11", "12", "13", "14", "15", "16", "17", "18", '19', "20", "21", "22", "23", "24"];
  for (let i = 0; i < estados.length; i++) {
    await estado(estados[i]);
  }


  process.exit();
})()

async function estado(str) {




  let estados = await statusEstadosJTE.find({
    "estadoNumero": str
  })
  for (let i = 0; i < estados.length; i++) {
    let comarca = estados[i].comarca;
    // console.log(estados[i].comarca);
    // console.log(!/-/.test(comarca));
    let teste = `${!/-/.test(comarca)}`
    if (teste == "true") {
      // console.log("teste ok");
      await rastreio(parseInt(str), comarca);
    }
  }


}

async function rastreio(tribunal, comarca) {
  let cnj = [];
  let processos = await Processo.find({
    "detalhes.orgao": 5,
    "detalhes.tribunal": tribunal,
    "detalhes.origem": comarca,
    "detalhes.ano": 2020,
  })
  // .limit(5)
  numeros = processos.map((x) => {
    return {
      "sequencial": Cnj.processoSlice(x.detalhes.numeroProcessoMascara).sequencial,
      "processo": x.detalhes.numeroProcessoMascara
    }
  })
  numerosOrdem = numeros.sort((a, b) => {
    if (b.sequencial < a.sequencial) {
      return -1;
    }
  })
  // código de update
  try {
    // console.log(numerosOrdem.slice(9, 10));
    console.log(numerosOrdem.slice(9, 10)[0].processo);
    let number = numerosOrdem.slice(9, 10)[0].processo;
    number = number.replace("-", "")
    number = number.replace(/\./gmi, "")
    // console.log(number);
    // process.exit()

    let estadoF = Cnj.processoSlice(number).estado;
    let comarcaF = Cnj.processoSlice(number).comarca;
    let anoF = Cnj.processoSlice(number).ano;
    let find = {
      "estadoNumero": `${estadoF}`,
      "comarca": `${comarcaF}`,
    }
    let updatef = {
      numeroUltimoProcecesso: number,
      status: 'Atualizado',
      ano: anoF
    };
    await statusEstadosJTE.findOneAndUpdate(find, updatef)
    console.log(await statusEstadosJTE.find(find));
  } catch (e) { }
  // process.exit()


  for (let i = 0; i < numerosOrdem.length - 1; i++) {
    let diferenca = numerosOrdem[i].sequencial - (numerosOrdem[i + 1].sequencial);
    // console.log(numerosOrdem[i].sequencial, (numerosOrdem[i + 1].sequencial));
    // console.log(numerosOrdem.slice(0, 10));
    // if (diferenca >= 300) {
    //   console.log(numerosOrdem.slice(0, 10));
    //   // console.log(numerosOrdem[i].sequencial, (numerosOrdem[i + 1].sequencial));
    //   // console.log(diferenca);
    // }
  }
}
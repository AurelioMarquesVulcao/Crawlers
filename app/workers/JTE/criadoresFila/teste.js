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
  let processos = await Processo.find({ "detalhes.orgao": 5, "detalhes.tribunal": 24, "detalhes.origem": 4 })
  let numeros = processos.map((x) => x.detalhes.numeroProcessoMascara)
  for (let i = 0; i < numeros.length; i++) {
    console.log(numeros[i]);
  }
  // await statusEstadosJTE.deleteMany({"dataCriaçãoJTE" : null});
})()
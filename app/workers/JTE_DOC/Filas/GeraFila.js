const mongoose = require('mongoose');
const cheerio = require('cheerio');
const shell = require('shelljs');
const sleep = require('await-sleep');

const { enums } = require('../../../configs/enums');
const { GerenciadorFila } = require('../../../lib/filaHandler');
const { Extracao } = require('../../../models/schemas/extracao');
const { Logger, Cnj, Helper } = require('../../../lib/util');
const { LogExecucao } = require('../../../lib/logExecucao');
const { Andamento } = require('../../../models/schemas/andamento');
const { JTEParser } = require('../../../parsers/JTEParser');
const { RoboPuppeteer3 } = require('../../../lib/roboPuppeteeJTEDoc');
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const { downloadFiles } = require('../../../lib/downloadFiles');
const { Log } = require('../../../models/schemas/logsEnvioAWS');
const desligado = require('../../../assets/jte/horarioRoboJTE.json');
const { Processo } = require('../../../models/schemas/processo');
const { FluxoController } = require('../../../lib/fluxoController');
const { log } = require('winston');
const { ObjectID } = require('mongodb');

const nomeFila = `peticao.JTE.extracao`;
const nomeFilaPJE = `processo.PJE.atualizacao.01`;

var Processos = [];
(async () => {
  await worker();
})();

async function worker() {
  try {
    // liga ao banco de dados
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (e) => {
      console.log(e);
    });
  } catch (e) {
    console.log(e);
    process.exit();
    // Pare o container!
  }
  try {
    // tudo que está abaixo é acionado para cada consumer na fila.
    await new GerenciadorFila(false, 10).consumir(nomeFila, async (ch, msg) => {
      let message = JSON.parse(msg.content.toString());
      console.table(message);
      // Cria Fila PJE
      await PJE(message);
      // Cria Fila JTE
      // await JTE(message);

      // ch.ack(msg);
      // await sleep(20000);
      await sleep(1000);
      process.exit();
    });
  } catch (e) {
    console.log(e);
    // await sleep(1000);
    process.exit();
    // Não feche a mensagem em caso de erro !
    // ch.ack(msg);
  }
}

async function geraPje(message) {
  let processo = await Processo.findOne({
    'detalhes.numeroProcesso': message.NumeroProcesso,
  });
  let id = processo._id;
  let message2 = {
    Instancia: null,
    NumeroProcesso: message.NumeroProcesso,
    NovosProcessos: true,
    _id: id,
    NomeRobo: nomeFilaPJE.toLowerCase(),
  };
  console.log(message2);
  return message2;
}

async function PJE(message) {
  try {
    let message2 = await geraPje(message);
    let execucao = await FluxoController.cadastrarExecucao(
      nomeFilaPJE.toLowerCase(),
      nomeFilaPJE,
      message2
    );
    if (!execucao) {
      console.log('Reenfileirado a força');
      await new GerenciadorFila().enviar(nomeFilaPJE, message2);
    }
  } catch (e) {
    console.log(e);
  }
}

async function JTE(message) {
  try {
    let numeroProcesso = message.NumeroProcesso;
    let estadoProcesso = Cnj.processoSlice(numeroProcesso).estado;
    let fila = `peticao.JTE.extracao.${estadoProcesso}`;
    let execucao = await FluxoController.cadastrarExecucao(
      fila.toLowerCase(),
      fila,
      message
    );
    if (!execucao) {
      console.log('Reenfileirado a força');
      await new GerenciadorFila().enviar(fila, message);
    }
  } catch (e) {
    console.log(e);
  }
}

const mongoose = require('mongoose');
const sleep = require('await-sleep');

const { enums } = require('../../../configs/enums');
const { GerenciadorFila } = require('../../../lib/filaHandler');
const { Logger, Cnj, Helper } = require('../../../lib/util');
const {
  ExecucaoConsulta,
} = require('../../../models/schemas/execucao_consulta');
const { Log } = require('../../../models/schemas/logsEnvioAWS');
const { Processo } = require('../../../models/schemas/processo');
const { FluxoController } = require('../../../lib/fluxoController');
const { Fila } = require('./getFila');

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
    await new GerenciadorFila(false, 1).consumir(nomeFila, async (ch, msg) => {
      let filas = await Fila.getFila(`peticao\\.JTE\\.extracao\.\\d`);
      let filasQtd = filas.map((x) => x.qtd).reduce((x, y) => x + y);

      let links = await Fila.getFila(`peticao.jte.extracao.links`);
      let linksQtd = links.map((x) => x.qtd).reduce((x, y) => x + y);
      // process.exit();
      while (filasQtd >= 7 && linksQtd > 50) {
        console.log('A fila não consumiu, Qtd:', filasQtd);
        console.log('O link não consumiu, Qtd:', linksQtd);
        await sleep(60000);
      }

      let message = JSON.parse(msg.content.toString());
      message['Instancia'] = message.instancia;
      delete message['instancia'];
      console.table(message);
      // Cria Fila PJE
      await PJE(message);
      // Cria Fila JTE
      await JTE(message);

      await sleep(5000);

      // process.exit();
      ch.ack(msg);

      // await sleep(20000);
      // await sleep(1000);
    });
  } catch (e) {
    console.log(e);
    // await sleep(3000);
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
    NumeroProcesso: message.NumeroProcesso,
    NovosProcessos: true,
    _id: id,
    Instancia: message.Instancia,
    NomeRobo: nomeFilaPJE.toLowerCase(),
  };
  // console.log(message2);
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
      let log = await ExecucaoConsulta.findOne({
        NomeRobo: message2.NomeRobo,
        'Mensagem.Instancia': message2.Instancia,
        'Mensagem.NumeroProcesso': message2.NumeroProcesso,
        DataTermino: null,
      });
      console.log('Reenfileirado a força');
      await new GerenciadorFila().enviar(nomeFilaPJE, log.Mensagem);
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
    // Incluido dados obrigatórios na mensgem
    // message['Instancia'] = null;
    message['NomeRobo'] = fila.toLowerCase();
    let execucao = await FluxoController.cadastrarExecucao(
      fila.toLowerCase(),
      fila,
      message
    );
    if (!execucao) {
      let log = await ExecucaoConsulta.findOne({
        NomeRobo: message.NomeRobo,
        'Mensagem.Instancia': message.Instancia,
        'Mensagem.NumeroProcesso': message.NumeroProcesso,
        DataTermino: null,
      });
      console.log('Reenfileirado a força');
      await new GerenciadorFila().enviar(nomeFilaPJE, log.Mensagem);
    }
  } catch (e) {
    console.log(e);
  }
}

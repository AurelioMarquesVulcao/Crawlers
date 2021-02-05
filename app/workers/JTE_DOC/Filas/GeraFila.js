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
const {FluxoController} = require('../../../lib/fluxoController');


/**
 * Logger para console e arquivo
 */

const nomeFila = `peticao.JTE.extracao`;
const nomeFilaPJE = `processo.PJE.extracao.novos.1`;
const Estados = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", '21', "22", "23", "24"];
var Processos = [];
(async () => {

  await worker();

})();

async function worker() {
  try{
// liga ao banco de dados
mongoose.connect(enums.mongo.connString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
  console.log(e);
});
  } catch(e){
    // Pare o container!
  }
  


  // tudo que está abaixo é acionado para cada consumer na fila.
  await new GerenciadorFila(false, 1).consumir(nomeFila, async (ch, msg) => {
    try {

      let message = JSON.parse(msg.content.toString());
      let numeroProcesso = message.NumeroProcesso;
      // await FluxoController.cadastrarExecucao("robo ","fila", "mensagem")

      console.log(message);
      
      // função de processamento PJE
      let estadoProcesso = Cnj.processoSlice(numeroProcesso).estado
      // função de divisão de filas
      new GerenciadorFila().enviar(`peticao.JTE.extracao.${estadoProcesso}`, message);

      let message2 = await geraPje(message)

      new GerenciadorFila().enviar(nomeFilaPJE, message2);
      console.log("envio para fila ok");
      // console.log(message);

      // ch.ack(msg);
      // await sleep(20000);
      await sleep(1000);
      process.exit();


      
    } catch (e) {

      console.log(e);


      new GerenciadorFila().enviar(nomeFila, message);

      // ch.ack(msg);
    }
  });

}

async function geraPje(message) {
  let processo = await Processo.findOne({ "detalhes.numeroProcesso": message.NumeroProcesso });
  let id = processo._id;
  let message2 = {
    "NumeroProcesso" : message.NumeroProcesso,"NovosProcessos" : true, "_id" : id
  }
  return message2
}
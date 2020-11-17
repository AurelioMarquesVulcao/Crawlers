const mongoose = require('mongoose');
const cheerio = require('cheerio');
const shell = require('shelljs');
const sleep = require('await-sleep');

const { enums } = require('../../../configs/enums');
const { GerenciadorFila } = require('../../../lib/filaHandler');
// const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../../models/schemas/extracao');
const { Logger, Cnj, Helper } = require('../../../lib/util');
const { LogExecucao } = require('../../../lib/logExecucao');
const { Andamento } = require('../../../models/schemas/andamento');
// const { ExtratorBase } = require('../../extratores/extratores');
const { JTEParser } = require('../../../parsers/JTEParser');
const { RoboPuppeteer3 } = require('../../../lib/roboPuppeteeJTEDoc');
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const { downloadFiles } = require('../../../lib/downloadFiles');
const { Log } = require('../../../models/schemas/logsEnvioAWS');
const desligado = require('../../../assets/jte/horarioRoboJTE.json');


/**
 * Logger para console e arquivo
 */

const nomeFila = `peticao.JTE.extracao`;
const Estados = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", '21', "22", "23", "24"];
var Processos = [];
(async () => {

  await worker();

})();

async function worker() {

  // // liga ao banco de dados
  // mongoose.connect(enums.mongo.connString, {
  //   useNewUrlParser: true,
  //   useUnifiedTopology: true,
  // });
  // mongoose.connection.on('error', (e) => {
  //   console.log(e);
  // });


  // tudo que está abaixo é acionado para cada consumer na fila.
  await new GerenciadorFila(false, 1000).consumir(nomeFila, async (ch, msg) => {
    try {

      let message = JSON.parse(msg.content.toString());
      let numeroProcesso = message.NumeroProcesso;

      // if (estadoDaFila != estadoAnterior) {
      //   await mongoose.connection.close();
      //   await puppet.mudaTribunal(estadoDaFila);
      //   await sleep(1000);
      //   contador = 0;
      // }
      let estadoProcesso = Cnj.processoSlice(numeroProcesso).estado
      // console.log(Cnj.processoSlice(numeroProcesso));
      // console.log(estadoProcesso);
      new GerenciadorFila().enviar(`peticao.JTE.extracao.${estadoProcesso}`, message);
      console.log("envio para fila ok");
      // console.log(message);


      await sleep(20000);
      // process.exit();


      ch.ack(msg);
    } catch (e) {

      console.log(e);


      new GerenciadorFila().enviar(nomeFila, message);

      ch.ack(msg);
    }
  });
  
}

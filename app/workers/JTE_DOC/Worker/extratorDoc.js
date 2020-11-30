const mongoose = require('mongoose');
const cheerio = require('cheerio');
const shell = require('shelljs');
const sleep = require('await-sleep');

const { enums } = require('../../../configs/enums');
const { GerenciadorFila } = require('../../../lib/filaHandler');
// const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Logger, Cnj, Helper } = require('../../../lib/util');
const { LogExecucao } = require('../../../lib/logExecucao');
// const { ExtratorBase } = require('../../extratores/extratores');
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const { downloadFiles } = require('../../../lib/downloadFiles');
const { Log } = require('../../../models/schemas/logsEnvioAWS');
const desligado = require('../../../assets/jte/horarioRoboJTE.json');

/**
 * Logger para console e arquivo
 */
let logger;

const logarExecucao = async (execucao) => {
  await LogExecucao.salvar(execucao);
};
const fila = new CriaFilaJTE();
var listaArquivo = [];


// Filas a serem usadas
const nomeFila = `Fila.axios.JTE`;
const reConsumo = `Fila.axios.JTE`;
const filaAxios = "Fila.axios.JTE"

var heartBeat = 0; // Verifica se a aplicação esta consumindo a fila, caso não ele reinicia o worker

var logadoParaIniciais = false; // Marca se estamos logados para baixar documentos

var catchError = 0; // Captura erros;
var start = 0; // server de marcador para as funções que devem carregar na inicialização

(async () => {
  setInterval(async function () {
    if (start == 0) {
      // if (!desligado.worker.find(element => element == relogio.hora) && start == 0) {
      start = 1;
      console.log(nomeFila);
      await worker(nomeFila);
    } else {
      //console.log("aguardando para ligar");
    }
  }, 6000);
})();

async function worker(nomeFila) {


  // try {
  // função que reinicia a aplicação caso ela fique parada sem consumir a fila.
  setInterval(function () {
    heartBeat++;
    //console.log(`setInterval: Ja passou ${heartBeat} segundos!`);
    if (logadoParaIniciais == false) {
      if (heartBeat > 200) {
        console.log(
          '----------------- Fechando o processo por inatividade -------------------'
        );
        // throw "erro de time"
        process.exit();
      }
    } else {
      if (heartBeat > 200) {
        console.log(
          '----------------- Fechando o processo por inatividade -------------------'
        );
        // throw "erro de time"
        process.exit();
      }
    }
  }, 1000);

  // liga ao banco de dados
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose.connection.on('error', (e) => {
    console.log(e);
  });


  // tudo que está abaixo é acionado para cada consumer na fila.
  await new GerenciadorFila(false, 5).consumir(nomeFila, async (ch, msg) => {
    try {

      let message = JSON.parse(msg.content.toString());
      // console.log(message);
      console.log(message.numeroProcesso);

      let numeroProcesso = message.numeroProcesso.replace(/\-|\./gmi, "");
      let nometeste = message.movimentacao.replace(/.+(\|.)/img, "") + '.pdf';
      let nome = nometeste.replace(/\//img, " ")
      let links = message.link
      let tipo = message.tipo

      let logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
        nomeRobo: enums.nomesRobos.JTE,
        NumeroDoProcesso: message.NumeroProcesso,
      });

      logger.info('Mensagem recebida');



      for (let w = 0; w < 1; w++) {
        // Criando fila para Download de documentos

        let local = '/home/aurelio/crawlers-bigdata/downloads';
        // let local = '/app/downloads';

        if (tipo != 'HTML') {
          await new downloadFiles().download(nome, links, local);
          listaArquivo.push({
            url: links,
            path: `${local}/${nome}`,
          });
        } else if (tipo == 'HTML') {
          // await new downloadFiles().covertePDF(nome, local, linkDocumento)
          // listaArquivo.push({
          //   url: linkDocumento,
          //   path: `${local}/${nome}`
          // })
        }
      }
      logger.info('Iniciando envio para AWS');
      // enviar para AWS
      let cnj = numeroProcesso;

      const envioAWS = await new downloadFiles().enviarAWS(
        cnj,
        listaArquivo
      );
      if (envioAWS) {
        await new downloadFiles().saveLog(
          "crawler.JTE",
          // envioAWS.status,
          200,
          envioAWS.resposta,

        )
        console.log(envioAWS);
      }
      listaArquivo = [];

      logger.info('Processo extraidos com sucesso');

      console.log('\033[1;35m  ------------ Tempo de para baixar o processo é de ' + heartBeat + ' segundos -------------');
      heartBeat = 0;
      ch.ack(msg);
      console.log('------- Estamos com : ' + catchError + ' erros ------- ');
      logger.info('\033[0;34m' + 'Finalizado processo de extração');
      desligaAgendado();
    } catch (e) {
      catchError++;
      console.log(e);

      // Salva meus erros nos logs
      logger.log('info', numeroProcesso + ' ' + e);
      console.log(
        '-------------- estamos com : ' + catchError + ' erros ------- '
      );


      // envia a mensagem para a fila de reprocessamento

      new GerenciadorFila().enviar(nomeFila, message);


      logger.info('Encontrado erro durante a execução');
      // trata erro especifico para falha na extração
      logger.info(`Error: ${e.message}`);
      logger.info('Reenviando mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem enviada ao reprocessamento');
      logger.info('\033[31m' + 'Finalizando processo de extração');
      desligaAgendado();
    }
  });
}

function desligaAgendado() {
  let relogio = fila.relogio();
  if (desligado.worker.find((element) => element == relogio.hora)) {
    //await mongoose.connection.close();
    shell.exec('pkill chrome');
    start = 0;
    console.log('vou desligar');
    process.exit();
  }
}


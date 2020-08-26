const mongoose = require('mongoose');
const cheerio = require('cheerio');
const shell = require('shelljs');
const sleep = require('await-sleep');

const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger } = require('../../lib/util');
const { LogExecucao } = require('../../lib/logExecucao');
const { Andamento } = require('../../models/schemas/andamento');
const { ExtratorBase } = require('../../extratores/extratores');
const { JTEParser } = require('../../parsers/JTEParser');
const { RoboPuppeteer3 } = require('../../lib/roboPuppeteer');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');

/**
 * Logger para console e arquivo
 */
let logger;

const logarExecucao = async (execucao) => { await LogExecucao.salvar(execucao); };
const fila = new CriaFilaJTE();
const puppet = new RoboPuppeteer3();
// Filas a serem usadas
const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos`;
const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos`;

var estadoAnterior;   // Recebe o estado atual que está sendo baixado
var estadoDaFila;     // Recebe o estado da fila
var contador = 0;     // Conta quantos processos foram abertos pelo pupperteer, para poder selecionar os botões da pagina
var heartBeat = 0;    // Verifica se a aplicação esta consumindo a fila, caso não ele reinicia o worker
let data = 1;
var logadoParaIniciais = false;   // Marca se estamos logados para baixar documentos
var testeErros1 = []; // Contador de erros
var testeErros2 = []; // Contador de erros
var resultado = [];
var contadorErros = 0;  // Conta a quantidade de erros para reiniciar a aplicação
var catchError = 0;   // Captura erros;

// posso aplicar condições para rodar o worker
if (data == 1) {
  worker();
}

async function worker() {
  // função que reinicia a aplicação caso ela fique parada sem consumir a fila.
  setInterval(function () {
    heartBeat++;
    //console.log(`setInterval: Ja passou ${heartBeat} segundos!`);
    if (logadoParaIniciais == false) {
      if (heartBeat > 90) { console.log('----------------- Fechando o processo por inatividade -------------------'); process.exit(); }
    } else {
      if (heartBeat > 360) { console.log('----------------- Fechando o processo por inatividade -------------------'); process.exit(); }
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


  
  // parei aqui



  await puppet.iniciar();
  await sleep(3000);
  await puppet.acessar('https://jte.csjt.jus.br/');
  await sleep(3000);


  // const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos`;
  // const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos`;

  // tudo que está abaixo é acionado para cada processo na fila.
  contador = 0;
  await new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    contadorErros++;
    heartBeat = 0;  // Zero o Contador indicando que a aplicação esta consumindo a fila.
    let dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let novosProcesso = message.NovosProcessos;
    let numeroProcesso = message.NumeroProcesso;

    console.log(
      '----------------- É busca de novo processo novo processo ' +
      novosProcesso
    );
    let logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      NumeroDoProcesso: message.NumeroProcesso,
    });

    try {
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      //-------------------------------------------------- inicio do extrator--------------------------------------------
      if (contador == 0) {
        estadoAnterior = puppet.processaNumero(numeroProcesso).estado;
      }
      console.log('O estado atual é o numero: ' + estadoAnterior);

      // verifica qual é o estado de origem do pedido de raspagem.
      estadoDaFila = puppet.processaNumero(numeroProcesso).estado;

      if (estadoDaFila != estadoAnterior) {
        await puppet.mudaTribunal(estadoDaFila);
        await sleep(1000);
        contador = 0;
      }

      estadoAnterior = estadoDaFila;
      console.log('O estado atual é o numero: ' + estadoAnterior);
      await teste(message);

      async function teste(message) {
        var resultadoExtracao = {};
        let numeroProcesso = message.NumeroProcesso;

        // loga no tribunal de arranque se for a primeira chamada da fila
        if (contador == 0) {
          await puppet.preencheTribunal(numeroProcesso);
          await sleep(1000);
        }

        let dadosProcesso;
        var processo;
        let parser = new JTEParser();

        logger = new Logger('info', 'logs/ProcJTE/ProcJTE.log', {
          nomeRobo: enums.nomesRobos.JTE,
          numeroProcesso: numeroProcesso,
        });
        let objResponse = await puppet.preencheProcesso(
          numeroProcesso,
          contador
        );
        let $ = cheerio.load(objResponse.geral);
        let $2 = cheerio.load(objResponse.andamentos);
        dadosProcesso = parser.parse($, $2, contador);
        if (!!objResponse) contador++;
        // var processo = dadosProcesso.processo
        await dadosProcesso.processo.salvar();
        //console.log(dadosProcesso.andamentos[0]);
        await Andamento.salvarAndamentos(dadosProcesso.andamentos);
        processo = await dadosProcesso.processo.salvar();
        // if (new Date().getDate() == dadosProcesso.processo.capa.dataDistribuicao.getDate()) {
        // após que todas as comarcas estiverem no mes corrente aplicar o código acima
        if (
          new Date(2020, 1, 20) < dadosProcesso.processo.capa.dataDistribuicao
        ) {
          //console.log('ok');
          await new CriaFilaJTE().salvaUltimo({
            numeroProcesso: dadosProcesso.processo.detalhes.numeroProcesso,
            dataCadastro: dadosProcesso.processo.capa.dataDistribuicao,
            origem: dadosProcesso.processo.detalhes.origem,
            tribunal: dadosProcesso.processo.detalhes.tribunal,
            data: {
              dia: dadosProcesso.processo.capa.dataDistribuicao.getDate(),
              mes: dadosProcesso.processo.capa.dataDistribuicao.getMonth(),
            },
          });
        }
        // let link = await puppet.pegaInicial()
        // await console.log(link.length);
        // for (let w = 0; w < link.length; w++) {
        //     console.log("entrou no laço");
        //     await new CriaFilaJTE().salvaDocumentoLink(link[w])
        //     await console.log("O link " + w + " Foi salvo");
        // }

        logger.info('Processos extraidos com sucesso');
        if (!!dadosProcesso) {
          resultadoExtracao = {
            resultado: processo,
            sucesso: true,
            logs: logger.logs,
          };
        }

        //-------------------------------------------------- Fim do extrator--------------------------------------------
        if (!!dadosProcesso)
          await console.log(
            '\033[0;32m' +
            'Resultado da extração ' +
            '\033[0;34m' +
            !!resultadoExtracao +
            '\033[0m'
          );

        logger.logs = [...logger.logs, ...resultadoExtracao.logs];
        logger.info('Processo extraido');

        let extracao = await Extracao.criarExtracao(
          message,
          resultadoExtracao,
          message.SeccionalProcesso
        );
        //console.log(extracao);
        //console.log(resultadoExtracao.resultado.processo.detalhes);

        logger.info('Resultado da extracao salva');

        logger.info('Enviando resposta ao BigData');
      }

      //---------------------------------------------------------envio do big data tem que ser desativado ao trabalhar externo--------------------------------------------
      // const resposta = await Helper.enviarFeedback(
      //     extracao.prepararEnvio()
      // ).catch((err) => {
      //     //console.log(err);
      //     //throw new Error(`JTE - Erro ao enviar resposta ao BigData - Processo: ${message.NumeroProcesso}`)
      // });
      // logger.info('Resposta enviada ao BigData');
      // logger.info('Reconhecendo mensagem ao RabbitMQ');

      // logger.info('Mensagem reconhecida');
      // logger.info('Finalizando processo');

      // tentar reativar codigo
      // await logarExecucao({
      //   Mensagem: message,
      //   DataInicio: dataInicio,
      //   DataTermino: new Date(),
      //   status: 'OK',
      //   logs: logger.logs,
      //   NomeRobo: enums.nomesRobos.JTE
      // });
      console.log("\033[1;35m  ------------ Tempo de para baixar o processo é de " + heartBeat + " segundos -------------");
      ch.ack(msg);
      // await new CriaFilaJTE().salvaUltimo({
      //     NumeroProcesso: dadosProcesso.processo.detalhes.numeroProcesso,
      //     DataCadastro: dadosProcesso.processo.capa.dataDistribuicao,
      // })
      console.log('-------------- estamos com : ' + catchError + ' erros');
    } catch (e) {
      catchError++;
      // vai avaliar se o contador está sequencial
      errosSequencia(catchError, contadorErros);
      console.log(e);
      console.log('-------------- estamos com : ' + catchError + ' erros');
      if (catchError > 4) {
        //new RoboPuppeteer3().finalizar()
        await mongoose.connection.close()
        shell.exec('pkill chrome');
        process.exit();
      }
      // envia a mensagem para a fila de reprocessamento

      console.log(
        '----------------- É busca de novo processo novo processo ' +
        novosProcesso
      );
      if (!novosProcesso) {
        new GerenciadorFila().enviar(reConsumo, message);
      }

      logger.info('Encontrado erro durante a execução');
      // trata erro especifico para falha na extração
      let error01 =
        "TypeError: Cannot read property 'length' of undefined at /app/workers/JTE/extracaoNovos_Sp_2.js:48:25 at async /app/lib/filaHandler.js:96:11";
      if ((e = error01)) {
        logger.info((erro01 = '\033[31m' + 'Extração Falhou'));
      }
      logger.info(`Error: ${e.message}`);
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      logger.info('Mensagem reconhecida');
      logger.info('Finalizando processo');
      //console.log(message.LogConsultaId);
      // await logarExecucao({
      //   LogConsultaId: message.LogConsultaId,
      //   Mensagem: message,
      //   DataInicio: dataInicio,
      //   DataTermino: new Date(),
      //   status: e.message,
      //   error: e.stack.replace(/\n+/, ' ').trim(),
      //   logs: logger.logs,
      //   NomeRobo: enums.nomesRobos.JTE
      // });

      ch.ack(msg);
    }
  });
}

function errosSequencia(catchError, contadorErros) {
  //let testeErros1 = [];
  console.log(testeErros1);
  //let testeErros2 = [];
  console.log(testeErros2);
  //let resultado = [];
  console.log(resultado);
  testeErros1.push(catchError);
  testeErros2.push(contadorErros);
  if (testeErros1.length > 3) {
    let sequencia1 = [
      testeErros1.length,
      testeErros1.length - 1,
      testeErros1.length - 2,
    ];
    let sequencia2 = [
      testeErros2.length,
      testeErros2.length - 1,
      testeErros2.length - 2,
    ];
    for (mm in sequencia1) {
      resultado.push(sequencia1[mm] - sequencia2[mm]);
    }
    let sequencia = resultado[2] - resultado[1];
    if (sequencia == 1) {
      process.exit();
    }
  }
}

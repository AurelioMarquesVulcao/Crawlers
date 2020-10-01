const mongoose = require('mongoose');
const cheerio = require('cheerio');
const shell = require('shelljs');
const sleep = require('await-sleep');

const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger, Cnj } = require('../../lib/util');
const { LogExecucao } = require('../../lib/logExecucao');
const { Andamento } = require('../../models/schemas/andamento');
const { ExtratorBase } = require('../../extratores/extratores');
const { JTEParser } = require('../../parsers/JTEParser');
const { RoboPuppeteer3 } = require('../../lib/roboPuppeteer copy');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { downloadFiles } = require('../../lib/downloadFiles');
const desligado = require('../../assets/jte/horarioRoboJTE.json');

/**
 * Logger para console e arquivo
 */
let logger;

const logarExecucao = async (execucao) => { await LogExecucao.salvar(execucao); };
const fila = new CriaFilaJTE();
const puppet = new RoboPuppeteer3();
const util = new Cnj();
// Filas a serem usadas
const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos.D`;
const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos.D`;

var estadoAnterior;   // Recebe o estado atual que está sendo baixado
var estadoDaFila;     // Recebe o estado da fila
var contador = 0;     // Conta quantos processos foram abertos pelo pupperteer, para poder selecionar os botões da pagina
var heartBeat = 0;    // Verifica se a aplicação esta consumindo a fila, caso não ele reinicia o worker
let data = 1;
var logadoParaIniciais = false;   // Marca se estamos logados para baixar documentos
var testeErros1 = []; // Contador de erros
var testeErros2 = []; // Contador de erros
var contadorErros = 0;  // Conta a quantidade de erros para reiniciar a aplicação
var resultado = [];
var catchError = 0;   // Captura erros;
var start = 0;        // server de marcador para as funções que devem carregar na inicialização




(async () => {
  setInterval(async function () {
    let relogio = fila.relogio();
    if (!desligado.worker.find(element => element == relogio.hora) && start == 0) {
      start = 1;
      await worker();
    } else {
      //console.log("aguardando para ligar");
    }
  }, 6000);

})()


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


  // Ligando o puppeteer.
  await puppet.iniciar();
  await sleep(3000);
  await puppet.acessar('https://jte.csjt.jus.br/');
  await sleep(3000);



  contador = 0;
  // tudo que está abaixo é acionado para cada consumer na fila.
  await new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    contadorErros++;
    heartBeat = 0;  // Zero o Contador indicando que a aplicação esta consumindo a fila.
    let dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let novosProcesso = message.NovosProcessos;
    let numeroProcesso = message.NumeroProcesso;

    let logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      NumeroDoProcesso: message.NumeroProcesso,
    });

    logger.info('Mensagem recebida');
    logger.info('É busca de novo processo novo processo ' + novosProcesso);
    // const extrator = ExtratorFactory.getExtrator(nomeFila, true);


    logger.info('Iniciando processo de extração');
    //-------------------------------------------------- inicio do extrator--------------------------------------------
    try {
      // Quando o worker liga, ele marca qual o primeiro estado da fila
      if (contador == 0) {
        estadoAnterior = puppet.processaNumero(numeroProcesso).estado;
      }
      logger.info('O primeiro Estado é o numero: ' + estadoAnterior);

      // verifica qual é o estado de origem do pedido de raspagem.
      estadoDaFila = puppet.processaNumero(numeroProcesso).estado;

      if (estadoDaFila != estadoAnterior) {
        await mongoose.connection.close()
        await puppet.mudaTribunal(estadoDaFila);
        await sleep(1000);
        contador = 0;
      }

      // // desliga o worker para parar de baixar as iniciais
      // // if (message.inicial == true && logadoParaIniciais == true) {
      if (!message.NovosProcessos && logadoParaIniciais == true) {
        logadoParaIniciais = false;
        await mongoose.connection.close()
        process.exit();
      }
      // reinicia o worker para baixarmos os processos iniciais.
      // if (message.inicial == true && contador != 0 && logadoParaIniciais == false) {
      if (message.NovosProcessos == true && contador != 0 && logadoParaIniciais == false) {
        //console.log('vou deslogar a aplicação ----01');
        await mongoose.connection.close()
        process.exit();
      }

      estadoAnterior = estadoDaFila;
      logger.info('O Estado do consumer é o numero: ' + estadoAnterior);
      await extrator(message);

      async function extrator(message) {
        var resultadoExtracao = {};
        let numeroProcesso = message.NumeroProcesso;

        // loga no tribunal de arranque se for a primeira chamada da fila
        if (start == 1) {
          logger.info('Iniciando processo de logar no tribunal');
          await puppet.preencheTribunal(numeroProcesso);
          start = 2
          logger.info('Loggin no tribunal realizado com sucesso');
          await sleep(1000);
        }

        // loga para pegar iniciais
        // if (message.inicial == true  && logadoParaIniciais == false) {
        // condicional provisório para testes
        //console.log(logadoParaIniciais);
        logger.info("Logando para pegar documentos iniciais")
        if (message.NovosProcessos == true && logadoParaIniciais == false) {
          await puppet.loga();
          logadoParaIniciais = true;
        }


        // caregando as variaveis que receberam os dados do parser
        let dadosProcesso;
        var processo;
        let parser = new JTEParser();

        // aqui verifico se o processo existe.
        // caso exista eu obtenho o html da capa e dos andamentos como resposta.
        let objResponse = await puppet.preencheProcesso(
          numeroProcesso,
          contador,
        );
        logger.info("Execuntando Parser do processo");
        let $ = cheerio.load(objResponse.geral);
        let $2 = cheerio.load(objResponse.andamentos);
        dadosProcesso = parser.parse($, $2, contador);
        logger.info("Parser executado com sucesso.");

        if (!!objResponse) contador++;

        // if (message.inicial != true) {
        //   // condicional provisório para testes1
        //   // if (message.inicial != true) {
        //   // if (message.NovosProcessos != true) {
        //   logger.info("Enviando dados para o banco de dados.")
        //   await dadosProcesso.processo.salvar();
        //   //console.log(dadosProcesso.andamentos[0]);
        //   await Andamento.salvarAndamentos(dadosProcesso.andamentos);
        //   processo = await dadosProcesso.processo.salvar();
        //   // if (new Date().getDate() == dadosProcesso.processo.capa.dataDistribuicao.getDate()) {
        //   // após que todas as comarcas estiverem no mes corrente aplicar o código acima
        //   logger.info("Sucesso ao enviar para o banco de dados.")

        //   // salvando status
        //   let numeroAtualProcesso = dadosProcesso.processo.detalhes.numeroProcesso;
        //   let dataAtualProcesso = dadosProcesso.processo.capa.dataDistribuicao;
        //   let cnj = util.processoSlice(numeroAtualProcesso);
        //   let buscaProcesso = { "estadoNumero": cnj.estado, "comarca": cnj.comarca };
        //   await fila.salvaStatusComarca(numeroAtualProcesso, dataAtualProcesso, "", buscaProcesso);

        //   // Enviando para Collection de controle *ultimosProcessos*
        //   if (new Date(2020, 1, 20) < dadosProcesso.processo.capa.dataDistribuicao) {
        //     logger.info("Salvando na Collection ultimosProcessos")
        //     await new CriaFilaJTE().salvaUltimo({
        //       numeroProcesso: dadosProcesso.processo.detalhes.numeroProcesso,
        //       dataCadastro: dadosProcesso.processo.capa.dataDistribuicao,
        //       origem: dadosProcesso.processo.detalhes.origem,
        //       tribunal: dadosProcesso.processo.detalhes.tribunal,
        //       data: {
        //         dia: dadosProcesso.processo.capa.dataDistribuicao.getDate(),
        //         mes: dadosProcesso.processo.capa.dataDistribuicao.getMonth(),
        //       },
        //     });
        //   }
        // }



        // if (message.inicial == true) {
        // condicional provisório para testes
        if (message.NovosProcessos == true) {
          console.log('---------- Vou baixar link das iniciais-------');
          let link = await puppet.pegaInicial();
          // console.log(link);
          let listaArquivo = [];
          //await console.log(link.length);
          for (let w = 0; w < link.length - 1; w++) {
            // console.log(link[w]);
            await new CriaFilaJTE().salvaDocumentoLink(link[w]);
            let nome = link[w].numeroProcesso.replace(/[-.]/g, "") + "-" + w + ".pdf";
            let linkDocumento = link[w].link;
            let local = '/home/aurelio/crawlers-bigdata/downloads'
            let tipo = link[w].tipo;
            if (tipo == 'pdf') {
              await new downloadFiles().download(nome, linkDocumento, local)
              listaArquivo.push({
                url: linkDocumento,
                path: `${local}/${nome}`
              })
            } else if (tipo == 'HTML') {
              await new downloadFiles().covertePDF(nome, local, linkDocumento)
              listaArquivo.push({
                url: linkDocumento,
                path: `${local}/${nome}`
              })
            }
            await console.log('O link ' + w + ' Foi salvo');
          }
          // enviar para AWS
          await new downloadFiles().enviarAWS(cnj, listaArquivo)
        }

        logger.info('Processo extraidos com sucesso');
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
            !!resultadoExtracao);

        logger.logs = [...logger.logs, ...resultadoExtracao.logs];
        logger.info('Processo extraido');

        let extracao = await Extracao.criarExtracao(
          message,
          resultadoExtracao,
          message.SeccionalProcesso
        );

        logger.info('Resultado da extracao salva');

        //logger.info('Enviando resposta ao BigData');
      }

      //---------------------------------------------------------envio do big data tem que ser desativado ao trabalhar externo--------------------------------------------
      console.log("\033[1;35m  ------------ Tempo de para baixar o processo é de " + heartBeat + " segundos -------------");
      logger.info('Verificando se o processo é RJ');
      enfileirarTRT_RJ(numeroProcesso);

      ch.ack(msg);
      console.log('------- Estamos com : ' + catchError + ' erros ------- ');
      logger.info('\033[0;34m' + 'Finalizado processo de extração');
      desligaAgendado();

    } catch (e) {
      catchError++;
      // console.log(e)
      if (e == "ultimo processo") {
        catchError--;
        // salvando status 
        let numeroAtualProcesso = numeroProcesso;
        let dataAtualProcesso = "";
        let cnj = util.processoSlice(numeroProcesso);
        let buscaProcesso = { "estadoNumero": cnj.estado, "comarca": cnj.comarca };
        await fila.salvaStatusComarca(numeroAtualProcesso, dataAtualProcesso, true, buscaProcesso);
      }
      // Salva meus erros nos logs
      logger.log("info", numeroProcesso + " " + e);
      console.log('-------------- estamos com : ' + catchError + ' erros ------- ');
      // caso o puppeteer fique perdido na sequencias de clicks nós o reiniciamos.
      if (catchError > 4) {
        //new RoboPuppeteer3().finalizar()
        await mongoose.connection.close()
        shell.exec('pkill chrome');
        process.exit();
      }

      // envia a mensagem para a fila de reprocessamento
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
      logger.info('Reenviando mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem enviada ao reprocessamento');
      logger.info('\033[31m' + 'Finalizando processo de extração');
      desligaAgendado()

    }
  });
}

function desligaAgendado() {
  let relogio = fila.relogio()
  if (desligado.worker.find(element => element == relogio.hora)) {
    //await mongoose.connection.close();
    shell.exec('pkill chrome');
    start = 0;
    console.log("vou desligar");
    process.exit();
  }
}

function enfileirarTRT_RJ(numero) {
  let regex = (/([0-9]{7})([0-9]{2})(2020)(5)(01)([0-9]{4})/g.test(numero))
  //console.log(regex);
  if (regex) {
    let mensagem = criaPost(numero);
    fila.enviarMensagem("fila TRT-RJ", mensagem);
    console.log("Processo enfileirado para Download");
  }
  function criaPost(numero) {
    let post = `{
      "ExecucaoConsultaId" : "${makeid()}",
      "ConsultaCadastradaId" : "${makeid()}",
      "DataEnfileiramento" : "${new Date}",
      "NumeroProcesso" : "${numero}",
      "NumeroOab" : "null",        
      "SeccionalOab" : "SP",
      "NovosProcessos" : true}`
    return post
  }

  function makeid() {
    let text = "5ed9";
    let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    let letra = "abcdefghijklmnopqrstuvwxyz";
    let numero = "0123456789";
    for (var i = 0; i < 20; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }
}
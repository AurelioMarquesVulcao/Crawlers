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
const purple = '\u001b[35m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';

const logarExecucao = async (execucao) => {
  await LogExecucao.salvar(execucao);
};
const fila = new CriaFilaJTE();
var listaArquivo = [];


// Filas a serem usadas
const nomeFila = `peticao.JTE.extracao.links-01`;
const reConsumo = `peticao.JTE.extracao.links-01`;
const filaAxios = "peticao.JTE.extracao.links-01"

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
  await new GerenciadorFila(false, 1).consumir(nomeFila, async (ch, msg) => {
    try {
      await sleep(2000);
      let message = JSON.parse(msg.content.toString());
      // let message = {
      //   numeroProcesso: '1001359-62.2020.5.02.0720',
      //   data: '27/11/2020 14:00:06',
      //   movimentacao: 'Termo de Rescisão de Contrato de Trabalho (TRCT) | Termo de Rescisão de Contrato de Trabalho (TRCT) (RESTRITO) [ 73830b2 ]',
      //   link: 'https://jte.trt2.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%277s/kTgCQcC86iUw9FW%2BxnXbi/B85vWV8QEBHuM3ObgoJ8lCzEQpjqOgEHQhxRs1LADm6WEA73AvRFv/zI9b9B0877lUunqs3IC7jhejLvmLYMhZVWmRFyNC2btra3uUG45djCkAdhKZ3BcamFn/DQvBaJC3DZUMPNeHAFP12QfcivaDmd%2BCvKJM6OQcXYUhvZNtBwNWhLevW4%2BaDTgDv%2BLvLE8rzy40TLKJ8Xoq1C6nA2Ih7/PMJL%2BH8CWsKeOxu7UYmaO0JcSETgfmXGwfl2q0/YzX%2BkUdwOJQG%2BmrzxJNnJazB7vd7O0ZZ0AhWFZJmFc%2BXUA4Gy83rgpLspOc7mt1pS0UWBmJf1pY/iu1vueWctGl%2BGv2%2BXFjrQGPF/Sch49Zw61H%2BPxmnUf9PzvE6M6Xut39fdiV2IvpOaVbAgepQDoY9S735g1tWB5R5rrmTU6WOllFDj6ejXpBP0XqMaztREzMcwi8EtrfRylzJji03qvSGuXEa0nKy9CAWhkfnTyPBtk0C1A5xnpM7Ph/Ge4c6MoobQEKlxdqQ06DAZk9lyjpCleyKQ31vafq6ahAEe/IXVrctPQhnBaqLDkaTgtHLLEOqyv4UHnQUGGIDZWwrpqUvmOTzpe3CB2t7MPegoGrLD97%2BGQKZTbicB6AfaDrswIag7SK%2BnprIDdmhY3bi0%2B7uEXHP%2BHvwVm9gZTu/V5wDV9aXj5R93S4j9387/FgXj/RhoPuHqyEMCBTe676EnVF3G8EY1EjkYvmbPXnfl09QoOaYwpCBBJOD56LhF2tWzSESnh4ZJgvu7oPxEpT2V5Hy5M3VIenb09VMNfbpys/i4reFqfLcXsZU2NDLsEZ6cPdZNT1%2BB/7gxWIq5rUKTK%2BcilFfj5A/eZ8//bol3lmtXFmzdHNfdV3CVh4mIAgHpAWT/3mpbRXQGuTXTNLYNtBhSx/c%2B47YZllwAgU41HJVf4i4OkrOxYRZVgCEhwjo/eD5XYvdWILRafDz9qHk1rxrx5c2tmhRapLv%2Bt8QWyZCf514WrULB6KdJcIBsWPoBJtjKg0KSwGIk2nvUHt7ow0eeWC/WPuah0qbXM6Tr4mQPj%2BjJctopweDJNenAJSF54gCrWwzJsiU55Yn1tm8jyO%2ByKnaULQ24T9F%2BSIVmLZ%2BZK40dF2kyj0dTeg4VhGO7gXTJ9qpSF3FpmJOGAu7eN/hqSgEGSk7f3QMuvh3/KvGUCEN4Mb0Mz%2BV3wkFKaWLyNSGpXtcYUffNz2kFdjr%2BVUsxxMhRTGv7x5NGDPAx63baJgVKPFvTCNEdScVKIyT3RDCu7ByBIhk5eLI%2B8PFDinBBjI6hXt8jwCuNjrWHOT1/Y6O3xbGBkFRFbxM3S1ojUja%2BXvpIqwLfGkgTT8v6XqLOhpX42RG%2B9U/yRKDDtWjSy2Wg7BvEtN1VglZrN/FhZ0hX7qBGIrb/bWNaxEyC2je53jNJ908EvdZEYRFQGNVEY1uFCImu6Ih8/B4yfxwDXsPk22q9%2BcypBv9qnLrJFIOUzRqRPPPEpMYkL78HBAgFMv%2BJphmq%2BGBjg4LFY9rPwGjztDPvlwRKRIS9fmzA8xYPrhbgGizVVcAtJCR2eauAOrm8PFePllZpspWpuWjga9EA0HE4Z48xNYV%2BvUHWXPJ%2BZ4mJvsRuLW%2Bzy2aZbe%2BayqkpX3keA2hOIG/jaLij%2B5DahcwuODk35/IGmd6F3%2BurukQcFgKDgh2GHGRTZKzccJvVKeJmVG4U2QwGZtmRVmz4GedyEOOnNeYXyM5qtevvfIdfygFOSZ7UCcUgyolpWtSiDh6SKj5cGjZaV3A4uIPLcuEFhjTqzT6Zuma59zWW9XK14R4HF4486zCmkJ6GpjhLc1BwnPwIcUMod4i3udnu0Yb2Dju0vorV0yhaCE8XV8ZTIeMvokAhLc6i7vnE5ONRdmOMDJdI3jsxJlTSWWYzR7CvB5lJy71y/tA38HflxQ2vklXxKSSiDE79ppV9x76tdriRPyVz%2BdR6rKExqFVTPDrbafpdqVLibuIgCKl625s8XE/WUjgHmZ/%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINZAgCvE2zKpq54zKhMStCSs7zamr0cl/Lmijfr%2B%2BDoC57NBHAjnJgQHJgMedO2GIVQ==%27%22}&Host=jte.trt2.jus.br',
      //   tipo: 'pdf'
      // };

      // console.log(message);
      console.log(message.numeroProcesso);
      console.log(message.link.slice(0, 6));
      if (message.link.slice(0, 6) == "unsafe") {
        console.log("laço");
        ch.ack(msg);
      } else {




        let numeroProcesso = message.numeroProcesso.replace(/\-|\./gmi, "");
        let nometeste1 = message.movimentacao.replace(/.+(\|.)/img, "");
        let nometeste2 = nometeste1.replace(/[\s\[\s\]\(\)]/img, "");
        let nome = nometeste2.replace(/\//img, " ") + '.pdf'
        let links = message.link
        let tipo = message.tipo

        let logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
          nomeRobo: enums.nomesRobos.JTE,
          NumeroDoProcesso: message.NumeroProcesso,
        });

        logger.info('Mensagem recebida');



        for (let w = 0; w < 1; w++) {
          // Criando fila para Download de documentos

          // let local = '/home/aurelio/crawlers-bigdata/app/downloads';
          let local = '/app/downloads';

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
        await sleep(1000)
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

        console.log(purple + '  ------------ Tempo de para baixar o processo é de ' + heartBeat + ' segundos -------------' + reset);
        heartBeat = 0;
        ch.ack(msg);
        console.log('------- Estamos com : ' + catchError + ' erros ------- ');
        logger.info(blue + 'Finalizando processo de extração' + reset);
        desligaAgendado();
      }
    } catch (e) {
      catchError++;
      console.log(e);

      // Salva meus erros nos logs
      logger.log('info', numeroProcesso + ' ' + e);
      console.log('-------------- estamos com : ' + catchError + ' erros ------- ');

      // envia a mensagem para a fila de reprocessamento

      new GerenciadorFila().enviar(nomeFila, message);


      logger.info('Encontrado erro durante a execução');
      // trata erro especifico para falha na extração
      logger.info(`Error: ${e.message}`);
      logger.info('Reenviando mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem enviada ao reprocessamento');
      logger.info(blue + 'Finalizando processo de extração' + reset);
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


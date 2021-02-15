const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const sleep = require('await-sleep');

const { Andamento } = require('../../../models/schemas/andamento');
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const { enums } = require('../../../configs/enums');
const { FluxoController } = require('../../../lib/fluxoController');
const { Extracao } = require('../../../models/schemas/extracao');
const { GerenciadorFila } = require('../../../lib/filaHandler');
const { Logger, Cnj, Helper } = require('../../../lib/util');
const { JTEParser } = require('../../../parsers/JTEParser');
const { RoboPuppeteer3 } = require('../../../lib/roboPuppeteeJTEDoc');
const { Processo } = require('../../../models/schemas/processo');

const fila = new CriaFilaJTE();
const puppet = new RoboPuppeteer3();
const util = new Cnj();
// Filas a serem usadas
const nomeFila = `peticao.JTE.extracao.${process.argv[2]}`;
const filaAxios = 'peticao.JTE.extracao.links-01';

var estadoAnterior; // Recebe o estado atual que está sendo baixado
var estadoDaFila; // Recebe o estado da fila
var contador = 0; // Conta quantos processos foram abertos pelo pupperteer, para poder selecionar os botões da pagina
var heartBeat = 0; // Verifica se a aplicação esta consumindo a fila, caso não ele reinicia o worker
var logadoParaIniciais = false; // Marca se estamos logados para baixar documentos
var contadorErros = 0; // Conta a quantidade de erros para reiniciar a aplicação
var catchError = 0; // Captura erros;
var start = 0; // server de marcador para as funções que devem carregar na inicialização
var dataInicio = new Date(Date.now() - 1000 * 3 * 60 * 60);

(async () => {
  setInterval(async function () {
    if (start == 0) {
      start = 1;
      await worker(`peticao.JTE.extracao.${process.argv[2]}`);
    } else {
    }
  }, 6000);
})();

async function worker(nomeFila) {
  // liga ao banco de dados
  try {
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (e) => {
      console.log(e);
    });
  } catch (e) {
    // se não tiver conexão com o BigData eu sai da aplicação
    process.exit();
  }

  // Ligando o puppeteer.
  await puppet.iniciar();
  console.log('INICIAR');
  await sleep(3000);
  await puppet.acessar('https://jte.csjt.jus.br/');
  console.log('ACESSAR');
  await sleep(3000);

  contador = 0;

  // tudo que está abaixo é acionado para cada consumer na fila.
  await new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    try {
      var message = JSON.parse(msg.content.toString());
      let numeroProcesso = message.NumeroProcesso;
      let logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
        nomeRobo: enums.nomesRobos.JTE,
        NumeroDoProcesso: message.NumeroProcesso,
      });
      console.table(message);
      logger.info('Mensagem recebida');

      contadorErros++;
      heartBeat = 0; // Zera o Contador indicando que a aplicação esta consumindo a fila.

      logger.info('Iniciando processo de extração');
      //-------------------------------------------------- inicio do extrator--------------------------------------------

      // Quando o worker liga, ele marca qual é o primeiro estado da fila
      if (contador == 0) {
        estadoAnterior = puppet.processaNumero(numeroProcesso).estado;
      }

      // verifica qual é o estado de origem do pedido de raspagem.
      estadoDaFila = puppet.processaNumero(numeroProcesso).estado;

      if (
        message.inicial == true &&
        contador != 0 &&
        logadoParaIniciais == false
      ) {
        await mongoose.connection.close();

        const error = new Error('Erro variado');
        error.code = 'erro qualquer';
        throw error;
      }
      estadoAnterior = estadoDaFila;

      await extrator(message);

      async function extrator(message) {
        logger.info('Iniciando extrator');
        var resultadoExtracao = {};
        let numeroProcesso = message.NumeroProcesso;

        puppet.resetLogs();
        // loga no tribunal de arranque se for a primeira chamada da fila
        if (start == 1) {
          logger.info('Iniciando processo de logar no tribunal');
          await puppet.preencheTribunal(numeroProcesso);
          start = 2;
          logger.info('Loggin no tribunal realizado com sucesso');
          await sleep(1000);
        }
        // loga para pegar iniciais
        if (message.inicial == true && logadoParaIniciais == false) {
          logger.info('Logando para pegar documentos iniciais');
          // if (message.NovosProcessos == true && logadoParaIniciais == false) {
          try {
            logger.info('Iniciando User Login');
            await puppet.loga();
            logger.addLog(puppet.allLogs());
          } catch (e) {
            logger.info('User Login Falhou!');
            console.log('entrando no fluxo2');
            await puppet.preencheTribunal1(numeroProcesso);
            console.log('segunda tentativa de login');
            // await puppet.loga();
            console.log('retorno a a comarca original');
            await puppet.preencheTribunal2(numeroProcesso);
          }

          logadoParaIniciais = true;
        }

        // carregando as variaveis que receberam os dados do parser
        let dadosProcesso;
        var processo;
        let parser = new JTEParser();
        // caso exista eu obtenho o html da capa e dos andamentos como resposta.
        logger.info('Iniciando Extração Puppteer');
        let objResponse = await puppet.extrair(numeroProcesso, contador);
        logger.info('Execuntando Parser do processo');
        let $ = cheerio.load(objResponse.geral);
        let $2 = cheerio.load(objResponse.andamentos);
        dadosProcesso = parser.parse($, $2, contador);
        logger.info('Parser executado com sucesso.');

        if (!!objResponse) contador++;

        // Atuliza dados de capa para salvar data de audiência.
        let audiencia = dadosProcesso.processo.capa.audiencias[0];
        if (!audiencia) {
          logger.info('Não possui data de audiência');
          await Processo.findOneAndUpdate(
            {
              'detalhes.numeroProcesso':
                dadosProcesso.processo.detalhes.numeroProcesso,
            },
            {
              'capa.audiencias': [
                {
                  data: '',
                  tipo: '',
                },
              ],
            }
          );
        } else {
          if (audiencia.data == 0) {
            logger.info('Não possui data de audiência');
            await Processo.findOneAndUpdate(
              {
                'detalhes.numeroProcesso':
                  dadosProcesso.processo.detalhes.numeroProcesso,
              },
              {
                'capa.audiencias': [
                  {
                    data: '',
                    tipo: '',
                  },
                ],
              }
            );
          } else {
            if (audiencia.data >= new Date()) {
              logger.info('Possui data de audiência');
              await Processo.findOneAndUpdate(
                {
                  'detalhes.numeroProcesso':
                    dadosProcesso.processo.detalhes.numeroProcesso,
                },
                {
                  'capa.audiencias': [
                    {
                      data: audiencia.data,
                      tipo: audiencia.tipo,
                    },
                  ],
                }
              );
            } else {
              logger.info('Não possui data de audiência');
              await Processo.findOneAndUpdate(
                {
                  'detalhes.numeroProcesso':
                    dadosProcesso.processo.detalhes.numeroProcesso,
                },
                {
                  'capa.audiencias': [
                    {
                      data: '',
                      tipo: '',
                    },
                  ],
                }
              );
            }
          }
        }
        // Se mudar essa parte do código posso atualizar os dados dos processo ao baixar as iniciais.
        if (message.inicial != true) {
          logger.info('Enviando dados para o banco de dados.');
          await dadosProcesso.processo.salvar();
          await Andamento.salvarAndamentos(dadosProcesso.andamentos);
          processo = await dadosProcesso.processo.salvar();
          logger.info('Sucesso ao enviar para o banco de dados.');
        }

        if (message.inicial == true) {
          logger.info('Vou baixar link das iniciais');
          console.log('---------- Vou baixar link das iniciais-------');
          puppet.resetLogs();
          let link = await puppet.pegaInicial();

          logger.addLog(puppet.allLogs());
          logger.info('Iniciais baixadas com sucesso');
          logger.info('Enviando link dos documentos para a fila');
          for (let w = 0; w < link.length; w++) {
            if (link[w]) {
              if (link[w].tipo != 'HTML') {
                link[w]['NumeroProcesso'] = `${link[w].numeroProcesso}-${w}`;
                link[w]['NomeRobo'] = filaAxios.toLowerCase();
                link[w]['Instancia'] = message.Instancia;
                // Criando fila para Download de documentos
                let execucao = await FluxoController.cadastrarExecucao(
                  filaAxios.toLowerCase(),
                  filaAxios,
                  link[w]
                );
                // await new GerenciadorFila().enviar(
                //   filaAxios,
                //   JSON.stringify(link[w])
                // );
                // console.log('valor do laço é', w, JSON.stringify(link[w]));
                logger.info(`Enviando link ${w + 1}`);
              }
            }
            await sleep(300);
          }
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
              !!resultadoExtracao
          );

        // logger.logs = [...logger.logs, ...resultadoExtracao.logs];
        logger.info('Processo extraido');
        logger.info('Salvando extracao na colection "extracoes"');
        await Extracao.criarExtracao(
          message,
          resultadoExtracao,
          message.SeccionalProcesso
        );
        logger.info('Resultado da extracao salva');
      }

      //---------------------------------------------------------envio do big data tem que ser desativado ao trabalhar externo--------------------------------------------
      console.log(
        '\033[1;35m  ------------ Tempo de para baixar o processo é de ' +
          heartBeat +
          ' segundos -------------'
      );
      logger.info('Enviando resposta ao BigData');
      // confirmação de atulização para o BigData
      await axios({
        url: `http://172.16.16.3:8083/callback/crawlersBigData/capaAtualizada/${message.NumeroProcesso}`,
        method: 'post',
        headers: {
          // 'Content-Type': 'application/json',
          'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
        },
      })
        .then((res) => {
          console.log(res.data);
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
      logger.info('Resposta enviada com sucesso ao BigData');
      ch.ack(msg);

      console.log('------- Estamos com : ' + catchError + ' erros ------- ');
      logger.info('\033[0;34m' + 'Finalizado processo de extração');
      // console.log(logger.allLog());

      await FluxoController.finalizarConsultaPendente({
        msg: message,
        dataInicio,
        dataTermino: new Date(Date.now() - 1000 * 3 * 60 * 60),
        status: 'OK',
        logs: logger.allLog(),
        nomeRobo: message.NomeRobo,
        // error: false,
      });
    } catch (e) {
      catchError++;
      console.log(e);

      // Salva meus erros nos logs
      logger.log('info', numeroProcesso + ' ' + e);
      console.log(
        '-------------- estamos com : ' + catchError + ' erros ------- '
      );

      // envia a mensagem para a fila de reprocessamento
      if (message.inicial == true) {
        new GerenciadorFila().enviar(nomeFila, message);
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
      await FluxoController.finalizarConsultaPendente({
        msg: message,
        dataInicio,
        // dataTermino: new Date(Date.now() - 1000 * 3 * 60 * 60),
        status: `Error: ${e.message}`,
        logs: logger.allLog(),
        nomeRobo: message.NomeRobo,
        error: e,
      });

      ch.ack(msg);
      logger.info('Mensagem enviada ao reprocessamento');
      logger.info('\033[31m' + 'Finalizando processo de extração');
    }
  });
}

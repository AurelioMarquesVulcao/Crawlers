const mongoose = require('mongoose');
const sleep = require('await-sleep');
const axios = require('axios');

const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { ExecucaoConsulta } = require('../../models/schemas/execucao_consulta');
const { Cnj, Logger } = require('../../lib/util');
const { ExtratorTrtPje } = require('../../extratores/processoPJE');
const { Processo } = require('../../models/schemas/processo');
const { ProcessoTRT } = require('../../models/schemas/pje');
const { TRTParser } = require('../../parsers/PJEParser');
const { reloadLogs } = require('pm2');
const { FluxoController } = require('../../lib/fluxoController');

const parse = new TRTParser();
var red = '\u001b[31m';
var blue = '\u001b[34m';
var reset = '\u001b[0m';
var log = [];
var erro = '';

/**
 * Realiza o consumo de mensagens de uma fila de processos
 * e salva seu conteudo no banco de dados
 * @param {Number} heartBeat Contador que verifica se a aplicação esta consumindo a fila, caso não ele reinicia o worker
 * @param {String} nomeFila Nome da fila que será consumida no Rabbit
 * @param {String} testeSleep Gera um numero aleatório para que os robos não façam requisições simultâneas.
 * @param {String} logger Gera um log a ser exibido no terminal de execução do robô
 * @param {Object} extracao Objeto com o resultado da extração do robô
 * @param {String} busca ID do processo que receberá os dados adiconais raspados neste processo.
 */
(async () => {
  try {
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
  }
  //const nomeFila = `fila TRT-RJ`;
  const nomeFila = `processo.PJE.atualizacao.01`;
  const reConsumo = `Reconsumo.processo.PJE.atualizacao.01`;

  new GerenciadorFila(false, 1).consumir(nomeFila, async (ch, msg) => {
    try {
      var dataInicio = new Date(Date.now() - 1000 * 3 * 60 * 60);
      var heartBeat = 0;
      // Desincroniza as requisições do robô
      let testeSleep = numeroAleatorio(1, 3);
      await sleep(testeSleep * 1000);
      // Cria um contador que reinicia o robô caso ele fique inativo por algum tempo.
      setInterval(async function () {
        heartBeat++;
        if (heartBeat > 700) {
          console.log(
            red +
              '----------------- Fechando o processo por inatividade -------------------' +
              reset
          );
          await mongoose.connection.close();
          process.exit();
        }
      }, 1000);
      // Variaveis de Robô

      var message = JSON.parse(msg.content.toString());
      // console.log(message.NumeroProcesso);
      const numeroEstado = parseInt(
        Cnj.processoSlice(message.NumeroProcesso).estado
      );

      // Valida o numero de tentativas
      let id = message.ExecucaoConsultaId;
      let find = await ExecucaoConsulta.findOne({ _id: id });
      if (find.Tentativas > 3 && message.NovosProcessos == true) {
        // console.log("matei a mensagem");
        ch.ack(msg);
      }

      // console.log(message.Tentativas);
      message.Tentativas = find.Tentativas + 1;
      // console.log(message.Tentativas);
      let busca = { _id: message._id };
      var logger = new Logger(
        'info',
        'logs/ProcessoTRTPJE/ProcessoTRTPJEInfo',
        {
          nomeRobo: enums.nomesRobos.PJE,
          NumeroDoProcesso: message.NumeroProcesso,
        }
      );
      // Exibe a mensagem a ser consumida como tabela.
      console.table(message);

      // Inicio do Robô

      logger.info('Mensagem recebida');
      logger.info('Iniciando processo de extração');
      // const extrator = ExtratorFactory.getExtrator(nomeFila, true);
      let extrator = new ExtratorTrtPje();
      let extracao = await extrator.extrair(
        message.NumeroProcesso,
        numeroEstado
      );
      logger.addLog(extrator.allLogs());
      logger.info('Extração concluída');
      logger.info('Iniciando Parse');
      // tratando a resposta do extrator
      if (/Reprocessar/.test(extracao)) {
        await new GerenciadorFila().enviar(reConsumo, message);
        await sleep(200);
        // await ch.ack(msg);
        logger.info(
          red + 'Tribunal off-line enviando para reprocessamento' + reset
        );
        await sleep(200);
      } else {
        if (extracao === null) {
          const error = new Error(
            'Extração falhou, processo será colocado na fila novamente'
          );
          error.code = 'Extração falhou';
          throw error;
        } else if (await !extracao) {
          logger.info('Não recebi extracao');
          // process.exit();
        } else if (extracao.segredoJustica === true) {
          logger.info('Atualizando Jte com os 3 campos adicionais.');
          resultado = {
            'capa.segredoJustica': extracao.segredoJustica,
            'capa.valor': '',
            'capa.justicaGratuita': null,
            origemExtracao: 'JTE.TRT',
          };
          // console.log(resultado);
          await Processo.findOneAndUpdate(busca, resultado);
          console.table({
            NumeroProcesso: message.NumeroProcesso,
            'capa.segredoJustica': extracao.segredoJustica,
            'capa.valor': '',
            'capa.justicaGratuita': null,
            origemExtracao: 'JTE.TRT',
          });
          console.log(
            blue +
              '------------------- Salvo com sucesso -------------------' +
              reset
          );
          logger.info('Processo JTE atualizado para JTE.TRT');
        } else if (extracao) {
          logger.info('Processo completo. Vamos processar todas as alterações');
          resultado = {
            'capa.segredoJustica': extracao.segredoJustica,
            'capa.valor': `${extracao.valorDaCausa}`,
            'capa.justicaGratuita': extracao.justicaGratuita,
            origemExtracao: 'JTE.TRT',
          };
          // console.log(resultado);
          await Processo.findOneAndUpdate(busca, resultado);
          console.table({
            NumeroProcesso: message.NumeroProcesso,
            'capa.segredoJustica': extracao.segredoJustica,
            'capa.valor': `${extracao.valorDaCausa}`,
            'capa.justicaGratuita': extracao.justicaGratuita,
            origemExtracao: 'JTE.TRT',
          });
          console.log(
            blue +
              '------------------- Salvo com sucesso -------------------' +
              reset
          );
          logger.info('Processo JTE atualizado para JTE.TRT');
          logger.info('Parse Iniciado');
          let dadosProcesso = await parse.parse(extracao);
          // console.log(await dadosProcesso);
          logger.info('Parse finalizado');
          logger.info('Iniciando salvamento da capa do processo');
          console.log(
            blue +
              `---------------------- Tempo de extração é de ${heartBeat} ----------------------` +
              reset
          );
          let teste = await ProcessoTRT.findOne({
            'detalhes.numeroProcesso': message.NumeroProcesso,
          });
          if (!teste) {
            await dadosProcesso.processo.save();
          }
          logger.info('Finalizado salvamento de capa de processo');
        } else {
          const error = new Error('Erro não mapeado');
          error.code = 'Extração falhou';
          throw error;
        }
        logger.info('Processos extraido com sucesso');
        console.log(
          blue +
            `---------------------- Tempo de extração é de ${heartBeat} ----------------------` +
            reset
        );
        heartBeat = 0;

        // confirmação de atulização para o BigData
        logger.info('Confirmando envio para o Big Data');
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
        logger.info('Envio para o Big Data confirmado');
      }
      await FluxoController.finalizarConsultaPendente({
        msg: message,
        dataInicio,
        dataTermino: new Date(Date.now() - 1000 * 3 * 60 * 60),
        status: 'OK',
        logs: logger.allLog(),
        nomeRobo: message.NomeRobo,
        // error: false,
      });
      // ch.ack(msg);
    } catch (e) {
      // Corrige o problema de erro de capcha, que impedia o worker de resolver captcha corretamente após errar 1 vez
      if (
        logger
          .allLog()
          .filter((y) => /Ocorreu.um.problema.na.solu..o.do.Captcha/i.test(y))
      ) {
        logger.info(
          'Não foi possivél resolver o Captcha corretamente, reiniciando o processo!'
        );
        await FluxoController.finalizarConsultaPendente({
          msg: message,
          dataInicio,
          // dataTermino: new Date(Date.now() - 1000 * 3 * 60 * 60),
          status: `Error: ${e.message}`,
          logs: logger.allLog(),
          nomeRobo: message.NomeRobo,
          error: e,
        });
        // console.log(message);
        await mongoose.connection.close();
        
        console.log(
          '------------------------------errro Captcha-----------------------------'
          );
          // ch.ack(msg);
          // await new GerenciadorFila().enviar(nomeFila, message);

        process.exit();
      }
      // if (/Captcha/i.test(e)) {

      //   process.exit();
      // }
      // console.log(e);
      this.e = e;
      logger.info('Encontrado erro durante a execução');
      logger.info(red + `Error: ${e.message}` + reset);
      heartBeat = 0;
      // Estou reprocessando automaticamente no fim da fila.
      console.log(message);
      await new GerenciadorFila().enviar(nomeFila, message);

      await FluxoController.finalizarConsultaPendente({
        msg: message,
        dataInicio,
        // dataTermino: new Date(Date.now() - 1000 * 3 * 60 * 60),
        status: `Error: ${e.message}`,
        logs: logger.allLog(),
        nomeRobo: message.NomeRobo,
        error: e,
      });

      await sleep(300);
    } finally {
      await sleep(300);
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      logger.info('Finalizando proceso');
    }
    // }
  });
})();
function numeroAleatorio(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

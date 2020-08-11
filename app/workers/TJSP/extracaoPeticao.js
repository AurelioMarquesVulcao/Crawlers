const mongoose = require('mongoose');
const sleep = require('await-sleep');

const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger } = require('../../lib/util');
const { LogExecucao } = require('../../lib/logExecucao');

const logarExecucao = async (execucao) => {
  await LogExecucao.salvar(execucao);
};

(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on('error', (e) => {
    console.log(e);
  });

  const nomeFila = `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJSP}.extracao`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    console.table(message);
    let logger = new Logger('info', 'logs/PeticaoTJSP/PeticaoTJSPInfo.log', {
      nomeRobo: `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJSP}`,
      NumeroDoProcesso: message.NumeroProcesso,
    });
    try {
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(
        message.NumeroProcesso,
        message.Instancia
      );
      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processo extraido');
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalOab
      );
      logger.info('Resultado da extracao salva');

      logger.info('Enviando resposta ao BigData');
      await Helper.enviarFeedback(
        extracao.prepararEnvio(),
        {
          NumeroDoProcesso: resultadoExtracao.numeroProcesso,
        }
      ).catch((err) => {
        console.log(err);
        throw new Error(
          `PeticaoTJSP - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroOab}`
        );
      });
      logger.info('Resposta enviada ao BigData');
      logger.info('Finalizando processo');
      await logarExecucao({
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: 'OK',
        logs: logger.logs,
        NomeRobo: 'PeticaoTJSP',
      });


    } catch (e) {
      logger.info('Encontrado erro durante a execução');
      logger.log('error',e);
      logger.info('Finalizando proceso');
      await logarExecucao({
        LogConsultaId: message.LogConsultaId,
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: e.message,
        error: e.stack.replace(/\n+/, ' ').trim(),
        logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJSP,
      });


    } finally {
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      console.log('\n\n\n\n')
      await sleep(2000);
    }
  });
})();
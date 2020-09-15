const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger } = require('../../lib/util');
const { LogExecucao } = require('../../lib/logExecucao');
const sleep = require('await-sleep');
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

  const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJBAPortal}.extracao.novos`;

  new GerenciadorFila(false, 3).consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    console.table(message);
    let logger = new Logger(
      'info',
      'logs/OabTJBAPortal/OabTJBAPortalInfo.log',
      {
        nomeRobo: enums.nomesRobos.TJBAPortal,
        NumeroOab: message.NumeroOab,
      }
    );
    try {
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(message.NumeroOab);
      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processos extraido');
      logger.info(
        `Extração resultou em ${resultadoExtracao.resultado.length} processo(s)`
      );
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalOab
      );
      logger.info('Resultado da extracao salva');

      // logger.info('Enviando resposta ao BigData');
      // const resposta = await Helper.enviarFeedback(
      //   extracao.prepararEnvio()
      // ).catch((err) => {
      //   console.log(err);
      //   throw new Error(`TJBAPortal - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroOab}`)
      // });
      // logger.info('Resposta enviada ao BigData');
      await logarExecucao({
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: 'OK',
        logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJBAPortal,
      });
    } catch (e) {
      logger.info('Encontrado erro durante a execução');
      logger.info(`Error: ${e.message}`);

      await logarExecucao({
        LogConsultaId: message.LogConsultaId,
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: e.message,
        error: e.stack.replace(/\n+/, ' ').trim(),
        logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJBAPortal,
      });
    } finally {
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      logger.info('Finalizando proceso');
      await sleep(2000);
    }
  });
})();

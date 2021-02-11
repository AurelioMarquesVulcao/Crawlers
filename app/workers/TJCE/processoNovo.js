const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Logger } = require('../../lib/util');
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

  const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.TJCE}.extracao.novos`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let logger = new Logger('info', 'logs/ProcessoTJCE/ProcessoTJCEInfo.log', {
      nomeRobo: `${enums.tipoConsulta.Processo}.${enums.nomesRobos.TJCE}`,
      NumeroOab: message.NumeroProcesso,
    });
    console.table(message);
    try {
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(
        message.NumeroProcesso,
        message.NumeroOab,
        message.Instancia,
        message
      );
      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processo extraido');
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalOab
      );
      logger.info('Resultado da extracao salva');

      // logger.info('Enviando resposta ao BigData');
      // await Helper.enviarFeedback(
      //   extracao.prepararEnvio()
      // ).catch((err) => {
      //   console.log(err);
      //   throw new Error(
      //     `ProcessoTJCE - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroOab}`
      //   );
      // });
      // logger.info('Resposta enviada ao BigData');
      console.log('\n\n');
      await logarExecucao({
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        Status: 'OK',
        Logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJCE,
      });
    } catch (e) {
      console.log('ERRU', e.code, e.message, '\n\n', e);
      logger.info('Encontrado erro durante a execução');
      logger.info(`Error: ${e.message}`);
      console.log('\n\n');

      await logarExecucao({
        LogConsultaId: message.LogConsultaId,
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        Status: e.message,
        Error: e.stack.replace(/\n+/, ' ').trim(),
        Logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJCE,
      });
    } finally {
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      logger.info('Finalizando proceso');
      console.log('\n\n\n\n');
      await sleep(2000);
    }
  });
})();

const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Logger } = require('../../lib/util');
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

  const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJSC}.extracao.novos`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let logger = new Logger('info', 'logs/OabTJSC/OabTJSCInfo.log', {
      nomeRobo: `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJSC}`,
      NumeroOab: message.NumeroOab,
    });
    console.table(message);
    try {
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(
        message.NumeroOab,
        message.ConsultaCadastradaId,
        message.Instancia
      );
      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processo extraido');
      await Extracao.criarExtracao(
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
      //   throw new Error(
      //     `OabTJSC - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroOab}`
      //   );
      // });
      // logger.info('Resposta enviada ao BigData');
      logger.info('Finalizando processo');
      await logarExecucao({
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: 'OK',
        logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJSC,
      });
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
    } catch (e) {
      logger.info('Encontrado erro durante a execução');
      logger.log('error', e);
      logger.info('Finalizando proceso');
      await logarExecucao({
        LogConsultaId: message.LogConsultaId,
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: e.message,
        error: e.stack.replace(/\n+/, ' ').trim(),
        logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJSC,
      });
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
    }
  });
})();
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

  const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJSP}.extracao.novos`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    console.table(message);
    let logger = new Logger('info', 'logs/OabTJSP/OabTJSPInfo.log', {
      nomeRobo: `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJSP}`,
      NumeroOab: message.NumeroOab,
    });
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
      //     `OabTJSP - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroOab}`
      //   );
      // });
      // logger.info('Resposta enviada ao BigData');
      logger.info('Finalizando processo');
      await logarExecucao({
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        Status: 'OK',
        Logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJSP,
      });
    } catch (e) {
      logger.info('Encontrado erro durante a execução');
      logger.log('error', e);
      logger.info('Finalizando proceso');
      await logarExecucao({
        LogConsultaId: message.LogConsultaId,
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        Status: e.message,
        Error: e.stack.replace(/\n+/, ' ').trim(),
        Logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJSP,
      });
    } finally {
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      console.log('\n\n\n\n');
      await sleep(2000);
    }
  });
})();

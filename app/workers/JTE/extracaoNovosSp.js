const mongoose = require("mongoose");
const { enums } = require("../../configs/enums");
const { GerenciadorFila } = require("../../lib/filaHandler");
const { ExtratorFactory } = require("../../extratores/extratorFactory");
const { Extracao } = require("../../models/schemas/extracao");
const { Helper, Logger } = require("../../lib/util");
const { LogExecucao } = require('../../lib/logExecucao');

const logarExecucao = async (execucao) => {
  await LogExecucao.salvar(execucao);
}

(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  mongoose.connection.on("error", (e) => {
    console.log(e);
  });

  // const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.JTE}.extracao.novos`;
  const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novosSP`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let logger = new Logger(
      'info',
      'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      NumeroDoProcesso: message.NumeroProcesso,
    }
    );
    try {
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(message.NumeroProcesso);
      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processo extraido');
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalProcesso
      );
      logger.info('Resultado da extracao salva');

      logger.info('Enviando resposta ao BigData');
      const resposta = await Helper.enviarFeedback(
        extracao.prepararEnvio()
      ).catch((err) => {
        console.log(err);
        throw new Error(`JTE - Erro ao enviar resposta ao BigData - Processo: ${message.NumeroProcesso}`)
      });
      logger.info('Resposta enviada ao BigData');
      logger.info('Reconhecendo mensagem ao RabbitMQ');

      logger.info('Mensagem reconhecida');
      logger.info('Finalizando processo');
      // await logarExecucao({
      //   Mensagem: message,
      //   DataInicio: dataInicio,
      //   DataTermino: new Date(),
      //   status: 'OK',
      //   logs: logger.logs,
      //   NomeRobo: enums.nomesRobos.JTE
      // });
      ch.ack(msg);
    } catch (e) {
      console.log(e);

      logger.info('Encontrado erro durante a execução');
      logger.info(`Error: ${e.message}`);
      logger.info('Reconhecendo mensagem ao RabbitMQ');

      logger.info('Mensagem reconhecida');
      logger.info('Finalizando proceso');
      console.log(message.LogConsultaId);

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

})();
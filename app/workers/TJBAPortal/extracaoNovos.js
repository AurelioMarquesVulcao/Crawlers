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

  const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJBAPortal}.extracao.novos`;

    new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
      try{
      let message = JSON.parse(msg.content.toString());
      let logger = new Logger(
        'info',
        'logs/OabTJBAPortal/OabTJBAPortalInfo.log',
        {
          nomeRobo: enums.nomesRobos.TJBAPortal,
          NumeroDaOab: message.NumeroDaOab,
        }
      );
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(message.NumeroDaOab);

      //TODO check this part
      logger.info('Processo extraido');
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        'BA'
      );
      logger.info('Resultado da extracao salva');

      logger.info('Enviando resposta ao BigData');
      const resposta = await Helper.enviarFeedback(
        extracao.prepararEnvio()
      ).catch((err) => {
        console.log(
          `TJBAPortal - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroDaOab}`
        );
        throw new Error(`TJBAPortal - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroDaOab}`)
        console.log(err);
      });
      logger.info('Resposta enviada ao BigData');
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      logger.info('Finalizando processo');
      
      await logarExecucao({ ...message, status: 'OK' });
    } catch (e) {
      await logarExecucao({ ...msg, status: e.message, error: e.stack.replace(/\n+/,' ').trim() });
    }
  });
  
})();

const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger } = require('../../lib/util');

(async () => {
  try {
    mongoose.connect(enums.mongo.address, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on('error', (e) => {
      console.log(e);
    });

    const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJBAPortal}.extracao.novos.teste`;

    new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
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
        console.log(err);
      });
      logger.info('Resposta enviada ao BigData');
      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      logger.info('Finalizando processo');
    });
  } catch (e) {
    console.log(e);
  }
})();

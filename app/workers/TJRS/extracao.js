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

const capitalize = (text) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }); 

  mongoose.connection.on("error", (e) => {
    console.log(e);
  });

  console.log('x')

  const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJRS}.extracao.novos`;

    new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
      const dataInicio = new Date();
      const message = JSON.parse(msg.content.toString());
      const teste = `${capitalize(enums.tipoConsulta.Oab)}${enums.nomesRobos.TJRS}`;
      const pathLog = `logs/${teste}/${teste}Info.log`;
      const logger = new Logger('info', pathLog,
        {
          nomeRobo: enums.nomesRobos.TJRS,
          NumeroOab: message.NumeroOab,
        }
      );

      try {
        logger.info('Mensagem recebida');
        const extrator = ExtratorFactory.getExtrator(nomeFila, true);

        logger.info('extracao inicializada!');
        console.time('extracao');
        const resultadoExtracao = await extrator.extrair(message.NumeroOab);
        console.time('extracao');
        logger.info('extracao finalizada!');

        logger.logs = [...logger.logs, ...resultadoExtracao.logs];        
        
        let extracao = await Extracao.criarExtracao(
          message,
          resultadoExtracao,
          message.SeccionalOab
        );
        logger.info('Resultado da extracao salva');

        logger.info('Enviando resposta ao BigData');
        const resposta = await Helper.enviarFeedback(
          extracao.prepararEnvio()
        ).catch((err) => {
          console.log(err);
          throw new Error(`OabTJSP - Erro ao enviar resposta ao BigData - Oab: ${message.NumeroOab}`)
        });
        logger.info('Resposta enviada ao BigData');
        logger.info('Reconhecendo mensagem ao RabbitMQ');
        //ch.ack(msg); removerComentario
        logger.info('Mensagem reconhecida');
        logger.info('Finalizando processo');
        await logarExecucao(
          {
            Mensagem: message,
            DataInicio: dataInicio,
            DataTermino: new Date(),
            status: 'OK',
            logs: logger.logs,
            NomeRobo: enums.nomesRobos.TJSP
          }
        );
      } catch (e) {
        console.log('ERRU',e.code, e.message, '\n\n', e);
        logger.info('Encontrado erro durante a execução');
        logger.info(`Error: ${e.message}`);
        logger.info('Reconhecendo mensagem ao RabbitMQ');
        //ch.ack(msg); //TODO remover comentario
        logger.info('Mensagem reconhecida');
        logger.info('Finalizando proceso');
        await logarExecucao(
          {
            LogConsultaId: message.LogConsultaId,
            Mensagem: message, 
            DataInicio: dataInicio,
            DataTermino: new Date(),
            status: e.message, 
            error: e.stack.replace(/\n+/,' ').trim(),
            logs: logger.logs,
            NomeRobo: enums.nomesRobos.TJSP
          }
        );
      }
  });
  
})();

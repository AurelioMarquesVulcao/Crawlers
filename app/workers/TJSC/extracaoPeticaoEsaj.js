const fs = require('fs');
const mongoose = require('mongoose');
const Path = require('path');
const sleep = require('await-sleep')
const { enums } = require('../../configs/enums');
const { Logger } = require('../../lib/util')
const { Extracao } = require('../../models/schemas/extracao')
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Helper } = require('../../lib/util')
const { GerenciadorFila } = require('../../lib/filaHandler');
const { PeticaoTJSCEsaj } = require('../../extratores/PeticaoTJSCEsaj');

(() => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on('error', (e) => {
    console.log(e);
    process.exit(0);
  });

  const nomeFila = `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJSC}.extracao`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    const message = JSON.parse(msg.content.toString());

    console.table(message);

    let arquivoPath;

    let logger = new Logger('info', 'logs/TJSC/peticao.log', {
      nomeRobo: `${enums.tipoConsulta.Peticao}${enums.nomesRobos.TJSC}`,
      NumeroDoProcesso: message.NumeroProcesso,
    });

    try {
      logger.info('Mensagem recebida');
      const extrator = new PeticaoTJSCEsaj()

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(message.NumeroProcesso);

      logger.logs = [...logger.logs, ...resultadoExtracao.logs];

      logger.info('Processo extraido');
      await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalOab
      );

      logger.info('Resultado da extração salva');

      if (!resultadoExtracao.sucesso) {
        throw new Error(resultadoExtracao.detalhes);
      }

      logger.info('Preparando arquivo para upload');

      arquivoPath = Path.resolve(
        __dirname,
        '../../downloads',
        `${message.NumeroProcesso}.pdf`
      );

      let data = fs.readFileSync(arquivoPath).toString('base64');

      logger.info('Arquivo preparado');
      logger.info('Enviando resposta ao BigData');
      let resposta;
      if (resultadoExtracao.sucesso) {
        resposta = {
          NumeroCNJ: message.NumeroProcesso,
          Documentos: [
            {
              DocumentoBody: data,
              UrlOrigem: '',
              NomeOrigem: `${message.NumeroProcesso.replace(/\D/g, '')}.pdf`,
            },
          ],
        };
        await Helper.feedbackDocumentos(resposta).catch((err) => {
          console.log(err);
          throw new Error(
            `PeticaoTJSC - Erro ao enviar resposta ao BigData - Processo: ${message.Processo}`
          );
        });
      } else {
        this.logger.info('Enviando resposta para o bigdata');
      }

      logger.info('Resposta enviada ao BigData');
      logger.info('Finalizando operação');

      await logarExecucao({
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: 'OK',
        logs: logger.logs,
        nomeRobo: 'PeticaoTJSC',
      });
    } catch (e) {
      logger.info('Extração não foi bem sucedida');
      logger.log('error', e);
      console.log(e);
      logger.info('Finalizando operação');
      if (/Não\sexistem\sinformações\sdisponíveis\spara\sos\sparâmetros\sinformados/.test(e.message)) {
        new GerenciadorFila().enviar('peticao.TJSC.extracao.eproc', JSON.stringify(message));
      }
      // await logarExecucao({
      //   LogConsultaId: message.LogConsultaId,
      //   Mensagem: message,
      //   DataInicio: dataInicio,
      //   DataTermino: new Date(),
      //   status: e.message,
      //   error: e.stack.replace(/\n+/, ' ').trim(),
      //   logs: logger.logs,
      //   NomeRobo: enums.nomesRobos.TJSC,
      // });
    } finally {
      console.log({arquivoPath})
      if (fs.existsSync(arquivoPath)) {
        logger.info('Apagando arquivo temporario');
        await fs.unlinkSync(arquivoPath);
        logger.info('Arquivo apagado');
      }

      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      console.log('\n'+'='.repeat(process.stdout.columns)+'\n');
      await sleep(2000);
    }
  });
})();

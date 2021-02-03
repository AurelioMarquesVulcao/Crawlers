const mongoose = require('mongoose');
const sleep = require('await-sleep');
const Path = require('path');
const fs = require('fs');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger } = require('../../lib/util');
const { LogExecucao } = require('../../lib/logExecucao');

let zip = JSZip();

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

  const nomeFila = `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJMS}.extracao`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let arquivoPath;
    let folderPath;
    console.table(message);
    let logger = new Logger('info', 'logs/TJMS/peticao.log', {
      nomeRobo: `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJMS}`,
      NumeroDoProcesso: message.NumeroProcesso,
    });
    try {
      logger.info('Mensagem recebida');
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);
      let resposta;

      logger.info('Iniciando processo de extração');
      const resultadoExtracao = await extrator.extrair(message.NumeroProcesso);
      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processo extraido');
      await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalOab
      );
      logger.info('Resultado da extracao salva');

      logger.info('Preparando arquivo para upload');
      folderPath = Path.resolve(__dirname, '../../downloads');
      arquivoPath = `${folderPath}/${message.NumeroProcesso.replace(
        /\D/g,
        ''
      )}.zip`;
      if (!resultadoExtracao.sucesso)
        throw new Error(resultadoExtracao.detalhes);

      let data = fs.readFileSync(arquivoPath).toString('base64');
      logger.info('Arquivo preparado');

      logger.info('Enviando resposta ao BigData');

      if (resultadoExtracao.sucesso) {
        resposta = {
          NumeroCNJ: message.NumeroProcesso,
          // Instancia: message.Instancia,
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
            `PeticaoTJMS - Erro ao enviar resposta ao BigData - Processo: ${message.Processo}`
          );
        });
      } else {
        console.log('Envia resposta para o endpoint de erro');
      }

      logger.info('Resposta enviada ao BigData');
      logger.info('Finalizando processo');
      await logarExecucao({
        Mensagem: message,
        DataInicio: dataInicio,
        DataTermino: new Date(),
        status: 'OK',
        logs: logger.logs,
        NomeRobo: 'PeticaoTJMS',
      });
    } catch (e) {
      logger.info('Encontrado erro durante a execução');
      console.log(e);
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
        NomeRobo: enums.nomesRobos.TJMS,
      });
    } finally {
      if (fs.existsSync(arquivoPath)) {
        logger.info('Apagando arquivo temporario');
        await fs.unlinkSync(arquivoPath);
        logger.info('Arquivo apagado');
      }

      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      console.log('\n\n\n\n');
      await sleep(2000);
    }
  });
})();

const unzipFile = (caminho) => {
  //TODO unzip o arquivo dentro da propria pasta
  //npm install node-cmd
};

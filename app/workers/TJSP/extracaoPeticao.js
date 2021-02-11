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

  const nomeFila = `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJSP}.extracao`;

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let arquivoPath;
    let folderPath;
    console.table(message);
    let logger = new Logger('info', 'logs/TJSP/peticao.log', {
      nomeRobo: `${enums.tipoConsulta.Peticao}.${enums.nomesRobos.TJSP}`,
      NumeroDoProcesso: message.NumeroProcesso,
    });
    let arquivos = [];
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
      if (!resultadoExtracao.sucesso)
        throw new Error(resultadoExtracao.detalhes);

      // verificar todos os arquivos dentro da pasta download
      // abrir um por um
      //enviar o conteudo para o bigdata

      // let data = fs.readFileSync(arquivoPath).toString('base64');
      // logger.info('Arquivo preparado');

      // logger.info('Enviando resposta ao BigData');

      if (resultadoExtracao.sucesso) {
        fs.readdirSync(`${folderPath}/`).forEach((file) =>
          arquivos.push({
            path: `${folderPath}/${file}`,
            nome: file,
          })
        );

        resposta = {
          NumeroCNJ: message.NumeroProcesso,
          // Instancia: message.Instancia,
          Documentos: [],
        };

        arquivos.map((arquivo) => {
          let data = fs.readFileSync(arquivo.path).toString('base64');
          resposta.Documentos.push({
            DocumentoBody: data,
            UrlOrigem: '',
            NomeOrigem: arquivo.nome,
          });
        });

        await Helper.feedbackDocumentos(resposta).catch((err) => {
          console.log(err);
          throw new Error(
            `PeticaoTJSP - Erro ao enviar resposta ao BigData - Processo: ${message.Processo}`
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
        Status: 'OK',
        Logs: logger.logs,
        NomeRobo: 'PeticaoTJSP',
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
        Status: e.message,
        Error: e.stack.replace(/\n+/, ' ').trim(),
        Logs: logger.logs,
        NomeRobo: enums.nomesRobos.TJSP,
      });
    } finally {
      arquivos.map((arquivo) => {
        logger.info(`Apagando arquivo ${arquivo.nome}`);
        fs.unlinkSync(`${arquivo.path}`);
        logger.info('Arquivo apagado');
      });

      logger.info('Reconhecendo mensagem ao RabbitMQ');
      ch.ack(msg);
      logger.info('Mensagem reconhecida');
      console.log('\n\n\n\n');
      await sleep(2000);
    }
  });
})();

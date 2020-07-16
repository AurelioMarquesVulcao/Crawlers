const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const fs = require('fs');
const axios = require('axios');

const { enums } = require("../../configs/enums");
const { GerenciadorFila } = require("../../lib/filaHandler");
const { ExtratorFactory } = require("../../extratores/extratorFactory");
const { Extracao } = require("../../models/schemas/extracao");
const { Helper, Logger } = require("../../lib/util");
const { LogExecucao } = require('../../lib/logExecucao');
const { RoboPuppeteer } = require('../../lib/roboPuppeteer-rev-000')
const { Andamento } = require('../../models/schemas/andamento');
const { BaseException, RequestException, ExtracaoException, AntiCaptchaResponseException, } = require('../../models/exception/exception');
const { ExtratorBase } = require('../../extratores/extratores');
const { JTEParser } = require('../../parsers/JTEParser');

const { RoboPuppeteer3 } = require('../../lib/roboPuppeteer')



/**
 * Logger para console e arquivo
 */
let logger;


const logarExecucao = async (execucao) => {
  await LogExecucao.salvar(execucao);
}


var contador = 0;

(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  mongoose.connection.on("error", (e) => {
    console.log(e);
  });

  const puppet = new RoboPuppeteer3()
  await puppet.iniciar()
  await puppet.acessar("https://jte.csjt.jus.br/")
  try {
    await puppet.preencheTribunal('10000242020195020501')
  } catch (e) {
    console.log("falha ao logar");
    await puppet.fechar()
    await puppet.iniciar()
    await puppet.acessar("https://jte.csjt.jus.br/")
    await puppet.preencheTribunal('10000242020195020501')
  }




  //01003040720205010049

  // const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.JTE}.extracao.novos`;
  const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-SP-2`;
  const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-SP-2`;

  // tudo que está abaixo é acionado para cada processo na fila.

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




      // await new ProcJTE().extrair("00021625020145020016")

      //const resultadoExtracao = {}
      //console.log('o contador está em: ' + contador);
      // const resultadoExtracao = await puppet.preencheProcesso("01003040720205010049", contador)
      var resultadoExtracao = {}
      let numeroProcesso = message.NumeroProcesso
      let dadosProcesso;
      var processo ;
      let parser = new JTEParser();
      try {

        logger = new Logger(
          'info',
          'logs/ProcJTE/ProcJTE.log', {
          nomeRobo: enums.nomesRobos.JTE,
          numeroProcesso: numeroProcesso,
        }
        );
        // let objResponse = await RoboPuppeteer(numeroProcesso)
        //console.log('ligou até aqui');

        
        let objResponse = await puppet.preencheProcesso(numeroProcesso, contador)
        
        if (!!objResponse)contador++
        


        //Estou carregando paginas locais até resolver o Puppeteer.
        let $ = cheerio.load(objResponse.geral);
        let $2 = cheerio.load(objResponse.andamentos);
        dadosProcesso = parser.parse($, $2, numeroProcesso)
        // var processo = dadosProcesso.processo
        await dadosProcesso.processo.salvar()
        console.time('tempo para pegar o processo')
        await Andamento.salvarAndamentos(dadosProcesso.andamentos)
        console.timeEnd('tempo para pegar o processo')
        processo = await dadosProcesso.processo.salvar()
      } catch (e) {
        console.log(e);
      }

      //  usar return simples apenas para dev
      logger.info('Processos extraidos com sucesso');
      if (!!dadosProcesso) {
        resultadoExtracao = {
          resultado: processo,
          sucesso: true,
          logs: logger.logs
        };
      }
  

      await console.log("\033[0;32m" + "Resultado da extração " + "\033[0;34m" + !!resultadoExtracao+"\033[1;37m");

      //const resultadoExtracao = await extrator.extrair(message.NumeroProcesso, contador);
      // const resultadoExtracao = extrator.extrair(message.NumeroProcesso)
      //console.log(resultadoExtracao);
      // new GerenciadorFila().enviar(reConsumo, message);

      // testa se a extração ocorreu corretamente
      //resultadoExtracao.length

      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processo extraido');




      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalProcesso
      );
      // console.log(extracao);
      //console.log(resultadoExtracao.resultado.processo.detalhes);
      
      
      logger.info('Resultado da extracao salva');

      logger.info('Enviando resposta ao BigData');
      //process.exit()
      // const resposta = await Helper.enviarFeedback(
      //   extracao.prepararEnvio()
      // ).catch((err) => {
      //   console.log(err);
      //   throw new Error(`JTE - Erro ao enviar resposta ao BigData - Processo: ${message.NumeroProcesso}`)
      // });
      logger.info('Resposta enviada ao BigData');
      logger.info('Reconhecendo mensagem ao RabbitMQ');

      logger.info('Mensagem reconhecida');
      logger.info('Finalizando processo');
      // tentar reativar codigo
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

      // envia a mensagem para a fila de reprocessamento
      new GerenciadorFila().enviar(reConsumo, message);

      logger.info('Encontrado erro durante a execução');
      // trata erro especifico para falha na estração
      let error01 = "TypeError: Cannot read property 'length' of undefined at /app/workers/JTE/extracaoNovos_Sp_2.js:48:25 at async /app/lib/filaHandler.js:96:11";
      if (e = error01) {
        logger.info(erro01 = "\033[31m" + 'Extração Falhou')
      }
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

//---------- funcoes complementares de tratamento--------------

function escolheEstado(numero) {
  let resultado;
  numero = numero.slice(numero.length - 6, numero.length - 4)
  if (numero == 01) resultado = 2     // Rio de Janeiro
  if (numero == 02 || numero == 05) resultado = 03    // São Paulo
  if (numero == 21) resultado = 22    // Rio Grande do Norte
  if (numero == 15) resultado = 16    // São Paulo
  if (numero == 03) resultado = 4    // São Paulo
  return resultado
}
function processaNumero(numero) {
  let numeroProcesso = numero.trim().slice(0, 7);
  let ano = numero.trim().slice(9, 13);
  let vara = numero.trim().slice(numero.length - 4, numero.length);
  return {
    numeroprocesso: numeroProcesso,
    ano: ano,
    vara: vara
  }
}
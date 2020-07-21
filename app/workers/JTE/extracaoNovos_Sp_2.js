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

const { Andamento } = require('../../models/schemas/andamento');
const { BaseException, RequestException, ExtracaoException, AntiCaptchaResponseException, } = require('../../models/exception/exception');
const { ExtratorBase } = require('../../extratores/extratores');
const { JTEParser } = require('../../parsers/JTEParser');

const { RoboPuppeteer3 } = require('../../lib/roboPuppeteer copy');
const sleep = require('await-sleep');




/**
 * Logger para console e arquivo
 */
let logger;


const logarExecucao = async (execucao) => {
    await LogExecucao.salvar(execucao);
}


var contador = 0;

let data = 1;

if (data == 1){worker()}

async function worker() {
    mongoose.connect(enums.mongo.connString, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    mongoose.connection.on("error", (e) => {
        console.log(e);
    });
    const puppet = new RoboPuppeteer3()
    
    var catchError = 0;


    // await puppet.start()
    await puppet.iniciar()

    //await sleep(10000)
    await puppet.acessar("https://jte.csjt.jus.br/")
    await puppet.preencheTribunal('10014385020135020473')
    await sleep(1000)

    // const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.JTE}.extracao.novos`;
    const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-SP-2`;
    const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-Sp2`;

    // tudo que está abaixo é acionado para cada processo na fila.
    contador = 0;
    await new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
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
            //-------------------------------------------------- inicio do extrator--------------------------------------------
            var resultadoExtracao = {}
            let numeroProcesso = message.NumeroProcesso
            let dadosProcesso;
            var processo;
            let parser = new JTEParser();
            try {

                logger = new Logger(
                    'info',
                    'logs/ProcJTE/ProcJTE.log', {
                    nomeRobo: enums.nomesRobos.JTE,
                    numeroProcesso: numeroProcesso,
                }
                );

                let objResponse = await puppet.preencheProcesso(numeroProcesso, contador)

                if (!!objResponse) contador++
                let $ = cheerio.load(objResponse.geral);
                let $2 = cheerio.load(objResponse.andamentos);
                dadosProcesso = parser.parse($, $2, numeroProcesso)
                // var processo = dadosProcesso.processo
                await dadosProcesso.processo.salvar()
                await Andamento.salvarAndamentos(dadosProcesso.andamentos)
                processo = await dadosProcesso.processo.salvar()
            } catch (e) {
                console.log(e);

            }
            logger.info('Processos extraidos com sucesso');
            if (!!dadosProcesso) {
                resultadoExtracao = {
                    resultado: processo,
                    sucesso: true,
                    logs: logger.logs
                };
            }
            //-------------------------------------------------- Fim do extrator--------------------------------------------
            if (!!dadosProcesso) await console.log("\033[0;32m" + "Resultado da extração " + "\033[0;34m" + !!resultadoExtracao + "\033[0m");

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
            //---------------------------------------------------------envio do big data tem que ser desativado ao trabalhar externo--------------------------------------------
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
            catchError++
            //console.log(e);
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
            if(catchError == 2){process.exit()}

        }
    });
};


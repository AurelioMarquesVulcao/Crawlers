const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
//const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger } = require('../../lib/util');
//const { LogExecucao } = require('../../lib/logExecucao');
const sleep = require('await-sleep');
const { ExtratorTrtrj } = require('../../extratores/processoTRT-SP');
const { Processo } = require('../../models/schemas/processo');
const { TRTParser}= require('../../parsers/TRTSPParser');
// const logarExecucao = async (execucao) => {
//   await LogExecucao.salvar(execucao);
// };

const parse = new TRTParser();

(async () => {
    mongoose.connect(enums.mongo.connString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    mongoose.connection.on('error', (e) => {
        console.log(e);
    });

    //const nomeFila = `fila TRT-RJ`;
    const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.TRTSP}.extracao.novos`;
    const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.TRTSP}.extracao.novos`;

    new GerenciadorFila(false,1).consumir(nomeFila, async (ch, msg) => {
        // let testeSleep = numeroAleatorio(1,20)
        // console.log(testeSleep);
        // await sleep(testeSleep*1000)
        const dataInicio = new Date();
        let message = JSON.parse(msg.content.toString());
        console.table(message);
        let logger = new Logger('info', 'logs/ProcessoTRTRJ/ProcessoTRT-RJInfo', {
            nomeRobo: enums.nomesRobos.TRTSP,
            NumeroDoProcesso: message.NumeroProcesso,
        });
        try {
            logger.info('Mensagem recebida');
            const extrator = ExtratorFactory.getExtrator(nomeFila, true);

            logger.info('Iniciando processo de extração');


            // extrator
            // const resultadoExtracao = await extrator.extrair(message.NumeroOab);
            // await new ExtratorTrtrj().extrair(message.NumeroProcesso);
            // console.log(message.NumeroProcesso);
            // console.log(message);
            let extracao = await new ExtratorTrtrj().extrair(message.NumeroProcesso);
            logger.info('Iniciando Parse');
            //console.log(await extracao);
            
            let dadosProcesso = await parse.parse(extracao);
            console.log(await dadosProcesso);
            logger.info('Parse finalizado');
            logger.info('Salvando capa do processo');
            await dadosProcesso.processo.save();
            logger.info('Capa de processo salva');
                      
            logger.info('Atualizando processo JTE');
            // console.log(message);
            //console.log(extracao);
            let busca = { "_id": message._id }
            if (extracao.segredoJustica == true) {
                resultado = {
                    "capa.segredoJustica": extracao.segredoJustica,
                    "capa.valor": "",
                    "capa.justicaGratuita": "",
                    "origemExtracao": "JTE.TRT"
                }
                console.log(resultado);
                // console.log(busca);
                await Processo.findOneAndUpdate(busca, resultado);
                console.log("------------- Salvo com sucesso -------------------");
            }
            if (extracao.segredoJustica == false) {
                resultado = {
                    "capa.segredoJustica": extracao.segredoJustica,
                    "capa.valor": `${extracao.valorDaCausa}`,
                    "capa.justicaGratuita": extracao.justicaGratuita,
                    "origemExtracao": "JTE.TRT"
                }
                console.log(resultado);
                // console.log(busca);
                await Processo.findOneAndUpdate(busca, resultado);
                console.log("------------- Salvo com sucesso -------------------");
            }
            logger.info('Processo JTE atualizado para JTE.TRT');
            // resultado = { "capa.segredoJustica": " ", "origemExtracao": "JTE.TRT", }
            // await Processo.findOneAndUpdate(busca, resultado);
            await sleep(100);



            // logger.logs = [...logger.logs, ...resultadoExtracao.logs];
            logger.info('Processos extraido');
            // logger.info(
            //     `Extração resultou em ${resultadoExtracao.resultado.length} processo(s)`
            // );

            // let extracao = await Extracao.criarExtracao(
            //     message,
            //     resultadoExtracao,
            //     message.SeccionalOab
            // );

            logger.info('Resultado da extracao salva');

            // await logarExecucao({
            //     Mensagem: message,
            //     DataInicio: dataInicio,
            //     DataTermino: new Date(),
            //     status: 'OK',
            //     logs: logger.logs,
            //     NomeRobo: enums.nomesRobos.TJBAPortal,
            // });
            await sleep(5000)
        } catch (e) {
            logger.info('Encontrado erro durante a execução');
            logger.info(`Error: ${e.message}`);

            // Estou reprocessando automaticamente no fim da fila.
            // if (!!message.NovosProcessos) {
            //     await new GerenciadorFila().enviar(nomeFila, message);
            // }
            await new GerenciadorFila().enviar(nomeFila, message);
            await new GerenciadorFila().enviar(reConsumo, message);

            //     await logarExecucao({
            //         LogConsultaId: message.LogConsultaId,
            //         Mensagem: message,
            //         DataInicio: dataInicio,
            //         DataTermino: new Date(),
            //         status: e.message,
            //         error: e.stack.replace(/\n+/, ' ').trim(),
            //         logs: logger.logs,
            //         NomeRobo: enums.nomesRobos.TJBAPortal,
            //     });
        } finally {
            logger.info('Reconhecendo mensagem ao RabbitMQ');
            ch.ack(msg);
            logger.info('Mensagem reconhecida');
            logger.info('Finalizando proceso');
            await sleep(2000);
        }
    });
})();

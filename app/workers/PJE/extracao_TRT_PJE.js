const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Cnj, Logger } = require('../../lib/util');
const sleep = require('await-sleep');
const { ExtratorTrtPje } = require('../../extratores/processoPJE');
const { Processo } = require('../../models/schemas/processo');
const { TRTParser } = require('../../parsers/TRTSPParser');

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
    const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.TRTSP}.extracao.novos.1`;
    const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.TRTSP}.extracao.novos.1`;

    new GerenciadorFila(false, 2).consumir(nomeFila, async (ch, msg) => {

        // let testeSleep = numeroAleatorio(1, 20)
        // console.log(testeSleep);
        // await sleep(testeSleep * 1000)

        const dataInicio = new Date();
        let message = JSON.parse(msg.content.toString());
        const numeroEstado = parseInt(new Cnj().processoSlice(message.NumeroProcesso).estado);
        console.table(message);
        let logger = new Logger('info', 'logs/ProcessoTRTRJ/ProcessoTRT-RJInfo', {
            nomeRobo: enums.nomesRobos.TRTSP,
            NumeroDoProcesso: message.NumeroProcesso,
        });
        // console.log("Numero de Processo ", numeroEstado);
        try {
            logger.info('Mensagem recebida');
            const extrator = ExtratorFactory.getExtrator(nomeFila, true);

            logger.info('Iniciando processo de extração');


            // extrator
            // const resultadoExtracao = await extrator.extrair(message.NumeroOab);
            // await new ExtratorTrtPje().extrair(message.NumeroProcesso);
            // console.log(message.NumeroProcesso);
            // console.log(message);
            let extracao = await new ExtratorTrtPje().extrair(message.NumeroProcesso, numeroEstado);
            logger.info('Iniciando Parse');

            // console.log({ texto: "Essa é a resposta do parse", resposta: extracao });

            let busca = { "_id": message._id }

            // tratando a resposta do extrator
            if (extracao === null) {
                const error = new Error('Extração falhou, processo será reenfileirado');
                error.code = "Extração falhou";
                throw error;

            } else if (extracao.segredoJustica === true) {
                console.log("entrou no IF SEGREDO DE JUSTIÇA");
                logger.info('Atualizando processo JTE');
                resultado = {
                    "capa.segredoJustica": extracao.segredoJustica,
                    "capa.valor": "",
                    "capa.justicaGratuita": "",
                    "origemExtracao": "JTE.TRT"
                }
                console.log(resultado);
                await Processo.findOneAndUpdate(busca, resultado);
                console.log("------------- Salvo com sucesso -------------------");
                logger.info('Processo JTE atualizado para JTE.TRT');

            } else if (extracao) {

                resultado = {
                    "capa.segredoJustica": extracao.segredoJustica,
                    "capa.valor": `${extracao.valorDaCausa}`,
                    "capa.justicaGratuita": extracao.justicaGratuita,
                    "origemExtracao": "JTE.TRT"
                }
                console.log(resultado);
                console.log(busca);
                await Processo.findOneAndUpdate(busca, resultado);
                console.log("------------- Salvo com sucesso -------------------");
                logger.info('Processo JTE atualizado para JTE.TRT');


                let dadosProcesso = await parse.parse(extracao);
                console.log(await dadosProcesso);
                logger.info('Parse finalizado');
                logger.info('Salvando capa do processo');
                await dadosProcesso.processo.save();
                logger.info('Capa de processo salva');

            } else {

                const error = new Error('Erro não mapeado');
                error.code = "Extração falhou";
                throw error;
            }




            await sleep(100);
            logger.info('Processos extraido');
            logger.info('Resultado da extracao salva');


            await sleep(5000)
        } catch (e) {
            console.log(e);
            logger.info('Encontrado erro durante a execução');
            logger.info(`Error: ${e.message}`);

            // Estou reprocessando automaticamente no fim da fila.

            await new GerenciadorFila().enviar(nomeFila, message);
            await new GerenciadorFila().enviar(reConsumo, message);

        } finally {
            logger.info('Reconhecendo mensagem ao RabbitMQ');
            ch.ack(msg);
            logger.info('Mensagem reconhecida');
            logger.info('Finalizando proceso');
            await sleep(2000);
        }
    });
})();
function numeroAleatorio(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
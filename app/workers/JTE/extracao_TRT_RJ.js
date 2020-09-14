const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper, Logger } = require('../../lib/util');
const { LogExecucao } = require('../../lib/logExecucao');
const sleep = require('await-sleep');
// const logarExecucao = async (execucao) => {
//   await LogExecucao.salvar(execucao);
// };

(async () => {
    mongoose.connect(enums.mongo.connString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    mongoose.connection.on('error', (e) => {
        console.log(e);
    });

    const nomeFila = `fila TRT-RJ`;
    const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.TRTRJ}.extracao.novos`;
    // const reConsumo = `Reconsumo ${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos`;

    new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
        const dataInicio = new Date();
        let message = JSON.parse(msg.content.toString());
        console.table(message);
        let logger = new Logger('info', 'logs/ProcessoTRTRJ/ProcessoTRT-RJInfo', {
            nomeRobo: enums.nomesRobos.TRTRJ,
            NumeroDoProcesso: message.NumeroProcesso,
        });
        try {
            logger.info('Mensagem recebida');
            const extrator = ExtratorFactory.getExtrator(nomeFila, true);

            logger.info('Iniciando processo de extração');


            // extrator
            const resultadoExtracao = await extrator.extrair(message.NumeroOab);
            await extrator.extrair(message.NumeroOab);



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
        } catch (e) {
            logger.info('Encontrado erro durante a execução');
            logger.info(`Error: ${e.message}`);

            // Estou reprocessando automaticamente no fim da fila.
            if (!!novosProcesso) {
                new GerenciadorFila().enviar(nomeFila, message);
            }

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





async function atulizaProcessos(pulo) {
    let busca;
    let resultado;
    let extracao;
    let agregar = await Processo.aggregate([
        {
            $match: {
                'detalhes.orgao': 5,
                'detalhes.tribunal': 1,
                'detalhes.ano': 2020,
                "origemExtracao": "JTE"
            }
        },
        {
            $project: {
                "detalhes.numeroProcesso": 1,
                "_id": 1
            }
        }
    ]).skip(pulo).limit(100);
    console.log(await agregar);
    for (i in agregar) {
        busca = { "_id": agregar[i]._id }
        extracao = await rj.extrair(agregar[i].detalhes.numeroProcesso);
        //console.log(await extracao);
        console.log(await !!extracao);
        if (await !!extracao) {
            if (extracao.segredoJustica == true) {

                resultado = {
                    "capa.segredoJustica": extracao.segredoJustica,
                    "capa.valor": "",
                    "capa.justicaGratuita": "",
                    "origemExtracao": "JTE.TRT"
                }
                console.log(resultado);
                await Processo.findOneAndUpdate(busca, resultado);
            }
            if (extracao.segredoJustica == false) {
                resultado = {
                    "capa.segredoJustica": extracao.segredoJustica,
                    "capa.valor": `${extracao.valorDaCausa}`,
                    "capa.justicaGratuita": extracao.justicaGratuita,
                    "origemExtracao": "JTE.TRT"
                }
                console.log(resultado);
                await Processo.findOneAndUpdate(busca, resultado);
            }
            // resultado = { "capa.segredoJustica": " ", "origemExtracao": "JTE.TRT", }
            // await Processo.findOneAndUpdate(busca, resultado);
            await sleep(100);
            // console.log(resultado);
        }

    }
}
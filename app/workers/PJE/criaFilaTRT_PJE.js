const mongoose = require('mongoose');
const sleep = require('await-sleep');
const desligado = require('../../assets/jte/horarioRoboTRTRJ.json');

const { enums } = require('../../configs/enums');
const { Processo } = require('../../models/schemas/processo');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { getFilas } = require('./get_fila');


class CriaFilaPJE {
    constructor(isDebug) {
        // this.robo = new Robo();
        this.fila = "processo.PJE.extracao.novos.1";
        this.criafila = new CriaFilaJTE();
    };
    async worker() {
        await this.testaFila();
    }
    async montaFila() {
        console.log("Fila concluída. Iniciando criador de fila.");
        for (let i = 1; i < 25; i++) {
            if (i != 15) {
                await this.atualizaProcessosFila(0, i);
                console.log("debug");
            }
            await sleep(500);
        }
        await sleep(5000);
        await this.testaFila();
    }
    async testaFila() {
        console.log("Testando Fila");
        let statusFila = false
        let rabbit = await getFilas();
        console.log(rabbit);
        // process.exit()
        if (rabbit.length > 0) {
            for (let i = 0; i < rabbit.length; i++) {
                if (rabbit[i].nome == this.fila) {
                    statusFila = true
                }
            }
        }
        if (!statusFila) {
            console.log("A fila ainda não consumiu...");
            await sleep(60 * 1000);
            await this.testaFila();
        } else {
            console.log("A fila consumiu...");
            await this.montaFila()
        }
    }
    async atualizaProcessosFila(pulo, tribunal) {
        let start = 1
        let busca;
        let extracao;
        let agregar = await Processo.aggregate([
            {
                $match: {
                    'detalhes.orgao': 5,
                    'detalhes.tribunal': tribunal,
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
        ]).skip(pulo).limit(50);
        // console.log(await agregar);
        for (let i = 0; i < agregar.length; i++) {
            busca = `"${agregar[i]._id}"`;
            // console.log(busca);
            console.log(await !!extracao);
            await this.enfileirarTRT_RJ(agregar[i].detalhes.numeroProcesso, busca);
            console.log(" Postado : " + agregar[i].detalhes.numeroProcesso);
            await sleep(20)
        }
    }
    async enfileirarTRT_RJ(numero, busca) {
        let regex = (/([0-9]{7})([0-9]{2})(2020)(5)(01)([0-9]{4})/g.test(numero))
        // if (true) {
        let mensagem = this.criaPost(numero, busca);
        await this.criafila.enviarMensagem(this.fila, mensagem);
        console.log("Processo enfileirado para Download");
        // }

    }
    makeid() {
        let text = "5ed9";
        let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 20; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
    criaPost(numero, busca) {
        let post = `{
        "ExecucaoConsultaId" : "${this.makeid()}",
        "ConsultaCadastradaId" : "${this.makeid()}",
        "DataEnfileiramento" : "${new Date}",
        "NumeroProcesso" : "${numero}",
        "NumeroOab" : "null",        
        "SeccionalOab" : "RJ",
        "NovosProcessos" : true,
        "_id": ${busca}}`
        return post
    }

};

(async () => {
    mongoose.connect(enums.mongo.connString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (e) => {
        console.log(e);
    });
    new CriaFilaPJE().worker()
    // força criar a fila
    // new CriaFilaPJE().montaFila()
})()
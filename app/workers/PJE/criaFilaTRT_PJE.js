const mongoose = require('mongoose');
const sleep = require('await-sleep');
const desligado = require('../../assets/jte/horarioRoboTRTRJ.json');

const { enums } = require('../../configs/enums');
const { Processo } = require('../../models/schemas/processo');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { getFilas } = require('./get_fila');


class CriaFilaPJE {
    constructor() {
        // this.robo = new Robo();
        this.fila = "processo.PJE.extracao.novos.1";
        this.criafila = new CriaFilaJTE();
        this.rabbit = new GerenciadorFila()
    };
    async worker() {
        await this.testaFila();
    }
    /**
     * Monta a os blocos de estados a serem enfileirados
     */
    async montaFila() {
        let estado = [];
        console.log("Fila concluída. Iniciando criador de fila.");
        for (let i = 1; i < 25; i++) {
            if (i != 15) {
                estado = await this.atualizaProcessosFila(0, i)[0]
            }
        }
        await sleep(125000);
        await this.testaFila();

    }

    /**
     * Verifica se a fila possui menos de 100 mensagens, caso tenha menos de 100 mensagens,
     * enfileira 300 processos de cada estado.
     */
    async testaFila() {
        console.log("Testando Fila");
        let statusFila = false
        let rabbit = await getFilas();
        console.log(rabbit);
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

    /**
     * Busca no banco de dados por processos extraidos do JTE
     * que não possuem a capa atualizada. E os envia para fila.
     * @param {number} pulo salta uma quantidade de processos apartir do inicio.
     * @param {number} tribunal Tribunal/Estado ao qual o processo pertence.
     */
    async atualizaProcessosFila(pulo, tribunal) {
        let busca;
        let mensagens = [];
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
        ]).skip(pulo).limit(300);
        for (let i = 0; i < agregar.length; i++) {
            busca = `${agregar[i]._id}`;
            mensagens.push(this.criaPost(agregar[i].detalhes.numeroProcesso, busca));
        }
        await this.rabbit.enfileirarLote(this.fila, mensagens)
    }


    // async enfileirarTRT_RJ(numero, busca) {
    //     let regex = (/([0-9]{7})([0-9]{2})(2020)(5)(01)([0-9]{4})/g.test(numero))
    //     let mensagem = this.criaPost(numero, busca);
    //     await this.criafila.enviarMensagem(this.fila, mensagem);
    //     console.log("Processo enfileirado para Download");
    // }

    /**
    * Cria um post para ser enviado como mensagem para o rabbit
    * @param {string} numero Numero de Processo
    * @param {string} busca Objeto Id para busca no MONGO-DB
    * @return {string} return.: {"NumeroProcesso" : "00004618720205130032","NovosProcessos" : true, "_id" : "5f6cb256f0375ab99a7cf367"}
    */
    criaPost(numero, busca) {
        let busca2 = busca.toString()
        let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true, "_id" : "${busca2}"}`;
        console.log(post);
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

})()
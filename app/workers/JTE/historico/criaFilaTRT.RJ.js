const mongoose = require('mongoose');
const sleep = require('await-sleep');
const desligado = require('../../../assets/jte/horarioRoboTRTRJ.json');


const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const { enums } = require('../../../configs/enums');
const { Processo } = require('../../../models/schemas/processo');

const fila = new CriaFilaJTE();
var start = 0;

// liga ao banco de dados
mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
    console.log(e);
});



(async () => {
    for (let w = 0; w < 1;) {
        let relogio = fila.relogio();
        if (start == 0) {
            await atulizaProcessosFila(0);
            await sleep(1000)
        }
        await sleep(1000)
        if (relogio.hora == 6 && relogio.min == 1) {
            start = 0
        }
        if (relogio.hora == 8 && relogio.min == 1) {
            start = 0
        }
    }
})()


async function atulizaProcessosFila(pulo) {
    start = 1
    let busca;
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
    ]).skip(pulo).limit(2000);
    console.log(await agregar);
    for (i in agregar) {
        busca = `"${agregar[i]._id}"`;

        console.log(busca);
        //extracao = await rj.extrair(agregar[i].detalhes.numeroProcesso);
        //console.log(await extracao);
        console.log(await !!extracao);
        await enfileirarTRT_RJ(agregar[i].detalhes.numeroProcesso, busca);
        console.log(" Postado : " + agregar[i].detalhes.numeroProcesso);
        await sleep(20)

    }
}

async function enfileirarTRT_RJ(numero, busca) {
    let regex = (/([0-9]{7})([0-9]{2})(2020)(5)(01)([0-9]{4})/g.test(numero))
    //console.log(regex);
    if (regex) {
        let mensagem = criaPost(numero, busca);
        await fila.enviarMensagem("processo.TRTRJ.extracao.novos.2", mensagem);
        console.log("Processo enfileirado para Download");
    }
    function criaPost(numero, busca) {
        let post = `{
        "ExecucaoConsultaId" : "${makeid()}",
        "ConsultaCadastradaId" : "${makeid()}",
        "DataEnfileiramento" : "${new Date}",
        "NumeroProcesso" : "${numero}",
        "NumeroOab" : "null",        
        "SeccionalOab" : "RJ",
        "NovosProcessos" : true,
        "_id": ${busca}}`
        return post
    }

    function makeid() {
        let text = "5ed9";
        let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 20; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
}

async function desligaAgendado() {
    console.log("Vou pausar a aplicação");
    await sleep(3600000)
    // setInterval(async function () {
    //     let relogio = fila.relogio();
    //     if (!!desligado.worker.find(element => element == relogio.hora)) {
    //         console.log("Vou fechar a aplicação");
    //         mongoose.connection.close();
    //         await sleep(3600000)
    //         process.exit()
    //     }
    // }, 1000);
}


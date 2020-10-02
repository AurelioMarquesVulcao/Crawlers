const mongoose = require('mongoose');
const sleep = require('await-sleep');

const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const { enums } = require('../../../configs/enums');
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../../../models/schemas/jte')
const Estados = require('../../../assets/jte/comarcascopy.json');
const { Processo } = require('../../../models/schemas/processo');
const { Logform } = require('winston');

const fila = new CriaFilaJTE();

// Conecta ao banco de dados
mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
    console.log(e);
});


(async () => {
    let regex1 = /Não\sfoi\spossivel\sobter/;
    let regex2 = /gabinete/i;
    const dados = await buscaBanco(13000);
    for (i in await dados) {
        console.log(dados[i].detalhes.numeroProcesso);
        await enfileirar(dados[i].detalhes.numeroProcesso);
        await sleep(100);

    }

    mongoose.connection.close();
    process.exit()
})()





async function buscaBanco(pulo) {
    let agregar = await Processo.aggregate([
        {
            $match: {
                'detalhes.orgao': 5,
                // 'detalhes.tribunal':2,
                'detalhes.ano': 2020,
                '$or': [
                    { 'capa.vara': { "$in": ["", null] } },
                    { 'capa.comarca': { "$in": ["", null] } },
                ],
            }
        },
        {
            $project: {
                "detalhes.numeroProcesso": 1,
                "_id": 1
            }
        }
    ]).skip(pulo).limit(600000);
    console.log(await agregar.length);
    return agregar
}


async function enfileirar(numero) {
    let regex = (/([0-9]{7})([0-9]{2})(2020)(5)(01)([0-9]{4})/g.test(numero))
    //console.log(regex);
    if (true) {
        let mensagem = criaPost(numero);
        await fila.enviarMensagem("ReprocessamentoJTE", mensagem);
        console.log("Processo enfileirado para Download");
    }
    function criaPost(numero) {
        let post = `{
        "NumeroProcesso" : "${numero}",
        "NovosProcessos" : true }`
        return post
    }

    function makeid() {
        let text = "5ed9";
        let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
        let letra = "abcdefghijklmnopqrstuvwxyz";
        let numero = "0123456789";
        for (var i = 0; i < 20; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
}


// funcionalidade está ok
async function deleteUndefine() {
    let obj = await statusEstadosJTE.find({ "comarca": "unde" })

    let obj2 = await statusEstadosJTE.deleteMany({ "comarca": "unde" }, function (err) {
        if (err) return handleError(err);
        // deleted at most one tank document
    });

    console.log(obj2);
    console.log(obj);

}

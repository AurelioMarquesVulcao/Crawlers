const mongoose = require('mongoose');
const sleep = require('await-sleep');
const data = new Date();


const { enums } = require('../../../configs/enums');
const { Cnj, Helper } = require('../../../lib/util');
const { CriaFilaJTE } = require('../../../lib/criaFilaJTE');
const Estados = require('../../../assets/jte/comarcascopy.json');
const { Processo } = require('../../../models/schemas/processo');
const { ultimoProcesso } = require('../../../models/schemas/jte');
const { JTEParser } = require('../../../parsers/JTEParser');
const { ExtratorTrtrj } = require('../../../extratores/processoTRT-RJ');
const { Logform } = require('winston');


const fila = new CriaFilaJTE();
const ajuste = new Cnj();
const processoConection = new Processo();
const processoUltimoConection = new ultimoProcesso()
const rj = new ExtratorTrtrj();

// Conecta ao banco de dados
mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
    console.log(e);
});



(async () => {
    await buscaMedia(Estados.rj)
    // data.setDate(data.getDate() - 2)

    // console.log(data.getDate(), data.getMonth());






    mongoose.connection.close();
    process.exit()
})()

// Gera array de objetos. {comarca, numero de processos}, que deveram ser buscados para aquele dia
// com base na média dos dias anteriores.
async function buscaMedia(estado) {
    let resultado = [];
    let mediaDias;
    let soma = 0;
    console.time("entrando na busca")
    let dias7 = await BuscaBanco(dias = 7, estado);
    let dias21 = await BuscaBanco(dias = 21, estado);
    let dias28 = await BuscaBanco(dias = 28, estado);
    console.log("vou imprimir a média");
    for (i in dias7) {
        mediaDias = media(dias7[i].quantidadeProcesso, dias21[i].quantidadeProcesso, dias28[i].quantidadeProcesso)
        soma += mediaDias
        resultado.push({
            "comarcas": dias7[i].comarcas,
            "quantidadeProcesso": mediaDias
        })
    }

    console.log(resultado);
    console.log(soma);

    console.timeEnd("entrando na busca")
    // for (j in resultado){
    //     if (resultado[j].comarcas == "0002"){console.log(resultado[j].quantidadeProcesso);}
    // }
    return resultado
}

async function BuscaBanco(dias = 0, estado) {
    data.setDate(data.getDate() - dias)
    let resultado;
    let tribunal;
    let comarca;
    tribunal = parseInt(estado.codigo)
    comarca = estado.comarcas;
    let agregar = await ultimoProcesso.aggregate([
        {
            $match: {
                "data.dia": data.getDate(),
                "data.mes": data.getMonth(),
                "tribunal": tribunal,
            }
        },
        { $limit: 100000 },
        {
            $group: {
                '_id': null, 'Processo': { '$push': '$numeroProcesso' },
            }
        }
    ])
    // console.log(data.getDate(), data.getMonth())

    return contaProcessos(comarca, agregar[0].Processo);
};

function contaProcessos(comarca, agregar) {
    comarca.length = 5
    let comarcas;
    let quantidadeProcesso;
    resultado = [];
    let obj;
    for (i in comarca) {
        quantidadeProcesso = contaElemento(agregar, comarca[i]);
        comarcas = comarca[i];
        obj = { comarcas, quantidadeProcesso }
        resultado.push(obj)
    }
    // console.log(resultado);
    return resultado;
};

function contaElemento(array1, elemento) {
    let array = [];
    for (w in array1) {
        array.push(array1[w].slice(array1[w].length - 4, array1[w].length))
    }
    var indices = [];
    var idx = array.indexOf(elemento);
    while (idx != -1) {
        indices.push(idx);
        idx = array.indexOf(elemento, idx + 1);
    }
    return indices.length
};

function media(a, b, c) {
    if (typeof a != "number") {
        a = 0
    }
    if (typeof b != "number") {
        b = 0
    }
    if (typeof a != "number") {
        c = 0
    }
    console.log(typeof a);
    let media = Math.round((a + b + c) / 3);
    if (media == 1) {
        media = 2
    }
    if (media == 0) {
        media = 1
    }

    return media
}


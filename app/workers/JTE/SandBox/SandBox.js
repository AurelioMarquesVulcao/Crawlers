const mongoose = require('mongoose');
const shell = require('shelljs');
const sleep = require('await-sleep');
const axios = require('axios');


const { Cnj, Helper } = require('../../lib/util');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { enums } = require('../../configs/enums');
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../../models/schemas/jte')
const Estados = require('../../assets/jte/comarcascopy.json');
const { Processo } = require('../../models/schemas/processo');
const { JTEParser } = require('../../parsers/JTEParser');
const { removerAcentos } = require('../../parsers/BaseParser');
const { Logform } = require('winston');
const { ExtratorTrtrj } = require('../../extratores/processoTRT-RJ');

const fila = new CriaFilaJTE();
const ajuste = new Cnj();
const processoConection = new Processo();
const rj = new ExtratorTrtrj();

// liga ao banco de dados
mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
    console.log(e);
});

// (async () => {
//     await shell.exec('pkill chrome');
//     shell.exec('ls');
// })()


(async () => {
    //var sequencial = "0001033"
    //let zero = ajuste.corrigeSequencial(sequencial).zero
    //zero = zero.substr(1)
    //console.log(zero);
    //console.log(novoSequencial(sequencial));
    //await fila.salvaStatusComarca("00104979620205100021", "2020-08-07T03:00:00.000Z", "", {"estadoNumero": "10", "comarca": "0021"});


    // await statusRaspagem()
    // console.log(await axios.get(
    //     `http://admin:crawler480@172.16.16.3:15676/api/queues`
    //   ));


    // await deleteUndefine()


    //    contarComarcas(Estados)

    //console.log(varaComarca("Processo no 1º grau - 1ª Vara do Trabalho de Campinas")); 
    //console.log(varaComarca("Processo no 1º grau - 5ª Vara do Trabalho do Rio de Janeiro"));

    // yasmin23await corrigeBanco()

    //console.log(Estados[0]);

    //await statusRaspagem()
    for (let i = 0; i < 20; i++) {
        atulizaProcessos(i * 100);
        await sleep(10000)
    }
    await sleep(1800000)

    // console.log(await atulizaProcessos("01001199020205010041")); // segredo de justiça
    // console.log(await atulizaProcessos("01002214120205010000")); // 2 instância "especial"
    // console.log(await atulizaProcessos("01005289420205010452")); // processo travando
    // console.log(await atulizaProcessos("01006283220205010005")); // processo normal


    mongoose.connection.close();
    process.exit()
})()

function novoSequencial(numero) {
    const util = new Cnj();
    let resultado;
    let cnj = util.processoSlice(numero);
    let sequencial = cnj.sequencial;
    let sequencialSlice = util.corrigeSequencial(sequencial);
    let zero = sequencialSlice.zero;
    let numeros = sequencialSlice.seq;
    let numerosAnterior = parseInt(numeros) - 1
    if ((numerosAnterior.toString().length + zero.length) < 7) {
        resultado = zero + "0" + numerosAnterior
    } else {
        resultado = resultado = zero + numerosAnterior
    }

    return resultado
}

async function statusRaspagem() {
    //let obj = await statusEstadosJTE.find({"status" : "Não possui processos"})
    let obj = await statusEstadosJTE.find({ "estadoNumero": "14" })
    let ultimos = 0;
    let buscando = 0;
    let naoEncontrado = 0;
    let total = 0;
    let data;
    let comarcas = [];
    for (i in obj) {
        Estado = obj[i].estadoNumero
        Comarca = obj[i].comarca
        Status = obj[i].status
        data = obj[i].dataBusca
        if (Comarca != "unde") {
            if (Status != 'Ultimo Processo') {
                //console.log({ Estado, Comarca, data });

            }
            if (Status == 'Não possui processos') {
                console.log({ Estado, Comarca, data });
                comarcas.push(Comarca);
            }
            total++
            if (Status == 'Ultimo Processo') {
                ultimos++
            } else if (Status == 'Novo' || Status == 'Atualizado') {
                buscando++
            } else if (Status == 'Não possui processos') {
                naoEncontrado++
            }
        }
    }
    console.log({
        Total_Comarcas: total,
        Total_Ultimos_Processos: ultimos,
        Total_Buscando_Ultimo: buscando,
        Total_Nao_Encontrado: naoEncontrado,
        comarcas
    }
    );
}

// conta as comarcas que pussuo até agora.
function contarComarcas(Estados) {
    let comarcas = 0;
    let estados = [
        Estados.ma, Estados.es, Estados.go, Estados.al, Estados.se,
        Estados.pi, Estados.mt, // Estados.rn, Estados.ms,
        Estados.rs, Estados.ba, Estados.pe, Estados.ce, Estados.pa,
        Estados.to, Estados.am, Estados.sc, Estados.ac, // Estados.pb,
        Estados.rj, Estados.sp2, Estados.mg, Estados.pr, Estados.sp15
    ];
    for (let i = 0; i < estados.length; i++) {
        for (let j = 0; j < estados[i].comarcas.length; j++) {
            comarcas++
        }
    }
    console.log(comarcas);
}

function varaComarca(str) {
    let regex = /(?:^|\n[\t ]*).*?(\d)º.*?-\s*(.+?D[EO].+?)\s*D[EO]\s*(.+)\s*/gim;
    let m;
    let resultado = []

    while ((m = regex.exec(str)) !== null) {
        // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regex.lastIndex) {
            regex.lastIndex++;
        }

        // The result can be accessed through the `m`-variable.
        m.forEach((match, groupIndex) => {
            resultado.push(`${match}`)
            // console.log(`Found match, group ${groupIndex}: ${match}`);
        });
    }
    return resultado
}

async function corrigeBanco() {
    let estados = [
        Estados.ma, Estados.es, Estados.go, Estados.al, Estados.se,
        Estados.pi, Estados.mt, // Estados.rn, Estados.ms,
        Estados.rs, Estados.ba, Estados.pe, Estados.ce, Estados.pa,
        Estados.to, Estados.am, Estados.sc, Estados.ac, // Estados.pb,
        Estados.rj, Estados.sp2, Estados.mg, Estados.pr, Estados.sp15
    ];
    let resultado;
    let busca;
    let vara;
    let comarca;
    let limite = 1;
    let salto = 0;
    let tribunal;
    //let busca = await Processo.find({ "detalhes.numeroProcesso": "01006283220205010005" });
    for (j in estados) {
        // console.log(estados[j].codigo);
        // process.exit()
        tribunal = parseInt(estados[j].codigo)
        console.log(tribunal);
        let agregar = await Processo.aggregate([
            {
                $match: {
                    'detalhes.tipo': 'cnj',
                    'detalhes.orgao': 5,
                    'detalhes.tribunal': tribunal,
                    'detalhes.ano': 2020,
                    //'capa.vara': /Não\sfoi\spossivel\sobter|do Rio$/
                    'capa.vara': /vara\sdo\strabalho\s/gmi
                }
            },
            {
                $project: {
                    "capa.vara": 1,
                    "capa.comarca": 1
                }
            }
        ]).skip().limit(2000);
        console.log(agregar);
        if (agregar.length > 0) {
            for (i in agregar) {
                busca = { "_id": agregar[i]._id };
                let teste01 = new JTEParser().regexVaraComarca("Processo no 1º grau - " + agregar[i].capa.vara.replace(")", ""))
                console.log(teste01 + " imprimonedo teste");
                if (agregar[i].capa.comarca == teste01[3]) {
                    vara = teste01[2]
                    comarca = removerAcentos(teste01[3])
                    resultado = { 'capa.vara': vara, 'capa.comarca': comarca };
                } else {
                    let join = await "Processo no 1º grau - " + agregar[i].capa.vara + " " + agregar[i].capa.comarca
                    console.log(join);
                    let sliceDados = new JTEParser().regexVaraComarca(join)
                    vara = sliceDados[2]
                    comarca = removerAcentos(sliceDados[3].replace("JI ", ""))
                    resultado = { 'capa.vara': vara, 'capa.comarca': comarca };
                }

                console.log(resultado);
                await Processo.findOneAndUpdate(busca, resultado)
                await sleep(500)
                //console.log(await Processo.find(busca));
            }
        }
    }
}

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


    // let resultado;
    // resultado = await rj.extrair(cnj)
    // return resultado

    // let busca;
    // for (i in BD_busca) {
    //     resultado = { valor, segredoJustica, justicaGratuita }
    //     await Processo.findOneAndUpdate(busca, resultado)
    // }

}

async function deleteUndefine() {
    let obj = await statusEstadosJTE.find({ "comarca": "unde" })
    console.log(obj);
    // let obj2 = await statusEstadosJTE.deleteMany({ "comarca": "unde" }, function (err) {
    //     if (err) return handleError(err);
    //     // deleted at most one tank document
    // });

    // console.log(obj2);
    console.log(obj);
}

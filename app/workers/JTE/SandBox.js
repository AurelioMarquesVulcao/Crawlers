const mongoose = require('mongoose');
const shell = require('shelljs');
const sleep = require('await-sleep');

const { Cnj, Helper } = require('../../lib/util');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { enums } = require('../../configs/enums');
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../../models/schemas/jte')
const Estados = require('../../assets/jte/comarcascopy.json');
const { Processo } = require('../../models/schemas/processo');
const { JTEParser } = require('../../parsers/JTEParser');
const { removerAcentos } = require('../../parsers/BaseParser');
const { Logform } = require('winston');

const fila = new CriaFilaJTE();
const ajuste = new Cnj();
const processoConection = new Processo()

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


    //await statusRaspagem()



    //    contarComarcas(Estados)

    //console.log(varaComarca("Processo no 1º grau - 1ª Vara do Trabalho de Campinas")); 
    //console.log(varaComarca("Processo no 1º grau - 5ª Vara do Trabalho do Rio de Janeiro"));

    await corrigeBanco()

    //console.log(Estados[0]);

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
    let obj = await statusEstadosJTE.find({ "estadoNumero": "02" })
    let ultimos = 0;
    let buscando = 0;
    let naoEncontrado = 0;
    let total = 0;
    for (i in obj) {
        Estado = obj[i].estadoNumero
        Comarca = obj[i].comarca
        Status = obj[i].status
        if (Comarca != "unde") {
            console.log({ Estado, Comarca, Status });
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
        Total_Nao_Encontrado: naoEncontrado
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
        ]).skip(0).limit(1000);
        console.log(agregar);
        if (agregar.length > 0) {
            for (i in agregar) {
                busca = { "_id": agregar[i]._id };
                let teste01 = new JTEParser().regexVaraComarca("Processo no 1º grau - " + agregar[i].capa.vara.replace(")",""))
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
                    comarca = removerAcentos(sliceDados[3].replace("JI ",""))
                    resultado = { 'capa.vara': vara, 'capa.comarca': comarca };
                }

                console.log(resultado);
                await Processo.findOneAndUpdate(busca, resultado)
                await sleep(500)
                console.log(await Processo.find(busca));
            }
        }



    }


    //console.log(await agregar);
    //console.log(join);
    //console.log(agregar[0].capa);

}
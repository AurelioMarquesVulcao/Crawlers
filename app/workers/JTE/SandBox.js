const mongoose = require('mongoose');
const shell = require('shelljs');

const { Cnj, Helper } = require('../../lib/util');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { enums } = require('../../configs/enums');
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../../models/schemas/jte')
const Estados = require('../../assets/jte/comarcascopy.json');
const { Processo } = require('../../models/schemas/processo');

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
    let dados = ['Processo no 1º grau - 1ª Vara do Trabalho de Niterói']

    // let teste = varaComarca(dados)
    // console.log(teste[2]);

    await corrigeBanco()


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
    let busca = await Processo.find({ "detalhes.numeroProcesso": "01006283220205010005" });
    console.log(await busca);

}
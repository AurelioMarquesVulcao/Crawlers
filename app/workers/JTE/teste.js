const mongoose = require('mongoose');
const shell = require('shelljs');

const { Cnj } = require('../../lib/util');
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { enums } = require('../../configs/enums');

const fila = new CriaFilaJTE();
const ajuste = new Cnj();

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

    await fila.salvaStatusComarca("00104979620205100021", "2020-08-07T03:00:00.000Z", "", {"estadoNumero": "10", "comarca": "0021"});
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

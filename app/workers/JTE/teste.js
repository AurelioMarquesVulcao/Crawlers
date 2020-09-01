const shell = require('shelljs');
const { Cnj } = require('../../lib/util');



// (async () => {
//     await shell.exec('pkill chrome');
//     shell.exec('ls');
// })()

let ajuste = new Cnj()

console.log(ajuste.processoSlice("10010164720205020203"));

// let zeros = 5;
// for (let i = 0; i < zeros; i++) {
// //    console.log(i);
// }

// zeros = 2;
// let novoSequencial = ""
// let zero = ""
// for (let i = 0; i < zeros; i++) {
//     zero += "0"
// }
// console.log(zero);

(async () => {
    var sequencial = "0001033"
    let zero = ajuste.corrigeSequencial(sequencial).zero
    zero = zero.substr(1)
    //console.log(zero);
    console.log(novoSequencial(sequencial));

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

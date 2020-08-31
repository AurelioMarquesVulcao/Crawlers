const shell = require('shelljs');
const { Cnj } = require('../../lib/util');



// (async () => {
//     await shell.exec('pkill chrome');
//     shell.exec('ls');
// })()

let ajuste = new Cnj()

console.log(ajuste.processoSlice("10010164720205020203").comarca - 1);

let zeros = 5;
for (let i = 0; i < zeros; i++) {
//    console.log(i);
}

zeros = 2;
let novoSequencial = ""
let zero = ""
for (let i = 0; i < zeros; i++) {
    zero += "0"
}
console.log(zero);
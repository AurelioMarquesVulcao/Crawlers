const shell = require('shelljs');
const sleep = require('await-sleep');
const { Util } = require('./lib/util');
const util = new Util();

// shell.exec('pkill chrome');
// setInterval(async function () {

//     console.log(util.timerNow());

// }, 2000);
//util.dockerUp("worker-jte-01");
util.dockerStop("worker-jte-01");


// (async () => {
//     setInterval(async function () {
//         console.log("vou executar shell");
        
//         //await util.dockerUp("worker-jte-01")
//         // await sleep(5000)

//         console.log("executei Shell");

//         // process.exit()


//     }, 1000);
// })()

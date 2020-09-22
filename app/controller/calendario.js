const shell = require('shelljs');
const sleep = require('await-sleep');
const { Util } = require('./lib/util');
const util = new Util();

// shell.exec('pkill chrome');
// setInterval(async function () {

//     console.log(util.timerNow());

// }, 2000);
//util.dockerUp("worker-jte-01");
//util.dockerStop("worker-jte-01");


(async () => {
    setInterval(async function () {
        let time = util.timerNow();
        console.log(time);
        if (time.hora == 18 && time.min == 35 && time.seg == 00) {
            util.dockerUp("worker-jte-01");
        }
        if (time.hora == 18 && time.min == 36 && time.seg == 00) {
            util.dockerStop("worker-jte-01");
        }


    }, 1000);
})()

const shell = require('shelljs');
const sleep = require('await-sleep');
const { Util } = require('./lib/util');
const util = new Util();
const Calendario = require('./lib/banco.json')



// class CalendarioServicos {
//     constructor() {
//         this.listaWorkerJte = [
//             "worker-jte-01", "worker-jte-02",
//             "worker-jte-03", "worker-jte-04",
//             "worker-jte-05", "worker-jte-06", "worker-jte-07"
//         ];
//         this.listaFilaJte = [
//             "novos-processos-jte-1", "novos-processos-jte-2",
//             "novos-processos-jte-3", "novos-processos-jte-4",
//         ];
//         this.listaWorkerPje = [
//             "worker-trt-01", "worker-trt-02",
//         ];
//         this.listaFilaPje = [

//         ];
//         this.listaWorkerTj = [
//             "worker-tjba-portal"
//         ];
//     };
//     async work(time) {
//         this.desligaJte(time)
//     }
//     async desligaJte(time) {
//         console.log();
//         let desliga = [21, 5];
//         for (i in desliga) {
//             if (time.hora == i && time.min == 00 && time.seg == 00) {
//                 let worker = this.listaWorkerJte.join(" ");
//                 console.log(worker);
//                 util.dockerStop(worker);
//             }
//         }
//     }


    
// }

// (async () => {
//     let ativador = new CalendarioServicos();
//     let time = util.timerNow();
//     ativador.work(time)
//     process.exit();
// })();





// Em produção
(async () => {
    setInterval(async function () {
        let time = util.timerNow();
        console.log(time);
        // Inicio dos serviços JTE
        if (time.hora == 21 && time.min == 00 && time.seg == 00) {
            util.dockerStop("worker-jte-01 worker-jte-02");
            util.dockerStop("worker-jte-03 worker-jte-04");
            util.dockerStop("worker-jte-05 worker-jte-06");
            util.dockerStop("novos-processos-jte-4 novos-processos-jte-3");
            util.dockerStop("novos-processos-jte-1 novos-processos-jte-2");
        }
        if (time.hora == 23 && time.min == 00 && time.seg == 00) {
            util.dockerUp("worker-jte-01");
            util.dockerUp("worker-jte-03");
            util.dockerUp("worker-jte-05");
            util.dockerUp("novos-processos-jte-3");
            util.dockerUp("novos-processos-jte-1 novos-processos-jte-2");
        }
        if (time.hora == 5 && time.min == 00 && time.seg == 00) {
            util.dockerStop("worker-jte-01 worker-jte-02");
            util.dockerStop("worker-jte-03 worker-jte-04");
            util.dockerStop("worker-jte-05 worker-jte-06");
            util.dockerStop("novos-processos-jte-4 novos-processos-jte-3");
            util.dockerStop("novos-processos-jte-1 novos-processos-jte-2");
        }
        if (time.hora == 8 && time.min == 00 && time.seg == 00) {
            util.dockerUp("worker-jte-01");
            util.dockerUp("worker-jte-03");
            util.dockerUp("worker-jte-05");
            util.dockerUp("novos-processos-jte-3");
            util.dockerUp("novos-processos-jte-1 novos-processos-jte-2");
            util.escalaContainer("worker-trt-02", 8);
        }

        // Fim dos serviços JTE

        // Inicio dos serviços JPE
        if (time.hora == 21 && time.min == 5 && time.seg == 00) {
            util.escalaContainer("worker-trt-02", 8);
            util.escalaContainer("worker-tjba-portal", 2);

        }
        if (time.hora == 22 && time.min == 55 && time.seg == 00) {
            util.escalaContainer("worker-trt-02", 1);
            util.escalaContainer("worker-tjba-portal", 1);
        }
        if (time.hora == 5 && time.min == 5 && time.seg == 00) {
            util.escalaContainer("worker-trt-02", 8);
            util.escalaContainer("worker-tjba-portal", 2);
        }
        if (time.hora == 7 && time.min == 55 && time.seg == 00) {
            util.escalaContainer("worker-trt-02", 1);
            util.escalaContainer("worker-tjba-portal", 1);
        }
        // Fim dos serviços PJE

    }, 1000);
})();

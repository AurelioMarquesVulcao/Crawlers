const shell = require('shelljs');
const sleep = require('await-sleep');
const { Util } = require('./lib/util');
const util = new Util();
// const Calendario = require('./lib/banco.json');

const {Variaveis} = require('../lib/variaveisRobos');



// console.log(Calendario);

class CalendarioServicos {
    // constructor(Calendario) {
    //     this.Calendario = await Variaveis.catch({ "codigo": "000002" }).variaveis;
    // };
    async work() {
        let start = 1;
        let horaAntiga;
        let Calendario = await Variaveis.catch({ "codigo": "000002" });
        Calendario =Calendario.variaveis; 
        // console.log(Calendario);
        setInterval(async function () {
            let time = util.timerNow();
            let { hora, min, seg, semana } = time
            let calServ = new CalendarioServicos();
            // let time = util.timerNow();

            if (horaAntiga != hora || start == 1) {
                // if (horaAntiga < hora || start == 1 || horaAntiga > hora) {
                start++
                console.log("Ligou!!!");



                calServ.ligaServicos(time, Calendario);
                calServ.desligaServicos(time, Calendario);
                calServ.escalaServico(time, Calendario);



                horaAntiga = hora
            }
            // console.log("rodou fora", seg);

        }, 1000);
    }

    async ligaServicos(time, Calendario) {
        let { hora, min, seg, semana } = time
        // console.log(hora, semana);
        for (let i = 0; i < Calendario.length; i++) {
            let { nome, peso, [semana]: { liga, desliga, escalar, prioridade } } = Calendario[i];
            // console.log(liga.find(element => element == hora));  
            if (liga.length > 0) {
                if (liga.find(element => element == hora)) {
                    util.dockerUp(nome)
                }
            }

        }

    }
    async desligaServicos(time, Calendario) {
        let { hora, min, seg, semana } = time
        for (let i = 0; i < Calendario.length; i++) {
            let { nome, peso, [semana]: { liga, desliga, escalar, prioridade } } = Calendario[i];
            if (desliga.length > 0) {
                if (desliga.find(element => element == hora)) {
                    util.dockerStop(nome)
                }
            }
        }
    }
    async escalaServico(time, Calendario) {
        let { hora, min, seg, semana } = time
        for (let i = 0; i < Calendario.length; i++) {
            let { nome, peso, [semana]: { liga, desliga, escalar, prioridade } } = Calendario[i];
            if (escalar.length > 0) {
                for (let j = 0; j < escalar.length; j++) {
                    let { horaScale, quantidade } = escalar[j];
                    if (horaScale == hora) {
                        // if (horaScale.find(element => element == hora)) {
                        util.escaleContainer(nome, quantidade)
                    }
                }
            }
        }
    }
}

(async () => {
    let ativador = new CalendarioServicos();
    ativador.work()

    // process.exit();
})();






const shell = require('shelljs');
const sleep = require('await-sleep');
const { Util } = require('./lib/util');
const util = new Util();
// const Calendario = require('./lib/banco.json');

const Calendario = [
    {
        "nome": "worker-jte-01",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
        "quarta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "quinta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sexta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sabado": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "domingo": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
    },
    {
        "nome": "worker-jte-02",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
        "quarta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "quinta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sexta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sabado": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "domingo": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
    },
    {
        "nome": "worker-jte-03",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
        "quarta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "quinta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sexta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sabado": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "domingo": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
    },
    {
        "nome": "worker-jte-04",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
        "quarta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "quinta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sexta": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "sabado": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
        "domingo": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 }, { "horaScale": 12, "quantidade": 1 }],
            "prioridade": 1
        },
    },
    {
        "nome": "novos-processos-jte-1",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
    },
    {
        "nome": "novos-processos-jte-2",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
    },
    {
        "nome": "novos-processos-jte-3",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
    },
    {
        "nome": "novos-processos-jte-4",
        "peso": 15.78,
        "segunda": {
            "liga": [23, 8],
            "desliga": [21, 5, 12],
            "escalar": [{ "horaScale": 9, "quantidade": 2 },],
            "prioridade": 1
        },
        "terca": {
            "liga": [23, 8],
            "desliga": [21, 5],
            "escalar": [{ "horaScale": 8, "quantidade": 2 },],
            "prioridade": 1
        },
    },
    {
        "nome": "worker-trt-02",
        "peso": 15.78,
        "segunda": {
            "liga": [21, 5, 9, 12],
            "desliga": [23, 8],
            "escalar": [{ "horaScale": 21, "quantidade": 4 }, { "horaScale": 5, "quantidade": 4 }, { "horaScale": 12, "quantidade": 4 }],
            "prioridade": 1
        },
        "terca": {
            "liga": [21, 5, 9, 12],
            "desliga": [23, 8],
            "escalar": [{ "horaScale": 21, "quantidade": 4 }, { "horaScale": 5, "quantidade": 4 }, { "horaScale": 12, "quantidade": 4 }],
            "prioridade": 1
        },
    },
    {
        "nome": "worker-tjba-portal",
        "peso": 15.78,
        "segunda": {
            "liga": [21, 5, 9, 12],
            "desliga": [23, 8],
            "escalar": [{ "horaScale": 11, "quantidade": 1 }],
            "prioridade": 1
        },
        "terca": {
            "liga": [21, 5, 9, 12],
            "desliga": [23, 8],
            "escalar": [{ "horaScale": 11, "quantidade": 1 }],
            "prioridade": 1
        },
    },


];



class CalendarioServicos {
    // constructor(Calendario) {
    //     this.Calendario = Calendario
    // };
    async work() {
        let start = 1
        let horaAntiga;
        setInterval(async function () {
            let time = util.timerNow();
            let { hora, min, seg, semana } = time
            let calServ = new CalendarioServicos();
            // let time = util.timerNow();

            if (horaAntiga != hora || start == 1) {
                // if (horaAntiga < hora || start == 1 || horaAntiga > hora) {
                start++
                console.log("rodou dentro");



                calServ.ligaServicos(time);
                calServ.desligaServicos(time);
                calServ.escalaServico(time);



                horaAntiga = hora
            }
            console.log("rodou fora", seg);

        }, 1000);
    }

    async ligaServicos(time) {
        let { hora, min, seg, semana } = time
        // console.log(hora, semana);
        for (let i = 0; i < Calendario.length; i++) {
            let { nome, peso, [semana]: { liga, desliga, escalar, prioridade } } = Calendario[i];
            // console.log(nome, peso, liga, desliga, escalar, prioridade);

            // console.log(liga.find(element => element == hora));  
            if (liga.find(element => element == hora)) {
                util.dockerUp(nome)
            }
        }

    }
    async desligaServicos(time) {
        let { hora, min, seg, semana } = time
        for (let i = 0; i < Calendario.length; i++) {
            let { nome, peso, [semana]: { liga, desliga, escalar, prioridade } } = Calendario[i];
            if (desliga.find(element => element == hora)) {
                util.dockerStop(nome)
            }
        }
    }
    async escalaServico(time) {
        let { hora, min, seg, semana } = time
        for (let i = 0; i < Calendario.length; i++) {
            let { nome, peso, [semana]: { liga, desliga, escalar, prioridade } } = Calendario[i];
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

(async () => {
    let ativador = new CalendarioServicos();
    ativador.work()

    // process.exit();
})();






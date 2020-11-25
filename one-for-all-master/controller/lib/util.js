const shell = require('shelljs');
const sleep = require('await-sleep');

class Util {
    static timerNow() {
        let data = new Date();
        let Semana = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
        // Guarda cada pedaço em uma variável
        let dia = data.getDate();           // 1-31
        let dia_sem = data.getDay();        // 0-6 (zero=domingo)
        let mes = data.getMonth();          // 0-11 (zero=janeiro)
        let ano2 = data.getYear();           // 2 dígitos
        let ano4 = data.getFullYear();       // 4 dígitos
        let hora = data.getHours();          // 0-23
        let min = data.getMinutes();        // 0-59
        let seg = data.getSeconds();        // 0-59
        let mseg = data.getMilliseconds();   // 0-999
        let tz = data.getTimezoneOffset(); // em minutos
        let semana = Semana[dia_sem];
        return { dia, mes, hora, min, seg, semana }
    }
    static limpaMemoria() {
        shell.exec(`sudo sync && sudo sysctl vm.drop_caches=3`)
    }

    static async PM2(comando) {
        shell.exec(`pm2 ${comando}`)
    }

    /**
     * exemplo : pm2 start app/workers/JTE_DOC/Worker/extracao_JTE_5doc.js --name doc13 -- 13
     * @param {*} servico 
     * @param {*} nome 
     * @param {*} variavel 
     */
    static async Pm2Variaval(servico, nome, variavel) {
        shell.exec(`pm2 start ${servico} --name ${nome} -- ${variavel}`)
    }
    static async stopPM2All(time = 0) {
        await sleep(time)
        shell.exec("pm2 restart all")
    }
    static dockerUp(servico) {
        shell.exec(`docker-compose up -d ${servico}`)
    }
    static dockerUpBuild(servico) {
        shell.exec(`docker-compose up -d --build ${servico}`)
    }
    static dockerUpAll() {
        shell.exec('docker-compose up -d')
    }
    static dockerStop(serviço) {
        shell.exec(`docker-compose stop ${serviço}`)
    }
    static dockerStopAll() {
        shell.exec('docker-compose stop')
    }
    static dockerDownAll() {
        shell.exec('docker-compose down')
    }
    static entraContainer(servico) {
        // shell.exec(`docker-compose exec ${servico} --i pm2 scale worker-03 3`)
        // shell.exec(`docker-compose exec ${servico} bash`,{ silent: true })
    }
    static escaleContainer(servico, quantidade) {
        shell.exec(`docker-compose scale ${servico}=${quantidade}`)
    }

}

module.exports.Util = Util;
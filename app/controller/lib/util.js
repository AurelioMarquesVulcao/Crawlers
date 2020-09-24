const shell = require('shelljs');
const sleep = require('await-sleep');

class Util {
    timerNow() {
        let data = new Date();
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

        return { dia, mes, hora, min, seg }
    }
    limpaMemoria() {
        shell.exec(`sudo sync && sudo sysctl vm.drop_caches=3`)
    }
    resetPM2(time = 0) {
        await sleep(time)
        shell.exec("pm2 restart all")
    }
    dockerUp(serviço) {
        shell.exec(`docker-compose up -d ${serviço}`)
    }
    dockerUpAll() {
        shell.exec('docker-compose up -d')
    }
    dockerStop(serviço) {
        shell.exec(`docker-compose stop ${serviço}`)
    }
    dockerStopAll() {
        shell.exec('docker-compose stop')
    }
    dockerDownAll() {
        shell.exec('docker-compose down')
    }
    entraContainer(servico) {
        // shell.exec(`docker-compose exec ${servico} --i pm2 scale worker-03 3`)
        // shell.exec(`docker-compose exec ${servico} bash`,{ silent: true })
    }
    escalaContainer(servico, quantidade) {
        shell.exec(`docker-compose scale ${servico}=${quantidade}`)
    }

}

module.exports.Util = Util;
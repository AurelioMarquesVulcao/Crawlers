const shell = require('shelljs');

class Util{
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
    dockerUp(serviço){
        shell.exec(`docker-compose up -d ${serviço}`)
    }
    dockerUpAll(serviço){
        shell.exec('docker-compose up -d')
    }
    dockerStop(serviço){
        shell.exec(`docker-compose stop ${serviço}`)
    }
    dockerStopAll(){
        shell.exec('docker-compose stop')
    }
    dockerDownAll(){
        shell.exec('docker-compose down')
    }
}

module.exports.Util = Util;
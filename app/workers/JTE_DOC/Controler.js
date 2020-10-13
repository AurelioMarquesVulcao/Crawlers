const shell = require('shelljs');
const sleep = require('await-sleep');
const axios = require('axios');
require('dotenv').config();

class Util {
  static timerNow() {
    let data = new Date();
    let Semana = [
      'domingo',
      'segunda',
      'terca',
      'quarta',
      'quinta',
      'sexta',
      'sabado',
    ];
    // Guarda cada pedaço em uma variável
    let dia = data.getDate(); // 1-31
    let dia_sem = data.getDay(); // 0-6 (zero=domingo)
    let mes = data.getMonth(); // 0-11 (zero=janeiro)
    let ano2 = data.getYear(); // 2 dígitos
    let ano4 = data.getFullYear(); // 4 dígitos
    let hora = data.getHours(); // 0-23
    let min = data.getMinutes(); // 0-59
    let seg = data.getSeconds(); // 0-59
    let mseg = data.getMilliseconds(); // 0-999
    let tz = data.getTimezoneOffset(); // em minutos
    let semana = Semana[dia_sem];
    return { dia, mes, hora, min, seg, semana };
  }
  static limpaMemoria() {
    shell.exec(`sudo sync && sudo sysctl vm.drop_caches=3`);
  }
  static async resetPM2(time = 0) {
    await sleep(time);
    shell.exec('pm2 restart all');
  }
  static teste(serviço) {
    shell.exec(`node app/workers/JTE_DOC/Worker/teste.js ${serviço}`);
  }
  static ligaWorker(fila) {
    shell.exec(`node app/workers/JTE_DOC/Worker/extratorEstado_01.js ${fila}`);
  }
}

class Fila {
  static urlRabbit() {
    const rabbit = process.env.RABBITMQ_CONNECTION_STRING;
    const regex = rabbit.replace(/amqp(.*)([0-9]{4})$/, 'http$11$2/api/queues');
    return regex;
  }
  static async getFila() {
    var rabbitMQ = this.urlRabbit();
    return await axios.get(rabbitMQ).then((resp) => {
      return resp.data
        .map((fila) => {
          return {
            nome: fila.name,
            qtd: fila.messages,
            status: fila.messages_unacknowledged > 0 ? 'Rodando' : 'Aguardando',
            qtdConsumo: fila.messages_unacknowledged,
          };
        })
        .filter(
          (x) =>
            x.qtd > 0 &&
            // x.status == 'Aguardando' &&
            /^peticao\.jte\.extracao/i.test(x.nome)
        );
    });
  }
}

class Worker {
  static async ligar() {
    const fila = await Fila.getFila();
    console.log(fila);

    if (fila.length > 0){
      console.log(fila.length);
      for (let i = 0; i< length){

      }
    } else{
      console.log("não foi atribuido");
    }
    // Util.ligaWorker('peticao.JTE.extracao_01');
  }
}

// Util.teste('foi');
// console.log(Fila.urlRabbit());
(async () => {
  Worker.ligar();
})();

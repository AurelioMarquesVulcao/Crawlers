const axios = require('axios');
class Fila {
  static urlRabbit() {
    const rabbit = process.env.RABBITMQ_CONNECTION_STRING;
    const regex = rabbit.replace(/amqp(.*)([0-9]{4})$/, 'http$11$2/api/queues');
    return regex;
  }
  /**Obtem da fila os dados da fila solicitada */
  static async getFila(regex) {
    let Regex = new RegExp(regex, 'i');
    // console.log(Regex);
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
        .filter((x) => Regex.test(x.nome));
    });
  }
}
module.exports.Fila = Fila;

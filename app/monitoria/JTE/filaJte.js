const { Email } = require('../../lib/sendEmail');
const { Helper } = require('../../lib/util');
const axios = require('axios');
require('dotenv/config');
const mensagens = require('../../assets/Monitoria/mensagens.json');

/** Verifica no rabbit as filas repassando o status */
class Fila {
  static urlRabbit() {
    const rabbit = process.env.RABBITMQ_CONNECTION_STRING;
    const regex = rabbit.replace(/amqp(.*)([0-9]{4})$/, 'http$11$2/api/queues');
    return regex;
  }
  /** Fila sem nenhum consumer */
  static async getFilaZero() {
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
            x.qtdConsumo == 0
          // x.status == 'Aguardando' &&
          // /^reprocessamentojte/i.test(x.nome)
        );
    });
  }
  /** fila com 1 ou mais consumer */
  static async getFilaConsumo() {
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
            x.qtdConsumo > 0
          // x.status == 'Aguardando' &&
          // /^reprocessamentojte/i.test(x.nome)
        );
    });
  }
}
/** Recebe os metodos de monitoria */
class Monitores {
  /**
   * Monitora as 4 filas JTE
   * @param {array} fila Status da fila
   */
  static async workerJte(fila) {
    let contador = [];
    for (let i = 0; i < fila.length; i++) {
      // filtra para apenas as filas JTE
      if (/^processo\.jte\.extracao/i.test(fila[i].nome)) {
        // Verifica se tenho correspondencia na minha base, com as filas.
        if (mensagens.jte.filas.indexOf(fila[i].nome) != -1) {
          contador.push("true")
        }
      }
    }
    // Se possuir o mesmo numero de correspondencias, mando o e-mail
    if (contador.length === mensagens.jte.filas.length) {
      this.criaMensagem("jte")
    }
  }
  /** Cria a mensagem a ser enviado no e-mail */
  static criaMensagem(objetivo) {
    let { destinatarios, titulo, mensagem } = mensagens[objetivo];
    mensagem =  `${mensagem}  Data: ${new Date}`;
    Email.send(destinatarios, titulo, mensagem);
  }
}
module.exports.Monitores = Monitores;

(async () => {
  const fila = await Fila.getFilaConsumo();
  await Monitores.workerJte(fila)
  // console.log(await Fila.getFila());
})()

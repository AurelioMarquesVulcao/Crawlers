const amqp = require('amqplib/callback_api');
const { enums } = require('../configs/enums');

class GerenciadorFila {
  /** Handler que envia e consome mensagens de uma fila do RabbitMq.
   * @param {number} prefetch int com número de consumidores da fila.
   */
  constructor(host = null, prefetch = 1) {
    this.host = host ? host : enums.rabbitmq.connString;
    this.prefetch = prefetch;
  }

  /** Enviar uma mensagem para uma fila
   * @param {any} ch          RabbitMQ Channel
   * @param {String} fila     Fila do RabbitMQ
   * @param {String} mensagem   Mensagem em JSON
   */
  enviarMensagem(ch, fila, mensagem) {
    //console.log(`${mensagem} -> ${fila}`);
    const buffer = Buffer.from(mensagem);
    ch.sendToQueue(fila, buffer);
  }

  /** Trata e envia uma mensagem para uma fila.
   * @param {String} fila     String que contém o nome da fila.
   * @param {any} mensagem    Mensagem a ser enviada.
   */
  enviar(fila, mensagem) {
    if (typeof mensagem === 'object') mensagem = JSON.stringify(mensagem);

    amqp.connect(this.host, (err, conn) => {
      if (err) throw new Error(err);

      conn.createChannel((err, ch) => {
        if (err) throw new Error(err);

        ch.assertQueue(fila, {
          durable: true,
          noAck: false,
          maxPriority: 9,
        });

        this.enviarMensagem(ch, fila, mensagem);
      });
    });
  }

  /** Envia uma lista de mensagens para uma fila.
   * @param {String} fila String com o nome da fila
   * @param {Array} lista Array de JSON
   */
  enviarLista(fila, lista) {
    amqp.connect(this.host, (err, conn) => {
      if (err) throw new Error(err);

      conn.createChannel((err, ch) => {
        if (err) throw new Error(err);

        for (let i = 0; i < lista.length; i++) {
          this.enviarMensagem(ch, fila, lista[i]);
        }
      });

      setTimeout(() => {
        console.log(`${lista.lenght} mensagem enviada(s) para fila!`);
        conn.close();
      }, lista.lenght * 500);
    });
  }

  /** Consome de uma fila espeficia.
   * @param {String} fila String com o nome da fila.
   * @param {function} callback Callback
   */
  consumir(fila, callback) {
    amqp.connect(this.host, (err, conn) => {
      if (err) throw new Error(err);

      conn.createChannel((err, ch) => {
        if (err) throw new Error(err);

        ch.assertQueue(fila, {
          durable: true,
          noAck: false,
          maxPriority: 9,
        });
        ch.prefetch(this.prefetch);

        const texto = `Consumindo de ${this.prefetch} em ${this.prefetch}`;

        console.log(
          `[*] Observando a fila: ${fila} ${texto}! Para cancelar pressione CTRL+C\n`
        );

        ch.consume(fila, async (msg) => {
          await callback(ch, msg);
        });
      });
    });
  }

  /** Transfere as mensagens de uma fila a outra.
   * @param {string} filaOrigem   String contendo o nome da fila de origem.
   * @param {string} filaDestino  String contendo o nome da fila de destino.
   */
  transferir(filaOrigem, filaDestino) {
    amqp.connect(this.host, (err, conn) => {
      if (err) throw new Error(err);

      conn.createChannel((err, ch) => {
        if (err) throw new Error(err);

        ch.assertQueue(filaOrigem, {
          durable: true,
          noAck: false,
          maxPriority: 9,
        });
        ch.prefetch(this.prefetch);

        const texto = `Consumindo de ${this.prefetch} em ${this.prefetch}`;

        console.log(
          `[*] Observando a fila: ${filaOrigem} ${texto}! Para cancelar pressione CTRL+C\n`
        );

        ch.consume(filaOrigem, (msg) => {
          const mensagem = msg.content.toString();

          const buffer = Buffer.from(mensagem);

          ch.assertQueue(filaDestino, {
            durable: true,
            noAck: false,
            maxPriority: 9,
          });
          ch.sendToQueue(filaDestino, buffer);

          console.log(`${filaOrigem}#${mensagem} -> ${filaDestino}`);

          ch.ack(msg);
        });
      });
    });
  }
}

// EXPORTS
module.exports.GerenciadorFila = GerenciadorFila;

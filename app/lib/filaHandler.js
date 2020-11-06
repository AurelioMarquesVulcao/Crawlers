const amqpCA = require('amqplib/callback_api');
const amqp = require('amqplib');
const { enums } = require('../configs/enums');
const sleep = require('await-sleep');

const pred = (params) => {

  console.log(params);
  process.exit();

};

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
    // console.log(mensagem);
    // console.log(mensagem.length);
    amqpCA.connect(this.host, (err, conn) => {
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

  /** Trata e envia uma mensagem para uma fila.
 * @param {String} fila     String que contém o nome da fila.
 * @param {any} lista    Lista de Mensagem a serem enviadas.
 */
  enviarLista(fila, lista) {
    if (typeof mensagem === 'object') mensagem = JSON.stringify(mensagem);

    amqpCA.connect(this.host, (err, conn) => {
      if (err) throw new Error(err);

      conn.createChannel((err, ch) => {
        if (err) throw new Error(err);

        ch.assertQueue(fila, {
          durable: true,
          noAck: false,
          maxPriority: 9,
        });
        for (i in lista) {
          this.enviarMensagem(ch, fila, lista[i]);
        }

      });
    });
    conn.close();
  }


/**
   * Enfileirar um lote de mensagens para uma fila
   * @param {string} fila String com o nome da fila
   * @param {Array} lote Array com o lote de mensagens
   */
  async enfileirarLote(fila, lote) {
    try {
      
      const conn = await amqp.connect(this.host);
      const channel = await conn.createChannel();
  
      channel.assertQueue(fila, {
        durable: true,
        noAck: false,
        maxPriority: 9,
      });
  
      for (let i = 0, si = lote.length; i < si; i++) {
        // console.log(lote[i]);
        channel.sendToQueue(fila, Buffer.from(JSON.stringify(lote[i]), {

        }));
      }
  
    } catch (e) {
      pred(e);
    }
  }



  /**
   * Enfileirar um lote de mensagens para uma fila
   * @param {string} fila String com o nome da fila
   * @param {array} lote Array com o lote de mensagens, 
   * os elementos desse array devem ser tipo string
   */
  async enfileirarLoteTRT(fila, lote) {
    try {
      console.log("mensagens");
      const conn = await amqp.connect(this.host);
      const channel = await conn.createChannel();

      channel.assertQueue(fila, {
        durable: true,
        noAck: false,
        maxPriority: 9,
      });

      for (let i = 0, si = lote.length; i < si; i++) {
        channel.sendToQueue(fila, Buffer.from(lote[i]));
        await sleep(1);
        console.log(lote[i]);
        // console.log("enviei mensagem" + [i]);
        // await sleep(5000);
        // process.exit()
      }

    } catch (e) {
      pred(e);
    }
  }

  /** Consome de uma fila espeficia.
   * @param {String} fila String com o nome da fila.
   * @param {function} callback Callback
   */
  consumir(fila, callback) {
    amqpCA.connect(this.host, (err, conn) => {
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
    amqpCA.connect(this.host, (err, conn) => {
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

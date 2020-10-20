const { Email } = require('../../lib/sendEmail');
const axios = require('axios');
require('dotenv/config');

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
        console.log(/^ReprocessamentoJTE/i.test(fila[0].nome));
        if (/^ReprocessamentoJTE/i.test(fila[0].nome)) {
            Email.send(
                "amarques@impacta.adv.br",
                "Envio de logs do sistema",
                `Fila ReprocessamentoJTE possui com.: ${fila[0].qtdConsumo} worker's ligados`
            )
        }

    }
    /** Cria a mensagem a ser enviado no e-mail */
    static criaMensagem(){
        
    }
}
(async () => {
    const fila = await Fila.getFilaConsumo();
    await Monitores.workerJte(fila)
    // console.log(await Fila.getFila());
})()

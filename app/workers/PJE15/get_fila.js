const axios = require('axios');

var rabbitMQ = 'http://admin:crawler480@172.16.16.39:15676/api/queues';

module.exports.getFilas = async () => {
    return await axios.get(rabbitMQ).then(resp => {
        return resp.data.map(fila => {
            return {
                nome: fila.name,
                qtd: fila.messages,
                status: fila.messages_unacknowledged > 0 ? "Rodando" : "Aguardando",
                qtdConsumo: fila.messages_unacknowledged

            }
            // }).filter(x => x.qtd >= 0 && /^processo\.pje\.extracao/i.test(x.nome))
        }).filter(x => x.qtd <= 100 && /^processo\.pje\.extracao/i.test(x.nome))
        // }).filter(x => x.qtd >= 0 && x.status == 'Aguardando' && /^processo\.pje\.extracao/i.test(x.nome))
    })
}



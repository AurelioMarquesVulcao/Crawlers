const axios = require('axios');
const Estados = require('../../assets/jte/comarcascopy.json');

var rabbitMQ = 'http://admin:crawler480@172.16.16.3:15676/api/queues';

module.exports.getFilas = async () => {
    return await axios.get(rabbitMQ).then(resp => {
        return resp.data.map(fila => {
            return {
                nome: fila.name,
                qtd: fila.messages,
                status: fila.messages_unacknowledged > 0 ? "Rodando" : "Aguardando",
                qtdConsumo: fila.messages_unacknowledged

            }
        }).filter(x => x.qtd == 0 && x.status == 'Aguardando' && /^processo\.jte\.extracao/i.test(x.nome))
    })
}

// const getFilas = async () => {
//     return await axios.get(rabbitMQ).then(resp => {
//         return resp.data.map(fila => {
//             return {
//                 nome: fila.name,
//                 qtd: fila.messages,
//                 status: fila.messages_unacknowledged > 0 ? "Rodando" : "Aguardando",
//                 qtdConsumo: fila.messages_unacknowledged

//             }
//         }).filter(x => x.qtd == 0 && x.status == 'Aguardando' && /^processo\.jte\.extracao/i.test(x.nome))
//     })
// }

// (async () => {
//     var filas = await getFilas();
//     console.log(filas);
// })()

require('dotenv/config');

const env = 'dev';

const bigdataAddress = process.env.BIG_DATA_ADDRESS;
console.log('BigData Address', bigdataAddress); //TODO remove

module.exports.enums = Object.freeze({
  mongo: {
    connString: process.env.MONGO_CONNECTION_STRING,
  },
  rabbitmq: {
    connString: process.env.RABBITMQ_CONNECTION_STRING,
  },
  nomesRobos: {
    TJBAPortal: 'TJBAPortal',
    TJSP: 'TJSP',
    TJRS: 'TJRS',
    TJSC: 'TJSC',
    TJMG: 'TJMG',
    JTE: 'JTE',
    TRTRJ: 'TRTRJ',
    TRTSP: 'PJE',
    PJE: 'PJE',
    TJCE: 'TJCE'
  },
  tipoConsulta: {
    Oab: 'oab',
    Processo: 'processo',
    Peticao: 'peticao',
  },
  tipoFila: {
    Novos: "novos",
    Atualizacao: "atualizacao",
    Extracao: "extracao"
  },
  bigdataUrls: {
    captchaDecoder: 'http://172.16.16.8:5000/api/solve',
    resultadoDocumentos: `http://${bigdataAddress}/processos/documentos/uploadPeticaoInicial/`,
    login: `http://${bigdataAddress}/login/`
  },
  proxy: {
    proxiesUrl: process.env.PROXY_ADDRESS,
  },
  bigdataAddress,
});

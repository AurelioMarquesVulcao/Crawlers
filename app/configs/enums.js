require('dotenv/config');

const env = 'dev';

const bigdataAddress = process.env.BIG_DATA_ADDRESS;

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
    TJCE: 'TJCE',
    TJMS: 'TJMS',
  },
  tribunalFactory: {
    TJRS: {
      tribunal: 21,
      orgao: 8,
    },
    TJSP: {
      tribunal: 26,
      orgao: 8,
    },
    TJMS: {
      tribunal: 12,
      orgao: 8,
    },
    TJSC: {
      tribunal: 24,
      orgao: 8,
    },
  },
  tipoConsulta: {
    Oab: 'oab',
    Processo: 'processo',
    Peticao: 'peticao',
  },
  tipoFila: {
    Novos: 'novos',
    Atualizacao: 'atualizacao',
    Extracao: 'extracao',
    Reprocessamento: 'reprocessamento',
  },
  bigdataUrls: {
    captchaDecoder: 'http://172.16.16.8:5000/api/solve',
    resultadoDocumentos: `http://${bigdataAddress}/processos/documentos/uploadPeticaoInicial/`,
    login: `http://${bigdataAddress}/login/`,
  },
  proxy: {
    proxiesUrl: process.env.PROXY_ADDRESS,
  },
  bigdataAddress,
});

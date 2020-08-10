require("dotenv/config");

const env = "dev";

const bigdataAddress = process.env.BIG_DATA_ADDRESS;
console.log("BigData Address", bigdataAddress); //TODO remove

module.exports.enums = Object.freeze({
  mongo: {
    connString: process.env.MONGO_CONNECTION_STRING,
    address: `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@${process.env.MONGO_ADDRESS}/${process.env.MONGO_DATABASE}`,
    databse: process.env.MONGO_DATABASE,
    username: process.env.MONGO_ROOT_USERNAME,
    password: process.env.MONGO_ROOT_PASSWORD
  },
  rabbitmq: {
    connString: process.env.RABBITMQ_CONNECTION_STRING,
    address:
      "amqp://" +
      process.env.RABBITMQ_USERNAME +
      ":" +
      process.env.RABBITMQ_PASSWORD +
      "@" +
      process.env.RABBITMQ_ADDRESS,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD
  },
  nomesRobos: {
    TJBAPortal: "TJBAPortal",
    TJSP: "TJSP",
    TJRS: "TJRS",
    TJSC: "TJSC",
    TJMG: "TJMG",
    JTE: "JTE"    
  },
  robos: {
    TJRS: {
      nome: "TJRS",
      filaExtracao: "TJRS.extracao.novos",
      filaReprocessamento: "TJRS.extracao.novos"
    }
  },
  tipoConsulta: {
    Oab: "oab",
    Processo: "processo",
    Peticao: 'peticao'
  },
  bigdataUrls: {
    resultadoConsulta: `http://${bigdataAddress}/consultaPublica/retornarResultadoConsulta`,
    login: `http://${bigdataAddress}/login/`,
    captchaDecoder: 'http://172.16.16.8:5000/api/solve',
    resultadoDocumentos: `http://${bigdataAddress}/documentos/feedbackDocumentos`
  },
  proxy: {
    proxiesUrl: process.env.PROXY_ADDRESS
  },
  bigdataAddress
});

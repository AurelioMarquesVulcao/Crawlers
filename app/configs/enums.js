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
    TJSP: "TJSP"
  },
  tipoConsulta: {
    Oab: "oab",
    Processo: "processo"
  },
  bigdataUrls: {
    resultadoConsulta: `http://${bigdataAddress}/consultaPublica/retornarResultadoConsulta`,
    login: `http://${bigdataAddress}/login/`
  },
  proxy: {
    proxiesUrl: process.env.PROXY_ADDRESS
  },
  bigdataAddress
});

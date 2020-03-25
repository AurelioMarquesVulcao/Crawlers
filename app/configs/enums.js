require('dotenv/config');

const env = 'dev';

module.exports.enums = Object.freeze({
  mongo: {
    address: `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@${process.env.MONGO_ADDRESS}/${process.env.MONGO_DATABASE}`,
    databse: process.env.MONGO_DATABASE,
    username: process.env.MONGO_ROOT_USERNAME,
    password: process.env.MONGO_ROOT_PASSWORD,
  },
  rabbitmq: {
    address:
      'amqp://' +
      process.env.RABBITMQ_USERNAME +
      ':' +
      process.env.RABBITMQ_PASSWORD +
      '@' +
      process.env.RABBITMQ_ADDRESS,
    username: process.env.RABBITMQ_USERNAME,
    password: process.env.RABBITMQ_PASSWORD,
  },
  nomesRobos: {
    TJBAPortal: 'TJBAPortal',
  },
  tipoConsulta: {
    Oab: 'Oab',
    Processo: 'Processo',
  },
});

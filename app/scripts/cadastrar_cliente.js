const mongoose = require('mongoose');
const uuid = require('uuid');

require('../bootstrap');
const ClienteModel = require('../models/schemas/cliente');

/**
 * Realiza o cadastro de um cliente no Mongo da aplicação.
 *
 * @returns {Promise<mongoose.Types.ObjectId>} _id do cliente no Mongo.
 */
const main = async () => {
  let nome = process.argv[2];

  if (!nome) {
    throw Error('Nome do cliente é obrigatório.');
  }

  console.log(`Sera criado cliente ${nome}`);
  let apiKey = uuid.v4();

  const clienteObj = {
    Nome: nome,
    ApiKey: apiKey,
  };

  try {
    let cliente = await ClienteModel.create(clienteObj);
    return cliente._id;
  } catch (e) {
    throw e;
  }
};

main()
  .then((resultado) =>
    console.log(`Cliente criado com sucesso. _id ${resultado}`)
  )
  .catch((err) => console.error(err))
  .finally(() => {
    mongoose.disconnect();
  });

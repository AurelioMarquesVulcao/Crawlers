const mongoose = require('mongoose');

/**@constant cadastroOabSchema Schema utilizado para validar uma requisição de cadastro de oab. */
const cadastroOabSchema = new mongoose.Schema({
  NumeroOab: {
    type: String,
    required: true,
  },
  TipoInscricao: {
    type: String,
    required: false,
    default: null,
  },
  SeccionalOab: {
    type: String,
    required: true,
  },
});

/**
 * @constant cadastroNumeroCnjSchema Schema utilizado para validar uma requisição de cadastro
 * de processo.
 * */
const cadastroNumeroCnjSchema = new mongoose.Schema({
  NumeroProcesso: {
    type: String,
    required: true,
  },
});

module.exports = { cadastroOabSchema, cadastroNumeroCnjSchema };

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
  TipoConsulta: { type: String, required: false, default: 'oab' },
});

/**
 * @constant cadastroNumeroCnjSchema Schema utilizado para validar uma requisição de cadastro
 * de processo.
 * */
const cadastroNumeroCnjSchema = new mongoose.Schema({
  NumeroProcesso: {
    type: String,
    required: true,
    validate: {
      validator: function (str) {
        return str.length <= 20;
      },
      message: 'Numero do processo nao deve possuir mais do que 20 digitos.',
    },
  },
  TipoConsulta: {
    type: String,
    required: false,
    default: 'processo',
  },
});

module.exports = { cadastroOabSchema, cadastroNumeroCnjSchema };

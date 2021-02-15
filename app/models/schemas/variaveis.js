const mongoose = require('mongoose');


const variaveisSchema = new mongoose.Schema({
  aplicacao: String,
  codigo: Number,
  origem: String,
  variaveis: [],
})
const AplicacaoVar = mongoose.model('VariaveisAmbiente', variaveisSchema, 'variaveisAmbiente');

module.exports.AplicacaoVar = AplicacaoVar;
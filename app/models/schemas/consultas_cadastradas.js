const mongoose = require("mongoose");

const ConsultaCadastroSchema = new mongoose.Schema({
  NumeroOab: {
    type: String,
    required: false,
    default: null
  },
  SeccionalOab: {
    type: String,
    required: false,
    default: null
  },
  NumeroProcesso: {
    type: String,
    required: false,
    default: null
  },
  TipoConsulta: {
    type: String,
    required: true
  },
  DataEnfileiramento: {
    type: Date,
    required: false
  },
  DataCadastro: {
    type: Date,
    default: new Date()
  },
  AtivoParaAtualizacao: {
    type: Boolean,
    default: true
  },
  DataUltimaConsultaTribunal: {
    type: Date,
    required: false,
    default: null
  },
  Instancia: {
    type: String,
    default: "1"
  }
});

const ConsultasCadastradas = mongoose.model(
  "ConsultaCadastro",
  ConsultaCadastroSchema,
  "consultasCadastradas"
);

module.exports = {
  ConsultasCadastradas
};

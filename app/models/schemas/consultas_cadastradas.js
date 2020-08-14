const mongoose = require("mongoose");

const DetalhesSchema = new mongoose.Schema({
  Orgao: Number,
  Tribunal: Number,
}, { _id:false, versionKey: false });

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
  },
  Detalhes: {
    type: DetalhesSchema,
    required: false,
    default: null
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

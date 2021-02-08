const mongoose = require('mongoose');

const DetalhesSchema = new mongoose.Schema(
  {
    Orgao: Number,
    Tribunal: Number,
  },
  { _id: false, versionKey: false }
);

function _agora() {
  return new Date();
}

const HistoricoSchema = new mongoose.Schema(
  {
    Acao: { type: String, enum: ['Ativar', 'Cancelar'] },
    Data: { type: Date, default: _agora },
  },
  { versionKey: false, _id: false }
);

const ConsultaCadastroSchema = new mongoose.Schema(
  {
    NumeroOab: {
      type: String,
      required: false,
      default: null,
    },
    SeccionalOab: {
      type: String,
      required: false,
      default: null,
    },
    NumeroProcesso: {
      type: String,
      required: false,
      default: null,
    },
    TipoConsulta: {
      type: String,
      required: true,
    },
    DataEnfileiramento: {
      type: Date,
      required: false,
    },
    DataCadastro: {
      type: Date,
      default: new Date(),
    },
    AtivoParaAtualizacao: {
      type: Boolean,
      default: true,
    },
    DataUltimaConsultaTribunal: {
      type: Date,
      required: false,
      default: null,
    },
    Instancia: {
      type: String,
      default: '1',
    },
    Detalhes: {
      type: DetalhesSchema,
      required: false,
      default: null,
    },
    ClienteId: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    Historico: {
      type: [HistoricoSchema],
      default: new Array(),
      required: true,
    },
  },
  { versionKey: false }
);

ConsultaCadastroSchema.index(
  { ClienteId: 1, Instancia: 1, TipoConsulta: 1, NumeroProcesso: 1 },
  { unique: true }
);

const ConsultasCadastradas = mongoose.model(
  'ConsultaCadastro',
  ConsultaCadastroSchema,
  'consultasCadastradas'
);

module.exports = {
  ConsultasCadastradas,
};

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExtracaoResultado = new Schema(
  {
    idProcesso: String,
    numeroProcesso: String,
    temAndamentosNovos: Boolean,
    qtdAndamentosNovos: Number,
  },
  { _id: false, versionKey: false }
);

const ExtracaoSchema = new Schema(
  {
    idLog: { type: String, unique: true, required: true },
    data: { type: Date, default: Date.now },
    numeroProcesso: String,
    oab: String,
    resultado: [ExtracaoResultado],
    sucesso: Boolean,
    detalhes: String,
    uf: String,
  },
  {
    versionKey: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.data;
        delete ret.uf;
      },
    },
  }
);

ExtracaoSchema.statics.criarExtracao = async function criarExtracao(
  message,
  extracao,
  uf
) {
  return await Extracao.create({
    idLog: message.LogConsultaId,
    numeroProcesso: message.numeroDoProcesso,
    oab: message.numeroDaOab,
    resultado: extracao.resultado,
    sucesso: extracao.sucesso,
    detalhes: extracao.detalhes,
    uf: uf,
  });
};

ExtracaoSchema.methods.prepararEnvio = function prepararEnvio() {
  return {
    IdLog: this.idLog,
    NumeroCNJ: this.numeroCNJ,
    Oab: String,
    Resultado: this.resultado,
    Sucesso: this.sucesso,
    Detalhes: this.detalhes,
  };
};

const Extracao = mongoose.model('Extracao', ExtracaoSchema, 'extracoes');

module.exports.Extracao = Extracao;

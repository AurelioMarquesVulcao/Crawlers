const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExtracaoSchema = new Schema(
  {
    processoId: String,
    cnj: String,
    instancia: String,
    uf: String,
    data: Date,
    temAndamentosNovos: Boolean,
    qtdAndamentosNovos: Number,
    status: String,
    hasAudiencia: Boolean,
  },
  { versionKey: false }
);

const Extracao = mongoose.model('Extracao', ExtracaoSchema, 'extracoes');

module.exports.Extracao = Extracao;

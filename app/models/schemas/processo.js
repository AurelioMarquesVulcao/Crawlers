const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const capaSchema = new Schema(
  {
    uf: String,
    comarca: String,
    vara: String,
    fase: String,
    assunto: String,
    tipo: String,
    dataDistribuicao: Date,
  },
  { _id: false, versionKey: false }
);

const detalhesSchema = new Schema(
  {
    tipo: String,
    numeroProcesso: String,
    numeroProcessoMascara: String,
    instancia: Number,
    ano: Number,
    orgao: Number,
    tribunal: Number,
    origem: Number,
  },
  { _id: false, versionKey: false }
);

const parteSchema = new Schema(
  {
    nome: String,
    titulo: String,
  },
  { _id: false, versionKey: false }
);

const processoSchema = new Schema(
  {
    capa: capaSchema,
    detalhes: detalhesSchema,
    partes: [parteSchema],
    oabs: [String],
    status: String, //transformar enums
    isBaixa: Boolean,
    temAndamentosNovos: Boolean,
    qtdAndamentosNovos: Number,
    origemExtracao: String,
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'dataCriacao', updatedAt: 'dataAtualizacao' },
  }
);

const Processo = mongoose.model('Processo', processoSchema, 'processos');

module.exports.Processo = Processo;

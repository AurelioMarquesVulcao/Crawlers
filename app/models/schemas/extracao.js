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

/**
 * Cria (ou atualiza) e retorna um objeto do tipo Extracao.
 * @param {{ExecucaoConsultaId: String, NumeroProcesso: String, NumeroOab: String}}message
 * @param {{resultado: [Object], sucesso: Boolean, detalhes: [String]}} extracao
 * @param {String} uf
 * @returns {Promise<Extracao>}
 */
ExtracaoSchema.statics.criarExtracao = async function criarExtracao(
  message,
  extracao,
  uf
) {
  await Extracao.updateOne(
    { idLog: message.ExecucaoConsultaId },
    {
      idLog: message.ExecucaoConsultaId,
      numeroProcesso: message.NumeroProcesso,
      oab: message.NumeroOab,
      resultado: extracao.resultado,
      sucesso: extracao.sucesso,
      detalhes: extracao.detalhes,
      uf: uf,
    },
    { upsert: true }
  );

  return Extracao.findOne({ idLog: message.ExecucaoConsultaId });
};

/**
 * Prepara um json com a formatação referente ao bigdata
 * @returns {{Resultado: (null|[Object]), Sucesso: Boolean, Detalhes: [String], IdLog: String, NumeroDoProcesso: (null|String), NumeroOab: (null|String)}}
 */
ExtracaoSchema.methods.prepararEnvio = function prepararEnvio() {
  return {
    IdLog: this.idLog,
    NumeroDoProcesso: this.NumeroProcesso,
    NumeroOab: this.NumeroOab,
    Resultado: this.resultado,
    Sucesso: this.sucesso,
    Detalhes: this.detalhes,
  };
};

const Extracao = mongoose.model('Extracao', ExtracaoSchema, 'extracoes');

module.exports.Extracao = Extracao;

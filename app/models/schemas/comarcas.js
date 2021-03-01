const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const { Helper } = require('../../lib/util');

const DataBuscaSchema = new Schema(
  {
    dia: { type: Number, required: true },
    mes: { type: Number, required: true },
  },
  { _id: false, versionKey: false }
);

const ComarcaSchema = new Schema(
  {
    Hash: { type: String, required: true, unique: true },
    Estado: { type: String, required: true },
    Comarca: { type: String, required: true },
    Nome: String,
    Tribunal: { type: Number, required: true },
    Orgao: { type: Number, required: true },
    Status: { type: String, default: 'Criada' },
    DataBusca: DataBuscaSchema,
    UltimoProcesso: String,
    TempoDecorrido: String,
    ProcessosFeitos: Number,
    Metadados: Object,
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'DataCriacao', updatedAt: 'DataAtualizacao' },
    autoIndex: true,
  }
);

ComarcaSchema.methods.salvar = async function salvar() {
  let preHash = `${this.Estado}${this.Comarca}`;
  let hash = Helper.hash(preHash);
  let objeto = this.toObject();
  delete objeto._id;
  this.Hash = hash;
  return Comarca.updateOne(
    { Hash: this.Hash },
    { $set: objeto },
    { upsert: true }
  );
};

ComarcaSchema.statics.retornaComarcas = async function retornaComarcas(estado) {
  return await Comarca.find({ Estado: estado, Status: { $nin: ['Inválida'] } });
};

/**
 * 0 - Invalido
 * 1 - Aguardando
 * 2 - Processando
 * 3 - Finalizada
 * @param statusNumber
 * @returns {Promise<*>}
 */
ComarcaSchema.methods.setStatus = async function setStatus(statusNumber) {
  let status;
  switch (statusNumber) {
    case 0:
      status = 'Inválida';
      break;
    case 1:
      status = 'Aguardando';
      break;
    case 2:
      status = 'Processando';
      break;
    case 3:
      status = 'Finalizada';
      break;
  }

  return await Comarca.updateOne(
    { Hash: this.Hash },
    { $set: { Status: status } }
  );
};

ComarcaSchema.index({ Estado: 1, type: -1 });

const Comarca = mongoose.model('Comarca', ComarcaSchema, 'comarcas');

module.exports.Comarca = Comarca;

const mongoose = require('mongoose');
const { Helper } = require('../../lib/util');
const Schema = mongoose.Schema;

const credenciaisAdvogadosSchema = new Schema(
  {
    login: { type: String, required: true },
    senha: { type: String, required: true },
    estado: { type: String, required: true },
    _hash: { type: String, required: true, unique: true },
    nome: String,
  },
  { versionKey: false }
);

credenciaisAdvogadosSchema.statics.getCredenciais = async function getCredenciais(
  estado,
  idsUsados = []
) {
  const query = {
    estado: estado,
    _id: { $nin: idsUsados },
  };
  return CredenciaisAdvogados.findOne(query);
};

credenciaisAdvogadosSchema.statics.criarHash = async function criarHash(obj) {
  let preHash = `${obj.login}${obj.senha}${obj.estado}`;
  return Helper.hash(preHash);
};

credenciaisAdvogadosSchema.methods.salvar = async function salvar() {
  this._hash = await CredenciaisAdvogados.criarHash(this);
  let credenciais = this.toObject();
  delete credenciais['_id'];

  return await CredenciaisAdvogados.updateOne(
    { _hash: this._hash },
    credenciais,
    { upsert: true }
  );
};

const CredenciaisAdvogados = mongoose.model(
  'CredenciaisAdvogados',
  credenciaisAdvogadosSchema,
  'credenciaisAdvogados'
);

module.exports.CredenciaisAdvogados = CredenciaisAdvogados;

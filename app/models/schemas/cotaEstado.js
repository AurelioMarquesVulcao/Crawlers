const mongoose = require('mongoose');
const moment = require('moment');
const { Helper } = require('../../lib/util');

moment.locale('pt-br');

const Schema = mongoose.Schema;

/**
 * @typedef CotaEstado
 * @property {String} _id
 * @property {String} _hash
 * @property {String} Nome
 * @property {String} UF
 * @property {Number} ValorCota
 * @property {[String]} Gastos
 */

const CotaEstadoSchema = new Schema({
  Nome: { type: String, required: true },
  UF: { type: String, required: true },
  _hash: { type: String, required: true, unique: true },
  ValorCota: { type: Number, required: true, default: 1 },
  Gastos: [{ type: String }],
});

/**
 * Faz o cadastro da cota por estado
 * @return {Promise<*>}
 */
CotaEstadoSchema.methods.salvar = async function salvar() {
  if (!this.Nome) throw new Error('Requerer adicionar nome do estado');
  if (!this.UF) throw new Error('Requer adicionar a UF do estado');

  let texto = `${this.Nome}${this.UF}`;

  this._hash = Helper.hash(texto);

  let objeto = this.toObject();
  delete objeto._id;

  return await CotaEstado.updateOne(
    { _hash: this._hash },
    { $set: objeto },
    { upsert: true }
  );
};

const CotaEstado = new mongoose.model(
  'CotaEstado',
  CotaEstadoSchema,
  'cotasEstados'
);

module.exports = {
  CotaEstado,
};

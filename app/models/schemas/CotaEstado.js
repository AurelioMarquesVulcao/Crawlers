const mongoose = require('mongoose');
const moment = require('moment');

moment.locale('pt-br');

const Schema = mongoose.Schema;

/**
 * @typedef CotaEstado
 * @property {String} _id
 * @property {String} Nome
 * @property {String} UF
 * @property {Number} ValorCota
 * @property {[String]} Gastos
 */

/**
 * @typedef CotaMensal
 * @property {String} _id
 * @property {String} UF
 * @property {Number} Ano
 * @property {Number} Mes
 * @property {Number} GastoOab
 * @property {Number} GastoProcesso
 * @property {Number} GastoPeticao
 */

const CotaEstadoSchema = new Schema({
  Nome: { type: String, required: true },
  UF: { type: String, required: true },
  ValorCota: { type: Number, required: true, default: 1 },
  Gastos: [{ type: Schema.Types.ObjectId }],
});

const CotaMensalSchema = new Schema({
  UF: { type: String, required: true },
  Ano: { type: Number, required: true },
  Mes: { type: String, required: true },
  GastoOab: { type: Number, required: true, default: 0 },
  GastoProcesso: { type: Number, required: true, default: 0 },
  GastoPeticao: { type: Number, required: true, default: 0 },
});

/**
 * Cadastra um novo consumo para a atual cota mensal
 * @param origemDoGasto
 * @param gasto
 * @return {Promise<*>}
 */
CotaMensalSchema.methods.cadastrarConsumo = async (origemDoGasto, gasto) => {
  if (typeof gasto !== 'number') throw new Error('Gasto deve ser um numero');
  if (gasto < 0) throw new Error('Gasto negativo');
  if (!origemDoGasto) throw new Error('Origem do gasto vazio');

  let origensPossiveis = {
    Oab: 'GastoOab',
    Processo: 'GastoProcesso',
    Peticao: 'GastoPeticao',
  };
  let origem = origensPossiveis[origemDoGasto];

  if (!origem) throw new Error('Origem fora do esperado');

  let cotaMensalQuery = CotaMensal.findOne({ _id: this._id });
  if (!cotaMensalQuery) await this.salvar();

  return await CotaMensal.updateOne(
    { _id: this._id },
    { $inc: { [origem]: gasto } }
  );
};

/**
 * Salva CotaMensal e atribui a CotaEstado se já não foi feito antes
 * @return {Promise<void>}
 */
CotaMensal.method.salvar = async () => {
  /**@type {CotaEstado|null}*/
  let cotaEstadoQuery = await CotaEstado.findOne({ UF: this.UF });

  if (!Object.keys(cotaEstadoQuery).length)
    throw new Error('Estado inexistente');

  let agora = moment();
  this.Ano = Number(agora.format('YYYY'));
  this.Mes = Number(agora.format('MM'));

  await this.save();

  if (cotaEstadoQuery.Gastos.indexOf(this._id) !== -1)
    await CotaEstado.updateOne(
      { _id: cotaEstadoQuery._id },
      { $push: { Gastos: this._id } }
    );
};

const CotaEstado = new mongoose.model(
  'CotaEstado',
  CotaEstadoSchema,
  'cotasEstados'
);

const CotaMensal = new mongoose.model(
  'CotaMensal',
  CotaMensalSchema,
  'cotasMensais'
);

module.exports = {
  CotaEstado,
  CotaMensal,
};

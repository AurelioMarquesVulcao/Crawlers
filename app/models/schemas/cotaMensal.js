const mongoose = require('mongoose');
const moment = require('moment');
const { CotaEstado } = require('./cotaEstado');
const { Helper } = require('../../lib/util');

moment.locale('pt-br');

const Schema = mongoose.Schema;

/**
 * @typedef CotaMensal
 * @property {String} _id
 * @property {String} _hash
 * @property {String} UF
 * @property {string} CotaEstado
 * @property {Number} Ano
 * @property {Number} Mes
 * @property {Number} GastoOab
 * @property {Number} GastoProcesso
 * @property {Number} GastoPeticao
 * @method calculaCota
 * @method calculaGastos
 */

const CotaMensalSchema = new Schema({
  UF: { type: String, required: true },
  _hash: { type: String, required: true, unique: true },
  CotaEstado: { type: String, required: true },
  Ano: { type: Number, required: true },
  Mes: { type: Number, required: true },
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
CotaMensalSchema.methods.cadastrarConsumo = async function cadastrarConsumo(
  origemDoGasto,
  gasto
) {
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

  /**@type {CotaMensal} */
  let cotaMensalQuery = await CotaMensal.findOne({
    UF: this.UF,
    Ano: this.Ano,
    Mes: this.Mes,
  });

  if (!cotaMensalQuery) await this.salvar();

  return await CotaMensal.updateOne(
    { _hash: cotaMensalQuery._hash },
    { $inc: { [origem]: gasto } }
  );
};

/**
 * Salva CotaMensal e atribui a CotaEstado se já não foi feito antes
 * @return {Promise<void>}
 */
CotaMensalSchema.methods.salvar = async function salvar() {
  if (!this.UF) throw new Error('Requer adicionar UF do estado');

  /**@type {CotaEstado|null}*/
  let cotaEstadoQuery = await CotaEstado.findOne({ UF: this.UF });

  if (!cotaEstadoQuery) throw new Error('Estado inexistente');

  this.CotaEstado = cotaEstadoQuery._hash;

  let texto = `${this.UF}${this.Ano}${this.Mes}`;

  this._hash = Helper.hash(texto);
  this.Ano = Number(moment().format('YYYY'));
  this.Mes = Number(moment().format('MM'));

  let objeto = this.toObject();
  delete objeto._id;

  await CotaMensal.updateOne(
    { _hash: this._hash },
    { $set: objeto },
    { upsert: true }
  );

  if (cotaEstadoQuery.Gastos.indexOf(this._hash) === -1)
    await CotaEstado.updateOne(
      { _hash: cotaEstadoQuery._hash },
      { $push: { Gastos: this._hash } }
    );
};

CotaMensalSchema.methods.calculaGasto = function calculaGasto() {
  return this.GastoOab + this.GastoPeticao + this.GastoProcesso;
};

/**
 * Faz uma consulta no banco e compara a cota atual do mes com a cota do estado
 * @return {Promise<boolean>}
 */
CotaMensalSchema.methods.liberarUsoCota = async function liberarUsoCota() {
  /**@type {CotaMensal} */
  const cotaMensal = await CotaMensal.findOne({
    UF: this.UF,
    Ano: this.Ano,
    Mes: this.Mes,
  });
  /**@type {CotaEstado} */
  const cotaEstado = await CotaEstado.findOne({ _hash: cotaMensal.CotaEstado });
  let gastoMensalTotal = cotaMensal.calculaGasto();

  return cotaEstado.ValorCota > gastoMensalTotal;
};

/**
 * Consulta o banco a procura de uma cota mensal com os parametros informados,
 * caso não consiga encontrar, cria um novo e devolve o valor criado
 * @param {String} UF uf do tribunal em formato /\w{2}/ captalizado
 * @param {Number|null} Mes mes do tribunal
 * @param {Number|null} Ano
 * @return {Promise<CotaMensal>}
 */
CotaMensalSchema.statics.getCotaMensal = async function (
  UF,
  Mes = null,
  Ano = null
) {
  if (!UF) throw new Error('UF não foi passada');
  if (typeof UF !== 'string') throw new Error('Parametro UF de tipo invalido');

  let agora = moment();
  Ano = Ano || Number(agora.format('YYYY'));
  Mes = Mes || Number(agora.format('MM'));

  let cota = await CotaMensal.findOne({ UF, Ano, Mes });
  if (!cota) {
    await new CotaMensal({ UF, Ano, Mes }).salvar();
    console.log(await CotaMensal.findOne({ UF, Ano, Mes }));
    return await CotaMensal.findOne({ UF, Ano, Mes });
  }

  return cota;
};

const CotaMensal = new mongoose.model(
  'CotaMensal',
  CotaMensalSchema,
  'cotasMensais'
);

module.exports = {
  CotaMensal,
};

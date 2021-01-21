const mongoose = require('mongoose');


const logSchema = new mongoose.Schema({
  aplicacao: String,
  codigo: String,
  origem: String,
  dataCriacao:Date,
  log: [],
})
const MonitoriaLogs = mongoose.model('LogMonitorias', logSchema, 'logMonitorias');

module.exports.MonitoriaLogs = MonitoriaLogs;

const tribunais = new mongoose.Schema({
  data: Date,
  uf: Array,
  ufCode:Number,
  site: String,
  justica: String,
  url: String,
  status: Boolean,
  falha: String

})
const StatusTribunais = mongoose.model('StatusTribunais', tribunais, 'statusTribunais');

module.exports.StatusTribunais = StatusTribunais;
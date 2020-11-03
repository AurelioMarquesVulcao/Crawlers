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
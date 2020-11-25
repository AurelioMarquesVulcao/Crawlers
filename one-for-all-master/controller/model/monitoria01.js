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



const processos7 = new mongoose.Schema({
  key: String,
  dados: []
  })
const Processos7dias = mongoose.model('Procesos7dias', processos7, 'procesos7dias');

module.exports.Processos7dias = Processos7dias;
const mongoose = require('mongoose');

const ExecucaoSchema = new mongoose.Schema({
    ConsultaCadastradaId: {
    type: mongoose.Types.ObjectId,
  },
  DataEnfileiramento: { type: Date, default: new Date() },
  DataInicio: { type: Date, required: false },
  DataTermino: { type: Date, required: false },
  Tentativas: { type: Number, required: false },
  Log: { type: Array, default: new Array() },
  Mensagem: { type: Array, default: new Array() },
  Instancia: { type: Number },
  NomeRobo: { type: String, required: true },
});

const ExecucaoConsulta = mongoose.model(
  'ExecucaoConsulta',
  ExecucaoSchema,
  'execucoesConsultas'
);

module.exports = { ExecucaoConsulta };

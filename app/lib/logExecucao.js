require('../bootstrap');
const mongoose = require("mongoose");
const ExecucaoConsulta = require("../models/schemas/execucao_consulta")
  .ExecucaoConsulta;

const { Helper } = require('./util');

module.exports.LogExecucao = class LogExecucao {

  static async salvar(execucao) {
    const log = { 
      status: execucao.status,
      error: execucao.error,
      logs: execucao.logs
    };

    delete execucao['status'];
    delete execucao['error'];
    delete execucao['logs'];
    await ExecucaoConsulta.updateOne(
      {_id: execucao.Mensagem.ExecucaoConsultaId},
      {
        ...execucao,
        Log: log,
        DataEnfileiramento: execucao.Mensagem.DataEnfileiramento
      },
      // upsert true, caso precise de um jeito de criar a consulta na hora
      { upsert: true } 
    );
  }
  
}
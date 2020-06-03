require('../bootstrap');
const mongoose = require("mongoose");
const ExecucaoConsulta = require("../models/schemas/execucao_consulta")
  .ExecucaoConsulta;

const { Helper } = require('./util');

module.exports.LogExecucao = class LogExecucao {

  static async salvar(execucao) {
    const log = { 
      status: execucao.status,
      error: execucao.error
    };
    // await ExecucaoConsulta
    //   .updateOne({_id: execucao.ExecucaoConsultaId}, {
    //     $addToSet: {
    //       Log: log
    //     }
    // });

    delete execucao['status'];
    delete execucao['error'];
    console.log('Execucao', execucao);
    await ExecucaoConsulta.updateOne(
      {_id: execucao.LogConsultaId},
      {
        ...execucao,
        Log: log,
        DataEnfileiramento: execucao.Mensagem.DataHoraEnfileiramento
      },
      { upsert: true }
    );
  }
  
}
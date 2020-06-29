require('../bootstrap');
const mongoose = require("mongoose");
const ExecucaoConsulta = require("../models/schemas/execucao_consulta")
  .ExecucaoConsulta;
const GerenciadorFila = require("../lib/filaHandler").GerenciadorFila;
const { enums } = require('../configs/enums');
const { Helper } = require('./util');

let mapaEstadoRobo = {
  BA: enums.nomesRobos.TJBAPortal,
  SP: enums.nomesRobos.TJSP
};
const gf = new GerenciadorFila();
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

  static async cadastrarConsultaPendente(consultaPendente) {
    const nomeRobo = mapaEstadoRobo[consultaPendente.SeccionalOab];

    if (nomeRobo) {
      const nomeFila = `${consultaPendente.TipoConsulta}.${nomeRobo}.extracao.novos`;
      const execucao = {
        ConsultaCadastradaId: consultaPendente._id,
        NomeRobo: nomeRobo,
        Log: [
          {
            status: `Execução do robô ${nomeRobo} para consulta ${consultaPendente._id} foi cadastrada com sucesso!`
          }
        ]
      };
      const execucaoConsulta = new ExecucaoConsulta(execucao);
      const ex = await execucaoConsulta.save();
      const mensagem = {
        ExecucaoConsultaId: ex._id,
        ConsultaCadastradaId: consultaPendente._id,
        DataEnfileiramento: new Date(),
        NumeroProcesso: consultaPendente.NumeroProcesso,
        NumeroOab: consultaPendente.NumeroOab,
        SeccionalOab: consultaPendente.SeccionalOab
      };
      gf.enviar(nomeFila, mensagem);
    }
  }
  
}
require('../bootstrap');
const ExecucaoConsulta = require("../models/schemas/execucao_consulta")
  .ExecucaoConsulta;
const GerenciadorFila = require("../lib/filaHandler").GerenciadorFila;
const { enums } = require('../configs/enums');

let mapaEstadoRobo = {
  BA: enums.nomesRobos.TJBAPortal,
  SP: enums.nomesRobos.TJSP,
  SC: enums.nomesRobos.TJSC,
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
    let resposta;
    const nomeRobo = mapaEstadoRobo[consultaPendente.SeccionalOab];

    let mensagem = {
      DataEnfileiramento: new Date(),
      NumeroProcesso: consultaPendente.NumeroProcesso,
      NumeroOab: consultaPendente.NumeroOab,
      SeccionalOab: consultaPendente.SeccionalOab,
      Instancia: consultaPendente.Instancia
    };
    // verifica se tem processos cadastrados com aquele cnj e não processados (DataTermino nula)
    const consultasCadastradas = await ExecucaoConsulta.countDocuments({"Mensagem.NumeroProcesso": mensagem.NumeroProcesso, "Mensagem.Instancia": mensagem.Instancia, DataTermino: null});

    if (nomeRobo && !consultasCadastradas) {
      const nomeFila = `${consultaPendente.TipoConsulta}.${nomeRobo}.extracao.novos`;
      
      const execucao = {
        ConsultaCadastradaId: consultaPendente._id,
        NomeRobo: nomeRobo,
        Log: [
          {
            status: `Execução do robô ${nomeRobo} para consulta ${consultaPendente._id} foi cadastrada com sucesso!`
          }
        ],
        Mensagem: [mensagem]
      };
      const execucaoConsulta = new ExecucaoConsulta(execucao);
      const ex = await execucaoConsulta.save();
      mensagem.ExecucaoConsultaId = ex._id
      mensagem.ConsultaCadastradaId = consultaPendente._id;
      gf.enviar(nomeFila, mensagem);

      return { sucesso: true, enviado: true, mensagem: `Processo ${mensagem.NumeroProcesso} enviado para a fila.` };
    }

    if (!nomeRobo) {
      return { sucesso: false, mensagem: 'Nome do robo inválido.' };
    }

    if (consultasCadastradas) {
      return { sucesso: true, enviado: false, mensagem: `Processo ${mensagem.NumeroProcesso} já consta na fila.` };
    }
  }
  
}

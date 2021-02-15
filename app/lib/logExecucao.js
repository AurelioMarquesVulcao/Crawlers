require('../bootstrap');
const mongoose = require('mongoose');
const ExecucaoConsulta = require('../models/schemas/execucao_consulta')
  .ExecucaoConsulta;
const GerenciadorFila = require('../lib/filaHandler').GerenciadorFila;
const { enums } = require('../configs/enums');

let mapaEstadoRobo = {
  MS: enums.nomesRobos.TJMS,
  BA: enums.nomesRobos.TJBAPortal,
  SP: enums.nomesRobos.TJSP,
  SC: enums.nomesRobos.TJSC,
  RS: enums.nomesRobos.TJRS,
  CE: enums.nomesRobos.TJCE,
};
const gf = new GerenciadorFila();
module.exports.LogExecucao = class LogExecucao {
  /**
   * @param {Object} execucao
   * @param {String} execucao.LogConsultaId
   * @param {Object} execucao.Mensagem
   * @param {Date} execucao.DataInicio
   * @param {Date} execucao.DataTermino
   * @param {String} execucao.Status
   * @param {String|null} execucao.Error
   * @param {[String]} execucao.Logs
   * @param {String} execucao.NomeRobo
   * @return {Promise<void>}
   */
  static async salvar(execucao) {
    const log = {
      status: execucao.Status,
      error: execucao.Error,
      logs: execucao.Logs,
    };

    delete execucao['status'];
    delete execucao['error'];
    delete execucao['logs'];
    
    let id = execucao.Mensagem.ExecucaoConsultaId
    let find = await ExecucaoConsulta.findOne({ _id: id });
    if (!find.Tentativas){
      execucao["Tentativas"]=0;
    }
    if(find.Tentativas >=0){
      execucao["Tentativas"]=find.Tentativas+1
    }
    await ExecucaoConsulta.updateOne(
      { _id: id },
      {
        ...execucao,
        Log: log,
        DataEnfileiramento: execucao.Mensagem.DataEnfileiramento,
      },
      // upsert true, caso precise de um jeito de criar a consulta na hora
      { upsert: true }
    );
  }

  /**
   *
   * @param consultaPendente
   * @param nomeFila
   * @returns {Promise<{mensagem: string, sucesso: boolean}|{mensagem: string, enviado: boolean, sucesso: boolean}>}
   */
  static async cadastrarConsultaPendente(consultaPendente, nomeFila) {
    const nomeRobo = mapaEstadoRobo[consultaPendente.SeccionalOab];
    let mensagem = {
      DataEnfileiramento: new Date(),
      NumeroProcesso: consultaPendente.NumeroProcesso,
      NumeroOab: consultaPendente.NumeroOab,
      SeccionalOab: consultaPendente.SeccionalOab,
      Instancia: consultaPendente.Instancia,
    };
    // verifica se tem processos cadastrados com aquele cnj e não processados (DataTermino nula)
    const consultasCadastradas = await ExecucaoConsulta.find({
      'Mensagem.NumeroProcesso': mensagem.NumeroProcesso,
      'Mensagem.Instancia': mensagem.Instancia,
      DataTermino: null,
    })
      .sort({
        'Mensagem.NumeroProcesso': 1,
      })
      .countDocuments();
    if (nomeRobo && !consultasCadastradas) {
      nomeFila = nomeFila
        ? nomeFila
        : `${consultaPendente.TipoConsulta}.${nomeRobo}.extracao.novos`;

      const execucao = {
        NomeRobo: nomeRobo,
        Log: [
          {
            status: `Execução do robô ${nomeRobo} para consulta ${consultaPendente._id} foi cadastrada com sucesso!`,
          },
        ],
        Instancia: mensagem.Instancia,
        Mensagem: [mensagem],
      };

      if (consultaPendente._id) {
        execucao.ConsultaCadastradaId = mongoose.Types.ObjectId(
          consultaPendente._id
        );
        mensagem.ConsultaCadastradaId = consultaPendente._id;
      }

      const execucaoConsulta = new ExecucaoConsulta(execucao);
      const ex = await execucaoConsulta.save();
      mensagem.ExecucaoConsultaId = ex._id;

      gf.enviar(nomeFila, mensagem);

      return {
        sucesso: true,
        enviado: true,
        mensagem: `Processo ${mensagem.NumeroProcesso} enviado para a fila.`,
      };
    }
    if (!nomeRobo) {
      return {
        sucesso: false,
        enviado: false,
        mensagem: 'Nome do robo inválido.',
      };
    }

    return {
      sucesso: true,
      enviado: false,
      mensagem: `Mensagem já cadastrada e não consumida`,
    };
  }
};

require('../bootstrap');
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
  static async salvar(execucao) {
    const log = {
      status: execucao.Status,
      error: execucao.Error,
      logs: execucao.Logs,
    };

    delete execucao['status'];
    delete execucao['error'];
    delete execucao['logs'];
    await ExecucaoConsulta.updateOne(
      { _id: execucao.Mensagem.ExecucaoConsultaId },
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
    console.log(consultaPendente.SeccionalOab, nomeRobo);
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
        ConsultaCadastradaId: consultaPendente._id,
        NomeRobo: nomeRobo,
        Log: [
          {
            status: `Execução do robô ${nomeRobo} para consulta ${consultaPendente._id} foi cadastrada com sucesso!`,
          },
        ],
        Instancia: mensagem.Instancia,
        Mensagem: [mensagem],
      };
      const execucaoConsulta = new ExecucaoConsulta(execucao);
      const ex = await execucaoConsulta.save();
      mensagem.ExecucaoConsultaId = ex._id;
      mensagem.ConsultaCadastradaId = consultaPendente._id;
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

require("../bootstrap");
const mongoose = require("mongoose");
const ConsultasCadastradas = require("../models/schemas/consultas_cadastradas")
  .ConsultasCadastradas;
const ExecucaoConsulta = require("../models/schemas/execucao_consulta")
  .ExecucaoConsulta;
const GerenciadorFila = require("../lib/filaHandler").GerenciadorFila;
const moment = require("moment");
const enums = require("../configs/enums").enums;

let mapaEstadoRobo = {
  BA: enums.nomesRobos.TJBAPortal,
  SP: enums.nomesRobos.TJSP
};

let gf = new GerenciadorFila();

const exit = (signal = 0) => {
  process.exit(signal);
}

const pretty = (obj, replacer = null) => {
  return JSON.stringify(obj, replacer, 2);
}

const pre = (param) => {
  console.log(param);
}

const pred = (param) => {
  pre(param);
  exit();
}

class Enfileirador {

  /**
   * Callback do método executar. Recebe uma consulta de execução pendente e a envia para
   * as filas de seus respectivos robos.
   *
   * @param {Array} docs Consultas pendentes de execução.
   */
  static async cadastrarConsultaPendente(consultaPendente) {
    const nomeRobo = mapaEstadoRobo[consultaPendente.SeccionalOab];

    if (nomeRobo) {
      const nomeFila = `${consultaPendente.TipoConsulta}.${nomeRobo}.extracao.novos`;
      const execucao = {
        ConsultaCadastradaId: consultaPendente._id,
        NomeRobo: nomeRobo,
        Log: [{status: `Execução do robô ${nomeRobo} para consulta ${consultaPendente._id} foi cadastrada com sucesso!`}]
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
  };

  /**
   * Realiza a query das consultas pendentes de execução.
   */
  static async executar() {
    try {
      const dataCorte = new moment().subtract(7, "days");
      const busca = {
        $or: [
          { DataUltimaConsultaTribunal: { $lte: dataCorte } },
          { DataUltimaConsultaTribunal: null }
        ]
      };
      
      const lista = await ConsultasCadastradas.find(busca);

      for(let i =0, si = lista.length; i < si; i++) {
        await Enfileirador.cadastrarConsultaPendente(lista[i]);
      }

      mongoose.connection.close();
    } catch (e) {
      console.log(e);
    }
  };
}

(async () => {
  await Enfileirador.executar();
})();

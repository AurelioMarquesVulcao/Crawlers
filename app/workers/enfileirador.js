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

class Enfileirador {
  /**
   * Callback do método executar. Recebe uma consulta de execução pendente e a envia para
   * as filas de seus respectivos robos.
   *
   * @param {Array} docs Consultas pendentes de execução.
   */
  static cadastrarPendente = (doc) => {
    return new Promise((resolve, reject) => {
      let consulta = new ConsultasCadastradas(doc);

      let nomeRobo = mapaEstadoRobo[consulta.SeccionalOab];
      let nomeFila = `${consulta.TipoConsulta}.${nomeRobo}.extracao.novos`;

      let execucao = new ExecucaoConsulta({
        ConsultaCadastradaId: consulta.id,
        NomeRobo: nomeRobo
      });

      execucao.save((err, docExecucao) => {
        let mensagem = {
          ExecucaoConsultaId: docExecucao.id,
          ConsultaCadastradaId: consulta.id,
          DataEnfileiramento: new Date(),
          NumeroProcesso: consulta.NumeroProcesso,
          NumeroOab: consulta.NumeroOab,
          SeccionalOab: consulta.SeccionalOab
        };
        gf.enviar(nomeFila, mensagem);
        return resolve(mensagem);
      });
    });
  };

  /**
   * Realiza a query das consultas pendentes de execução.
   */
  static executar = () => {
    let dataCorte = new moment().subtract(7, "days");
    let busca = {
      $or: [
        { DataUltimaConsultaTribunal: { $lte: dataCorte } },
        { DataUltimaConsultaTribunal: null }
      ]
    };

    ConsultasCadastradas.find(busca, (err, docs) => {
      if (err) throw err;
      let promises = [];
      docs.forEach((doc) => {
        promises.push(Enfileirador.cadastrarPendente(doc));
      });

      Promise.all(promises).then((_) => {
        mongoose.connection.close();
      });
    });
  };
}

Enfileirador.executar();

require('../bootstrap');
const mongoose = require('mongoose');
const ConsultasCadastradas = require('../models/schemas/consultas_cadastradas')
  .ConsultasCadastradas;
const ExecucaoConsulta = require('../models/schemas/execucao_consulta')
  .ExecucaoConsulta;
const GerenciadorFila = require('../lib/filaHandler').GerenciadorFila;
const moment = require('moment');
const enums = require('../configs/enums').enums;
const cron = require('node-cron');
const sleep = require('await-sleep');

let mapaEstadoRobo = {
  BA: enums.nomesRobos.TJBAPortal,
  SP: enums.nomesRobos.TJSP,
  SC: enums.nomesRobos.TJSC
};

let gf = new GerenciadorFila();

const exit = (signal = 0) => {
  process.exit(signal);
};

const pretty = (obj, replacer = null) => {
  return JSON.stringify(obj, replacer, 2);
};

const pre = (param) => {
  console.log(param);
};

const pred = (param) => {
  pre(param);
  exit();
};

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
        Instancia: consultaPendente.Instancia,
        Log: [
          {
            status: `Execução do robô ${nomeRobo} para consulta ${consultaPendente._id} foi cadastrada com sucesso!`,
          },
        ],
      };
      const execucaoConsulta = new ExecucaoConsulta(execucao);
      const ex = await execucaoConsulta.save();
      const mensagem = {
        ExecucaoConsultaId: ex._id,
        ConsultaCadastradaId: consultaPendente._id,
        DataEnfileiramento: new Date(),
        Instancia: consultaPendente.Instancia,
        NumeroProcesso: consultaPendente.NumeroProcesso,
        NumeroOab: consultaPendente.NumeroOab,
        SeccionalOab: consultaPendente.SeccionalOab,
      };
      // gf.enviar(nomeFila, mensagem);
      return { nomeFila, mensagem }
    }
  }

  /**
   * Realiza a query das consultas pendentes de execução.
   */
  static async executar() {
    let listaFilas = [];
    let mensagens;
    let lote;
    try {
      let cadastros = [];
      const dataCorte = new moment().subtract(7, 'days');
      const busca = {
        $or: [
          { DataUltimaConsultaTribunal: { $lte: dataCorte } },
          { DataUltimaConsultaTribunal: null },
        ],
      };

      const lista = await ConsultasCadastradas.find(busca);
      console.log(lista.length);
      console.log(lista.length);
      for (let i = 0, si = lista.length; i < si; i++) {
        cadastros.push(await Enfileirador.cadastrarConsultaPendente(lista[i]));
      }
      // separa as filas a serem executadas
      for (let ii = 0; ii < cadastros.length; ii++) {
        if (cadastros[ii] !== undefined) {
          if (listaFilas.indexOf(`${cadastros[ii].nomeFila}`) < 0) {
            listaFilas.push(cadastros[ii].nomeFila)
          }
        }

      }
      for (let iii = 0; iii < listaFilas.length; iii++) {
        mensagens = [];
        lote = [];
        mensagens = cadastros.filter(res => {
          if (res !== undefined) {
            return res.nomeFila == listaFilas[iii]
          }
        })
        lote = mensagens.map((mens => { return mens.mensagem }))
        await gf.enfileirarLote(listaFilas[iii], lote)
        await sleep(15000)
      }
      console.log('consultas cadastradas');
      mongoose.connection.close();
      // Promise.all(cadastros).then(res => {
      //   console.log('consultas cadastradas');
      //   mongoose.connection.close();
      // });

    } catch (e) {
      console.log(e);
    }
  }
}

console.log('Realizando execução ao iniciar o container.');
Enfileirador.executar();

cron.schedule('0 * * * *', () => {
  console.log('Executando enfileirador.');
  Enfileirador.executar();
});

require('../bootstrap');
const moment = require('moment');
const { ExecucaoConsulta } = require('../models/schemas/execucao_consulta');
const {
  ConsultasCadastradas,
} = require('../models/schemas/consultas_cadastradas');
const { LogExecucao } = require('../lib/logExecucao');
const { GerenciadorFila } = require('../lib/filaHandler');
const sleep = require('await-sleep');

/**
 * Mensagem que é recebida pela fila cadastro_consulta
 * @typedef {Object} MensagemCadastroConsulta
 * @property {String} CadastroConsultaId id no BigData desse cadastramento de consulta
 * @property {String} NumeroOab formato /[0-9]+[A-Z]?[A-Z]{2}/
 * @property {String} SeccionalOab formato /[A-Z]{2}/
 * @property {String} NumeroProcesso formato /[0-9]{7}\.[0-9]{2}\.[0-9]{4}\.[0-9]\.[0-9]{2}\.[0-9]{4}/
 * @property {String} TipoConsulta pode ser 'oab', 'processo' ou 'peticao'
 * @property {String} DataHoraEnfileiramento data em formato UTC - YYYY-MM-DD[T]HH:mm:ss.SSS[Z]
 * @property {String} ClientId ObjectId do cliente a quem essa consulta é fornecida
 * @property {String|null} Instancia pode ser '1', '2', '3', se vazio é entendido como '1'
 */

/**
 * Mensagem que é enviada e recebida pelas respectivas filas de extração
 * @typedef {Object} MensagemExecucaoConsulta
 * @property {String} ExecucaoConsultaId id de execucao consulta daquela mensagem
 * @property {String} ConsultaCadastrada id da consulta cadastrada dentro do banco do crawlers
 * @property {String} DataHoraEnfileiramento data em formato UTC - YYYY-MM-DD[T]HH:mm:ss.SSS[Z]
 * @property {String|null} Instancia pode ser '1', '2', '3', se vazio é entendido como '1'
 * @property {String} NumeroProcesso formato /[0-9]{7}\.[0-9]{2}\.[0-9]{4}\.[0-9]\.[0-9]{2}\.[0-9]{4}/
 * @property {String} NumeroOab formato /[0-9]+[A-Z]?[A-Z]{2}/
 * @property {String} SeccionalOab formato /[A-Z]{2}/
 */

/**
 * Mensagem que é enviada pelo BigData para iniciar a execução do robo de peticao
 * @typedef {Object} MensagemPeticaoTJ
 * @property {string} NumeroProcesso Numero do processo com ou sem mascara
 * @property {number} Instancia a instancia do processo
 * @property {boolean} inicial .
 */

class FluxoController {
  /**
   * Recebe uma mensagem e faz o cadastro da consulta no banco
   * @param {MensagemCadastroConsulta} msg objeto de mensagem proveniente do rabbit
   * @return Promise<Object> retorna um objeto com o campo "sucesso" e "tribunal" sendo boolean
   */
  static async cadastrarConsulta(msg) {
    let tribunal;

    const query = {
      NumeroOab: msg.NumeroOab,
      NumeroProcesso: msg.NumeroProcesso,
      TipoConsulta: msg.TipoConsulta,
      SeccionalOab: msg.SeccionalOab,
      Instancia: msg.Instancia,
    };

    if (msg.NumeroProcesso) tribunal = identificarDetalhes(msg.NumeroProcesso);

    if (tribunal) {
      msg.Detalhes = tribunal;
    }

    const consulta = await ConsultasCadastradas.findOne(query);

    if (!consulta) {
      const consultaSalva = await new ConsultasCadastradas(msg).save();
      msg.CadastroConsultaId = consultaSalva._id;
      console.log(`Criado documento com _id ${msg.CadastroConsultaId}`);
    }

    return consulta;
  }

  /**
   * Verifica se a consulta é do tipo oab ou outra e
   * a manda para a fila caso esteja pendente
   */
  static async enfileirarPendentes() {
    let listaFilas = [];
    let mensagens;
    let lote;
    let cadastros = [];

    let gf = new GerenciadorFila();

    try {
      const dataCorte = new moment().subtract(7, 'days').format('');

      const query = {
        $or: [
          { DataUltimaConsultaTribunal: { $lte: dataCorte } },
          { DataUltimaConsultaTribunal: null },
        ],
      };
      console.log({ dataCorte });
      const lista = await ConsultasCadastradas.find(query);
      console.log({ lista });
      for (let i = 0, tam = lista.length; i < tam; i++) {
        cadastros.push(await LogExecucao.cadastrarConsultaPendente(lista[i]));
      }

      console.log({ cadastros });

      for (let j = 0, tam = cadastros.length; j < tam; j++) {
        if (cadastros[j] !== undefined) {
          if (listaFilas.indexOf(`${cadastros[j].nomeFila}`) < 0) {
            listaFilas.push(cadastros[j].nomeFila);
          }
        }
      }

      console.log({ listaFilas: listaFilas.length });
      for (let k = 0, tam = listaFilas.length; k < tam; k++) {
        mensagens = [];
        lote = [];
        mensagens = cadastros.filter((res) =>
          res !== undefined ? res.nomeFila === listaFilas[k] : false
        );
        lote = mensagens.map((msg) => msg.mensagem);
        await gf.enfileirarLote(listaFilas[k], lote);
        await sleep(15000);
      }

      console.log('consultas cadastradas');
    } catch (e) {
      console.log(e);
    }
  }

  /**
   *
   * @param {string} nomeRobo
   * @param {String} nomeFila
   * @param {MensagemPeticaoTJ} msg
   * @return {Promise<boolean>}
   */
  static async cadastrarExecucao(nomeRobo, nomeFila, msg) {
    try {
      let gf = new GerenciadorFila();
      let execucao = {
        NomeRobo: nomeRobo,
        Log: [
          {
            status: `Execução do robô ${nomeRobo} para consulta ${msg.NumeroProcesso} foi cadastrada com sucesso!`,
          },
        ],
        Instancia: msg.Instancia,
        Mensagem: [msg],
      };

      let pendentes = await ExecucaoConsulta.findOne({
        NomeRobo: nomeRobo,
        'Mensagem.Instancia': msg.Instancia,
        'Mensagem.NumeroProcesso': msg.NumeroProcesso,
        DataTermino: null,
      })
        // .limit(1)
        .countDocuments();

      if (pendentes !== 0) {
        console.log(
          `O processo ${nomeRobo} - ${msg.NumeroProcesso} já cadastrada`
        );
        return false;
      }
      await gf.enviar(nomeFila, msg);
      console.log(execucao);
      await new ExecucaoConsulta(execucao).save();

      return true;
    } catch (e) {
      console.log(e);
    }
  }

  /**
   *
   * @param {MensagemExecucaoConsulta} msg
   * @param {Date} dataInicio data de inicio da extração
   * @param {Date} dataTermino data de termino da extração
   * @param {string} status status da extração
   * @param {[String]} logs lista de string que contem os logs da execucao
   * @param {string} nomeRobo o robo que esta sendo executado
   * @param {Error|null} error Erro se houver
   * @return {Promise<*>}
   */
  static async finalizarConsultaPendente({
    msg,
    dataInicio,
    dataTermino,
    status,
    logs,
    nomeRobo,
    error,
  }) {
    let execucao = {
      Mensagem: msg,
      DataInicio: dataInicio,
      DataTermino: dataTermino,
      Status: status,
      Logs: logs,
      NomeRobo: nomeRobo,
    };

    if (error) execucao.Error = error.stack.replace(/\n+/, ' ').trim();

    return await LogExecucao.salvar(execucao);
  }
}

module.exports.FluxoController = FluxoController;

const identificarDetalhes = (cnj) => {
  let tribunal;

  try {
    const cnjMascara = cnj.replace(
      /([0-9]{7})([0-9]{2})([0-9]{4})([0-9])([0-9]{2})([0-9]{4})/,
      '$1-$2.$3.$4.$5.$6'
    );

    const numeroMatch = cnjMascara.match(/\.([0-9]\.[0-9]{2})\./);

    if (numeroMatch) {
      const numeroSplit = numeroMatch[1].split('.');
      tribunal = {
        Orgao: parseInt(numeroSplit[0]),
        Tribunal: parseInt(numeroSplit[1]),
      };
    }
  } catch (e) {
    console.log(e.message);
  }

  return tribunal;
};

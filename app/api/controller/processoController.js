const moment = require('moment');
const Tribunal = require('../../models/schemas/tribunal');
const GerenciadorFila = require('../../lib/filaHandler');

const context = {
  LogConsultaId: '5e5d7b8b09219b50a2edae31',
  NumeroDoProcesso: null,
  NumeroOab: 54768,
  Tribunal: 'TJBA',
  DataEnfileiramento: '2020-03-02T18:32:59.417685',
};

class ProcessoController {
  static async enfileirar(req, res) {
    try {
      // TODO descomentar
      // const context = req.body;

      const tribunal = await new Tribunal().find({ _id: context.tribunalId });

      if (!tribunal) throw new Error('Tribunal não encontrado');

      if (!context.NumeroOab) throw new Error('Campo NumeroOab vazio');

      let fila = `${tribunal.sigla}.extracao`;

      const data = moment().isDST() ? moment.utc() : moment();

      GerenciadorFila.enviar(fila, {});
    } catch (e) {
      console.log(e.stack);
      res.status(500).send('Um erro inesperado aconteceu');
    }
  }

  static async processoBigdata(req, res) {
    const context = req.params;
    let status, data;
    const dao = new ProcessoMongoDAO();

    try {

      if (!context || !context.cnj)
        throw new Error("Parametro id não enviado!");

      const response = await dao.encontrarPorCNJ(context.cnj);

      if (!response) 
        throw new Error("Processo não encontrado!");

      const processoBigdata = new Mapper(response).translate();

      status = 200;
      data = processoBigdata;
    } catch (e) {
      status = 500;    
    } finally {
      res.status(status).send(data);
      // Helper.pred('---processoController---');
    }
  }
}

module.exports.ProcessoController = ProcessoController;

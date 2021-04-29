const moment = require('moment');
const { mapLimit } = require('async');

const {
  ConsultasCadastradas,
} = require('../models/schemas/consultas_cadastradas');

module.exports = class EnfileiradorConsultas {
  constructor(diasCorte, limite, tipoConsulta = null) {
    this.diasCorte = diasCorte;
    this.limit = limite || 1000;
    this.tipoConsulta = tipoConsulta;
  }

  async executar() {
    try {
      let resultado = await mapLimit(
        this.iterarConsultas(),
        4,
        (consultas, mapCb) => {
          this.enfileirarConsultas(consultas)
            .then((res) => mapCb(null, res))
            .catch(mapCb);
        }
      );

      return resultado;
    } catch (e) {
      throw e;
    }
  }

  async *iterarConsultas() {
    let ultimoId = null;
    let dataCorte = moment().subtract(diasCorte, 'days');

    let query = {
      $or: [
        { DataUltimaConsultaTribunal: { $lte: dataCorte } },
        { DataUltimaConsultaTribunal: null },
      ],
    };

    let consultas = await ConsultasCadastradas.find(query)
      .limit(this.limite)
      .exec();

    yield consultas;

    while (consultas.length > 0) {
      ultimoId = consultas[consultas.length - 1]._id;

      query._id = { $gt: ultimoId };

      consultas = await ConsultasCadastradas.find(query)
        .limit(this.limite)
        .exec();
    }
  }

  /**
   *
   * @param {[ConsultasCadastradas]} consultas Lista com as consultas que devem ser enfileiradas.
   */
  async enfileirarConsultas(consultas) {}
};

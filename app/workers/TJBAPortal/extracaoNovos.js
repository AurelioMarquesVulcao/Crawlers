const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');
const { Extracao } = require('../../models/schemas/extracao');
const { Helper } = require('../../lib/util');

(async () => {
  try {
    mongoose.connect(enums.mongo.address, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on('error', (e) => {
      console.log(e);
    });

    const nomeFila = `${enums.tipoConsulta.Oab}${enums.nomesRobos.TJBAPortal}.extracao.novos`;

    new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);
      let message = JSON.parse(msg.content.toString());
      console.log(message);
      const resultadoExtracao = await extrator.extrair(message.NumeroDaOab);
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        'BA'
      );
      console.log(extracao.toJSON());
      Helper.enviarFeedback(extracao.prepararEnvio());
    });
  } catch (e) {
    console.log(e);
  }
})();

const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');

(async () => {
  try {
    mongoose.connect(enums.mongo.address, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on('error', e => {
      console.log(e);
    });

    const nomeFila = `${enums.tipoConsulta.Oab}${enums.nomesRobos.TJBAPortal}.extracao.novos`;

    new GerenciadorFila().consumir(nomeFila, (ch, msg) => {
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);
      let message = JSON.parse(msg.content.toString());
      extrator.extrair(message.NumeroDaOab);
    });
  } catch (e) {
    console.log(e);
  }
})();

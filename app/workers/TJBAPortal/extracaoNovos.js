const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { ExtratorFactory } = require('../../extratores/extratorFactory');

(async () => {
  try {
    console.log(enums.mongo.address); //TODO remover
    mongoose.connect(enums.mongo.address, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    mongoose.connection.on('error', e => {
      console.log(e);
    });

    const nomeFila = `${enums.tipoConsulta.Oab}${enums.nomesRobos.TJBAPortal}.extracao.novos`;

    new GerenciadorFila().consumir(nomeFila, (ch, msg) => {
      ExtratorFactory.getExtrator(nomeFila, true);
    });
  } catch (e) {
    console.log(e);
  }
})();

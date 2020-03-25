const mongoose = require('mongoose');
const { enums } = require('../../../configs/enums');
const { GerenciadorFila } = require('../../../lib/filaHandler');

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

    new GerenciadorFila().consumir(
      `${enums.tipoConsulta.Oab}${enums.nomesRobos.TJBAPortal}.extracao.novos`,
      (ch, msg) => {
        console.log(msg.content.toString());
      }
    );
  } catch (e) {
    console.log(e);
  }
})();

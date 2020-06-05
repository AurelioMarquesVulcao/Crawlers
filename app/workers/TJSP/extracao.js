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

    const nomeFila = `${enums.tipoConsulta.Oab}${enums.nomesRobos.TJSP}.extracao.novos`;

    new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);
      let message = JSON.parse(msg.content.toString());
      console.log(message);
      const resultadoExtracao = await extrator.extrair(message.NumeroOab);
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalOab
      );
      const resposta = await Helper.enviarFeedback(
        extracao.prepararEnvio()
      ).catch((err) => {
        console.log('Erro detectado', err);
      });
      // ch.ack(msg);
      console.log(resposta);
    });
  } catch (e) {
    console.log(e);
  }
})();

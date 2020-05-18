const { enums } = require('../configs/enums');
const { GerenciadorFila } = require('../lib/filaHandler');
const { ExtratorFactory } = require('../extratores/extratorFactory');
const { Extracao } = require('../models/schemas/extracao');
const { Helper } = require('../lib/util');

const tipoConsulta = 'Oab';
const nomeRobo = 'TJMG';

describe('Worker', () => {
  const nomeFila = `${tipoConsulta}${nomeRobo}.extracao.novos`;

  new GerenciadorFila('amqp://admin:adminadmin@0.0.0.0:5673').consumir(
    nomeFila,
    async (ch, msg) => {
      try {
        const extrator = ExtratorFactory.getExtrator(nomeFila, true);
        let message = JSON.parse(msg.content.toString());
        console.log(message);
        const resultadoExtracao = await extrator.extrair(message.numeroDaOab);
        // ch.ack(msg);
      } catch (e) {
        console.log('ERROR');
        console.log(e.message);
      }
    }
  );
});

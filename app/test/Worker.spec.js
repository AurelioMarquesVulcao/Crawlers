const { enums } = require('../configs/enums');
const { GerenciadorFila } = require('../lib/filaHandler');
const { ExtratorFactory } = require('../extratores/extratorFactory');
const { Extracao } = require('../models/schemas/extracao');
const { Helper } = require('../lib/util');

const tipoConsulta = 'oab';
const nomeRobo = 'TJMG';

describe('Worker', async () => {
  const nomeFila = `${tipoConsulta}.${nomeRobo}.extracao.novos`;
  const message = {numeroDaOab: '91357N'};
  const extrator = ExtratorFactory.getExtrator(nomeFila);
  const resultadoExtracao = await extrator.extrair(message.numeroDaOab);
  console.log(resultadoExtracao);
});

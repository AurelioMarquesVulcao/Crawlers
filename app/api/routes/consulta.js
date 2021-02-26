const router = require('express').Router();
const schemas = require('../schema');

const {
  ConsultasCadastradas,
} = require('../../models/schemas/consultas_cadastradas');
const {
  ConsultaNaoExistenteError,
  FluxoController,
} = require('../../lib/fluxoController');

/**
 * Retorna o numero do processo no padrão CNJ.
 * @param {String} numProcesso O número do processo que será normalizado.
 * @returns {String} Número no padrão CNJ.
 */
function normalizarNumProcesso(numProcesso, removerPontuacao = false) {
  if (numProcesso === null) return null;

  numProcesso = numProcesso.toString().replace(/\D/g, '').padStart(20, '0');

  if (removerPontuacao) return numProcesso;

  let sequencial = numProcesso.slice(0, 7);
  let digito = numProcesso.slice(7, 9);
  let ano = numProcesso.slice(9, 13);
  let orgao = numProcesso.slice(13, 14);
  let tribunal = numProcesso.slice(14, 16);
  let comarca = numProcesso.slice(16);

  return `${sequencial}-${digito}.${ano}.${orgao}.${tribunal}.${comarca}`;
}

/**
 * Realiza a tentativa de cadastro de uma consulta.
 *
 * @param {Object} consulta
 * @param {import('axios').AxiosResponse} res
 */
const _cadastrarConsulta = async (consulta, res) => {
  try {
    await FluxoController.cadastrarConsulta(consulta);
    res.status(200).json({ detalhes: 'Consulta cadastrada com sucesso' });
    return;
  } catch (e) {
    if (e.name === 'MongoError' && e.code === 11000) {
      res.status(200).json({ detalhes: 'Consulta previamente cadastrada' });
      return;
    }
  }

  res.status(500).json({ detalhes: 'Falha durante registro da consulta.' + e });
};

router.post('/oab', async (req, res) => {
  const consulta_oab = new schemas.cadastroOabSchema(req.body);
  consulta_oab.ClienteId = req.cliente._id;

  const errors = consulta_oab.validateSync();

  let consulta = new ConsultasCadastradas(consulta_oab);

  if (errors) {
    res.status(400).json(errors);
    return;
  }

  _cadastrarConsulta(consulta, res);
});

/**
 * Realiza o processo de cadastramento de uma consulta na aplicação.
 */
router.post('/processo', async (req, res) => {
  const consulta_processo = new schemas.cadastroNumeroCnjSchema(req.body);
  consulta_processo.NumeroProcesso = normalizarNumProcesso(
    consulta_processo.NumeroProcesso,
    true
  );
  consulta_processo.ClienteId = req.cliente._id;

  const errors = consulta_processo.validateSync();

  let consulta = new ConsultasCadastradas(consulta_processo);

  if (errors) {
    res.status(400).json(errors);
    return;
  }

  _cadastrarConsulta(consulta, res);
});

router.delete('', async (req, res) => {
  const consulta = new ConsultasCadastradas(req.body);
  consulta.NumeroProcesso = normalizarNumProcesso(
    consulta.NumeroProcesso,
    true
  );
  consulta.ClienteId = req.cliente._id;

  const errors = consulta.validateSync();

  if (errors) {
    res.status(400).json(errors);
    return;
  }

  try {
    await FluxoController.cancelarConsulta(consulta);
    res.status(200).json({ detalhes: 'Consulta cancelada com sucesso' });
    return;
  } catch (e) {
    if (e instanceof ConsultaNaoExistenteError) {
      res.status(404).json({ detalhes: 'Consulta não localizada' });
      return;
    }
    res.status(500).json({ detalhes: e });
    return;
  }
});

module.exports = router;

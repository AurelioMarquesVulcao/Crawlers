const router = require('express').Router();
const schemas = require('../schema');
const { Document } = require('mongoose');

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
    res
      .status(500)
      .json({ detalhes: `Falha durante registro da consulta: ${e}` });
  }
};

const _cancelarConsulta = async (consulta, res) => {
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
};

/**
 * Realiza o cadastro de uma oab na monitoria.
 */
router.post('/oab', async (req, res) => {
  let consulta_oab = new Document(req.body, schemas.cadastroOabSchema);

  const errors = consulta_oab.validateSync();

  if (errors) {
    res.status(400).json(errors);
    return;
  }

  consulta_oab = consulta_oab.toObject();
  consulta_oab.ClienteId = req.cliente._id;
  let consulta = new ConsultasCadastradas(consulta_oab);
  _cadastrarConsulta(consulta, res);
});

router.delete('/oab', async (req, res) => {
  let consulta_oab = new Document(req.body, schemas.cadastroOabSchema);
  const errors = consulta_oab.validateSync();

  if (errors) {
    res.status(400).json(errors);
  }

  consulta_oab = consulta_oab.toObject();
  consulta_oab.ClienteId = req.cliente._id;
  let consulta = new ConsultasCadastradas(consulta_oab);
  _cancelarConsulta(consulta, res);
});

/**
 * Realiza o cadastro de um processo na monitoria processual.
 */
router.post('/processo', async (req, res) => {
  let consultaProcesso = new Document(
    req.body,
    schemas.cadastroNumeroCnjSchema
  );
  consultaProcesso.NumeroProcesso = normalizarNumProcesso(
    consultaProcesso.NumeroProcesso,
    true
  );
  const errors = consultaProcesso.validateSync();

  if (errors) {
    res.status(400).json(errors);
    return;
  }

  consultaProcesso = consultaProcesso.toObject();
  consultaProcesso.ClienteId = req.cliente._id;
  let consulta = new ConsultasCadastradas(consultaProcesso);
  _cadastrarConsulta(consulta, res);
});

router.delete('/processo', async (req, res) => {
  let consultaProcesso = new Document(
    req.body,
    schemas.cadastroNumeroCnjSchema
  );
  consultaProcesso.NumeroProcesso = normalizarNumProcesso(
    consultaProcesso.NumeroProcesso,
    true
  );
  const errors = consultaProcesso.validateSync();

  if (errors) {
    res.status(400).json(errors);
    return;
  }

  consultaProcesso = consultaProcesso.toObject();
  consultaProcesso.ClienteId = req.cliente._id;
  let consulta = new ConsultasCadastradas(consultaProcesso);
  _cancelarConsulta(consulta, res);
});

module.exports = router;

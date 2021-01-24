const router = require('express').Router();

const {
  ConsultasCadastradas,
} = require('../../models/schemas/consultas_cadastradas');

/**
 * Retorna o numero do processo no padrão CNJ.
 * @param {String} numProcesso O número do processo que será normalizado.
 * @returns {Stirng} Número no padrão CNJ.
 */
function normalizarNumProcesso(numProcesso, removerPontuacao = false) {
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

const identificarDetalhes = (cnj) => {
  let tribunal;

  try {
    const cnjMascara = normalizarNumProcesso(cnj);

    const numeroMatch = cnjMascara.match(/\.([0-9]{1}\.[0-9]{2})\./);

    if (numeroMatch) {
      const numeroSplit = numeroMatch[1].split('.');
      tribunal = {
        Orgao: parseInt(numeroSplit[0]),
        Tribunal: parseInt(numeroSplit[1]),
      };
    }
  } catch (e) {
    throw Error('Não foi possível identificar órgão e tribunal do número CNJ.');
  }

  return tribunal;
};

router.post('', async (req, res) => {
  const consulta = new ConsultasCadastradas(req.body);
  consulta.NumeroProcesso = normalizarNumProcesso(
    consulta.NumeroProcesso,
    true
  );
  consulta.ClienteId = req.cliente._id;
  consulta.Detalhes = identificarDetalhes(consulta.NumeroProcesso);

  if (!consulta.Detalhes) {
  }

  const errors = consulta.validateSync();

  if (errors) {
    res.status(400).json(errors);
    return;
  }

  try {
    await consulta.save();
    res.status(200).json({ detalhes: 'Consulta cadastrada com sucesso' });
    return;
  } catch (e) {
    if (e.name === 'MongoError' && e.code === 11000) {
      res.status(200).json({ detalhes: 'Consulta previamente cadastrada' });
      return;
    }

    res
      .status(500)
      .json({ detalhes: 'Falha durante registro da consulta.' + e });
    return;
  }
});

module.exports = router;

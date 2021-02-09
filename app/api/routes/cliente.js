const router = require('express').Router();

router.get('', (req, res) => {
  const resumoCliente = {
    _id: req.cliente._id,
    Ativo: req.cliente.Ativo,
    Nome: req.cliente.Nome,
    DataCriacao: req.cliente.DataCriacao,
  };
  res.status(200).json(resumoCliente);

  return;
});

module.exports = router;

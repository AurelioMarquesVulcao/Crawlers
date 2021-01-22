const Cliente = require('../../models/schemas/cliente');

const requerClienteApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.statusCode = 401;
    res.json({ detalhes: 'Header X-API-KEY não informado.' });
    return;
  }

  let cliente = null;
  try {
    cliente = await Cliente.findOne({ ApiKey: apiKey });
  } catch (e) {
    res
      .statusCode(500)
      .json({ detalhes: 'Falha durante consulta do cliente.' });
    return;
  }

  if (!cliente || !cliente.Ativo) {
    res
      .statusCode(401)
      .json({ detalhes: 'Cliente não localizado ou inativado.' });
  }

  req.cliente = cliente;

  next();
  return;
};

module.exports = requerClienteApiKey;

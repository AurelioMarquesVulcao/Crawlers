const Cliente = require('../../models/schemas/cliente');

/**
 * Middleware para autenticação da chave de API do cliente fornecida na requisição.
 *
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
const requerClienteApiKey = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    res.status(401).json({ detalhes: 'Header X-API-KEY não informado.' });
    return;
  }

  let cliente = null;
  try {
    cliente = await Cliente.findOne({ ApiKey: apiKey });
  } catch (e) {
    res.status(500).json({ detalhes: 'Falha durante consulta do cliente.' });
    return;
  }

  if (!cliente || !cliente.Ativo) {
    res.status(401).json({ detalhes: 'Cliente não localizado ou inativado.' });
    return;
  }

  req.cliente = cliente;

  next();
  return;
};

module.exports = requerClienteApiKey;

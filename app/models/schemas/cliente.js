const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema(
  {
    Nome: { type: String, required: true },
    Ativo: { type: Boolean, default: true },
    ApiKey: { type: String, required: true },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'DataCriacao', updatedAt: 'DataUpdate' },
  }
);

const Cliente = mongoose.model('Cliente', ClienteSchema, 'clientes');

module.exports = Cliente;

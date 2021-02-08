const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema(
  {
    Nome: { type: String, required: true, index: { unique: true } },
    Ativo: { type: Boolean, default: true },
    ApiKey: { type: String, required: true, index: { unique: true } },
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'DataCriacao', updatedAt: 'DataUpdate' },
  }
);

const Cliente = mongoose.model('Cliente', ClienteSchema, 'clientes');

module.exports = Cliente;

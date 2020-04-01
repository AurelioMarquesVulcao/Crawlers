const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LinkDocumentoSchema = new Schema(
  {
    titulo: String,
    url: String,
  },
  { _id: false, versionKey: false }
);

const AndamentoSchema = new Schema({
  numeroDoProcesso: String,
  hash: String,
  descricao: String,
  data: Date,
  dataInclusao: Date,
  link: String,
  linkDocumento: LinkDocumentoSchema,
});

const Andamento = mongoose.model('Andamento', AndamentoSchema, 'andamentos');

module.exports.Andamento = Andamento;

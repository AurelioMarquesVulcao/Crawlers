const mongoose = require('mongoose');

const { Helper } = require('../../lib/util');

const Schema = mongoose.Schema;

const LinkDocumentoSchema = new Schema(
  {
    titulo: String,
    url: String,
  },
  { _id: false, versionKey: false }
);

const AndamentoSchema = new Schema({
  numeroProcesso: { type: String, required: true },
  hash: { type: String, unique: true, required: true },
  descricao: String,
  data: Date,
  dataInclusao: Date,
  link: String,
  linkDocumento: LinkDocumentoSchema,
});

AndamentoSchema.statics.criarHash = function criarHash(obj) {
  let preHash = `${obj.numeroProcesso}${obj.data}${obj.descricao}`;
  return Helper.hash(preHash);
};

AndamentoSchema.statics.salvarAndamentos = function salvarAndamentos(objs) {
  objs.map(element => {
    element.salvar();
  });
};

AndamentoSchema.methods.salvar = function salvar() {
  this.hash = Andamento.criarHash(this);
  let andamentoObject = this.toObject();
  delete andamentoObject['_id'];
  Andamento.updateOne(
    { hash: this.hash },
    andamentoObject,
    { upsert: true },
    (err, doc) => {
      if (err) {
        console.log(err);
        return;
      }
      if (doc.upserted) {
        console.log(
          `Novo andamento cadastrado: ${andamentoObject.numeroProcesso} - ${andamentoObject.hash}`
        );
      }
    }
  );
};

const Andamento = mongoose.model('Andamento', AndamentoSchema, 'andamentos');

module.exports.Andamento = Andamento;

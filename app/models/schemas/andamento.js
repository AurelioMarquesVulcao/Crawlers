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

const AndamentoSchema = new Schema(
  {
    numeroProcesso: { type: String, required: true },
    hash: { type: String, unique: true, required: true },
    descricao: String,
    data: Date,
    dataInclusao: Date,
    link: String,
    observacao: String,
    linkDocumento: LinkDocumentoSchema,
  },
  {
    versionKey: false,
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
        delete ret.hash;
      },
    },
    autoIndex: true,
  }
);

AndamentoSchema.statics.criarHash = function criarHash(obj) {
  let preHash = `${obj.numeroProcesso}${obj.data}${obj.descricao}${obj.observacao}`;
  return Helper.hash(preHash);
};

AndamentoSchema.statics.salvarAndamentos = function salvarAndamentos(objs) {
  let andamentosNovos = objs.map(async (element) => {
    return await element.salvar();
  });
  return Promise.all(andamentosNovos).then((args) => {
    return args.filter(Boolean).length;
  });
};

AndamentoSchema.methods.salvar = async function salvar() {
  this.hash = Andamento.criarHash(this);
  let andamentoObject = this.toObject();
  delete andamentoObject['_id'];

  return new Promise((resolve, reject) => {
    Andamento.updateOne(
      { hash: this.hash },
      andamentoObject,
      { upsert: true },
      (err, doc) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        if (doc.upserted) {
          return resolve(true);
        }
        return resolve(false);
      }
    );
  }).catch((err) => {
    throw err;
  });
};

AndamentoSchema.statics.retornaAndamentos = async function retornaAndamentos(numeroProcesso) {
  return Andamento.find({ numeroProcesso: numeroProcesso }, function (
    err,
    result
  ) {
    if (err) {
      console.log(err);
      return { sucesso: false }
    }
    let andamentos = result.map((element, index) => {
      return element.toJSON();
    });
    return { sucesso: true, andamentos:andamentos }
  })
}

AndamentoSchema.index({ numeroProcesso: 1, type: -1 });

const Andamento = mongoose.model('Andamento', AndamentoSchema, 'andamentos');

module.exports.Andamento = Andamento;

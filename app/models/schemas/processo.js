const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const capaSchema = new Schema(
  {
    uf: String,
    comarca: String,
    vara: String,
    fase: String,
    assunto: [String],
    classe: String,
    dataDistribuicao: Date,
  },
  { _id: false, versionKey: false }
);

const detalhesSchema = new Schema(
  {
    tipo: String,
    numeroProcesso: { type: String, unique: true, required: true },
    numeroProcessoMascara: String,
    instancia: Number,
    ano: Number,
    orgao: Number,
    tribunal: Number,
    origem: Number,
  },
  { _id: false, versionKey: false }
);

const parteSchema = new Schema(
  {
    nome: String,
    tipo: String,
  },
  { _id: false, versionKey: false }
);

const processoSchema = new Schema(
  {
    capa: capaSchema,
    detalhes: detalhesSchema,
    envolvidos: [parteSchema],
    oabs: [String],
    status: String, //transformar enums
    isBaixa: Boolean,
    temAndamentosNovos: Boolean,
    qtdAndamentos: Number,
    origemExtracao: String,
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'dataCriacao', updatedAt: 'dataAtualizacao' },
    autoIndex: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret._id;
      },
    },
  }
);

processoSchema.methods.salvar = async function salvar() {
  let processoObject = this.toObject();
  delete processoObject['_id'];
  var pesquisa = await new Promise((resolve, reject) => {
    Processo.findOne(
      {
        'detalhes.numeroProcesso': this.detalhes.numeroProcesso,
      },
      (err, doc) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        resolve(doc);
      }
    );
  });

  var doc = await new Promise((resolve, reject) => {
    processoObject.temAndamentosNovos = true;
    if (pesquisa && this.qtdAndamentos == pesquisa.qtdAndamentos) {
      processoObject.temAndamentosNovos = false;
    }
    let doc = Processo.updateOne(
      { 'detalhes.numeroProcesso': this.detalhes.numeroProcesso },
      processoObject,
      { upsert: true },
      (err, doc) => {
        if (err) {
          console.log(err);
          reject(err);
        }
        resolve(doc);
      }
    );
  });

  if (doc.upserted) {
    return {
      numeroProcesso: processoObject.detalhes.numeroProcesso,
      temAndamentosNovos: processoObject.temAndamentosNovos,
      qtdAndamentosNovos: processoObject.qtdAndamentos,
    };
  }
  return {
    numeroProcesso: processoObject.detalhes.numeroProcesso,
    temAndamentosNovos: processoObject.temAndamentosNovos,
    qtdAndamentosNovos: processoObject.qtdAndamentos - pesquisa.qtdAndamentos,
  };
};

processoSchema.methods.identificarDetalhes = function identificarDetalhes(cnj) {
  let detalhes = {};
  let cnjPartes = cnj.split(/\D/);

  detalhes['tipo'] = 'cnj';
  detalhes['numeroProcesso'] = cnj.replace(/[-.]/g, '');
  detalhes['numeroProcessoMascara'] = cnj;
  detalhes['instancia'] = /.0000$|.9000$/.test(cnj) ? 2 : 1;
  detalhes['ano'] = parseInt(cnjPartes[1]);
  detalhes['orgao'] = parseInt(cnjPartes[2]);
  detalhes['tribunal'] = parseInt(cnjPartes[3]);
  detalhes['origem'] = parseInt(cnjPartes[4]);

  return detalhes;
};

processoSchema.index({ 'detalhes.numeroProcesso': 1, type: -1 });

const Processo = mongoose.model('Processo', processoSchema, 'processos');

module.exports.Processo = Processo;

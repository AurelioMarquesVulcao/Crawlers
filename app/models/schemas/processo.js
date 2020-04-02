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
    numeroProcesso: String,
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
    titulo: String,
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
    qtdAndamentosNovos: Number,
    origemExtracao: String,
  },
  {
    versionKey: false,
    timestamps: { createdAt: 'dataCriacao', updatedAt: 'dataAtualizacao' },
  }
);

processoSchema.methods.salvar = function salvar() {
  let processoObject = this.toObject();
  delete processoObject['_id'];
  Processo.updateOne(
    { 'detalhes.numeroProcesso': this.detalhes.numeroProcesso },
    processoObject,
    { upsert: true },
    (err, doc) => {
      if (err) {
        console.log(err);
        return;
      }
      console.log(doc);
    }
  );
};

processoSchema.methods.identificarDetalhes = function identificarDetalhes(cnj) {
  //TODO identificarDetalhes, construir funcao
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

const Processo = mongoose.model('Processo', processoSchema, 'processos');

module.exports.Processo = Processo;

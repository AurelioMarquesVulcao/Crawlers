const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const moment = require('moment');

const capaSchema = new Schema(
  {
    uf: String,
    comarca: String,
    vara: String,
    fase: String,
    assunto: [String],
    classe: String,
    dataDistribuicao: Date,
    instancia: String,
    segredoJustica: Boolean,
    justicaGratuita: Boolean,
    valor: String,
    audiencias: []
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

/**
 * @param detalhes resultado da funcao de extracao de detalhes do processo
 * @param detalhes.numeroProcessoMascara
 * @param detalhes.numeroProcesso
 * @param detalhes.ano
 * @param detalhes.orgao
 * @param detalhes.tribunal
 * @param detalhes.origem
 * @returns {{sequencial: string, numeroProcesso: string, ano: string, orgao: string, numeroProcessoMascara: string, origem: string, tribunal: string, digito: string}}
 */
processoSchema.statics.formatarDetalhes = function formatarDetalhes({numeroProcessoMascara, numeroProcesso, ano, orgao, tribunal, origem} = {}) {
  return {
    numeroProcessoMascara: ('0000000' + numeroProcessoMascara).slice(-25),
    numeroProcesso: ('0000000' + numeroProcesso).slice(-20),
    sequencial: ('0000000' + numeroProcessoMascara.split(/\D/g)[0]).slice(-7),
    digito: ('00'+numeroProcessoMascara.split(/\D/g)[1]).slice(-2),
    ano: ('0000' + ano).slice(-4),
    orgao: ('00' + orgao).slice(-2),
    tribunal: ('00' + tribunal).slice(-2),
    origem: ('0000' + origem).slice(-4),
  }
}

processoSchema.methods.salvar = async function salvar() {
  let processoObject = this.toObject();
  let pesquisaAndamentos = 0;
  delete processoObject['_id'];
  // verificando se há processos já salvos
  let pesquisa = await new Promise((resolve, reject) => {
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

  // verificando a quantidade de andamentos dentro do banco
  let doc = await new Promise((resolve, reject) => {

    processoObject.temAndamentosNovos = !(pesquisa && this.qtdAndamentos === pesquisa.qtdAndamentos);
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

  // Verifica se o processo foi atualizado
  if (doc.upserted) {
    return {
      numeroProcesso: processoObject.detalhes.numeroProcesso,
      temAndamentosNovos: processoObject.temAndamentosNovos,
      qtdAndamentosNovos: processoObject.qtdAndamentos,
    };
  }

  if (pesquisa) {
    if (pesquisa.qtdAndamentos) {
      pesquisaAndamentos = pesquisa.qtdAndamentos;
    }
    pesquisaAndamentos = 0;
  }

  return {
    numeroProcesso: processoObject.detalhes.numeroProcesso,
    temAndamentosNovos: processoObject.temAndamentosNovos,
    qtdAndamentosNovos: processoObject.qtdAndamentos - pesquisaAndamentos,
  };
};

processoSchema.statics.identificarDetalhes = function identificarDetalhes(cnj) {
  let detalhes = {};

  let cnjPartes = cnj.replace('-', '').split(/\D/);

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

processoSchema.statics.listarProcessos = async function listarProcessos(dias, tribunal, orgao) {
  let numeroProcessos = [];

  let query = {
      dataAtualizacao: {
        $gte: new Date(new Date().getTime() - dias * 24 * 3600 * 1000),
      },
    }

    if (tribunal) query['detalhes.tribunal'] = tribunal;
    if (orgao) query['detalhes.orgao'] = orgao;

  let docs = await Processo.find(
    query,
    {
      'detalhes.numeroProcessoMascara': 1,
    }
  );

  docs.forEach((doc) => {
    numeroProcessos.push(doc.detalhes.numeroProcessoMascara);
  });

  return numeroProcessos;
};

processoSchema.index({ 'detalhes.numeroProcesso': 1, type: -1 });

const Processo = mongoose.model('Processo', processoSchema, 'processos');

module.exports.Processo = Processo;

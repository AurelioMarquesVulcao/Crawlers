const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackIntegracaoProadvSchema = new Schema(
  {
    integracaoConectaId: mongoose.Types.ObjectId,
    numeroProcesso: String,
    numeroProcessoMascara: String,
    tipoIntegracao: String,
    dataRecebimento: Date,
    atualizado: Boolean,
    tribunal: String,
  },
  { versionKey: false }
);

feedbackIntegracaoProadvSchema.statics.salvar = async function salvar(obj) {
  new FeedbackIntegracaoProadv(obj).save();
};

feedbackIntegracaoProadvSchema.statics.marcarAtualizado = async function marcarAtualizado(obj) {  
  await FeedbackIntegracaoProadv.updateOne({_id: obj.id}, {
    $set: {
      atualizado: true
    }
  });
};

const FeedbackIntegracaoProadv = mongoose.model('FeedbackIntegracaoProadv', feedbackIntegracaoProadvSchema, 'feedbackIntegracaoProadv');

module.exports.FeedbackIntegracaoProadv = FeedbackIntegracaoProadv;
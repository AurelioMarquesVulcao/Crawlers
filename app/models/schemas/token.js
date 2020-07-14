const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const timeInFuture = () => {
  return new Date( new Date().getTime() + 7 * 60 * 60 * 1000);
}

const TokenSchema = new Schema({
  token: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expireAt: {
    type: Date,
    default: timeInFuture
  }
});

TokenSchema.statics.hasValid = async (cb) => {
  let resposta;
  const agora = new Date();
  const doc = await Token.findOne({expireAt: {$gt: agora}});
  if (doc) {
    // Garante que só tenha um token no banco (evita congestionamento)
    await Token.deleteMany({_id: {$ne: doc._id}});
    resposta = { sucesso: true, token: doc.token };
  } else {
    resposta = { sucesso: false };
  }
  return resposta;
}

const Token = mongoose.model('Token', TokenSchema);

module.exports.Token = Token;

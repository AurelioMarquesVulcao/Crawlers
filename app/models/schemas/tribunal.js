const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TribunalSchema = new Schema(
  {
    sigla: String,
  },
  { versionKey: false }
);

const Tribunal = mongoose.model('Tribunal', TribunalSchema, 'tribunais');

module.exports.Tribunal = Tribunal;

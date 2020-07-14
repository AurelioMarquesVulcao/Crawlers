const mongoose = require('mongoose');
const { Schema } = require('mongoose');

const logCaptchaSchema = new Schema(
  {
    Servico: String,
    Tipo: String,
    Website: String,
    WebsiteKey: String,
    PageAction: String,
    Robo: { type: String, required: true },
    NumeroProcesso: String,
    NumeroOab: String,
    Data: Date,
    CaptchaBody: Object,
  },
  { versionKey: false, timestamps: { createdAt: 'Data' } }
);

const LogCaptcha = mongoose.model(
  'LogCaptcha',
  logCaptchaSchema,
  'logCaptchas'
);

module.exports.LogCaptcha = LogCaptcha;

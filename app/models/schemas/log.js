const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LogSchema = new Schema(
    {
        cnj: {type: String, default: ''},
        oab: {type: String, default: ''},
        tipo: String,
        detalhes: String,
        tribunal: String,
        robo: String
    },
    { versionKey: false, timestamps: {createdAt: 'dataCriacao'}}
);

const Log = mongoose.model('Log', LogSchema, 'logs');

module.exports.Log = Log;
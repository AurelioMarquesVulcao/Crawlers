const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var TokenSchema = new Schema(
    {
        token: String,
        createdAt: {
            type: Date,
            default: Date.now,
            expires: 25200, // 7 horas
        }
    }
);

const Token = mongoose.model('Token', TokenSchema);

module.exports.Token = Token;
const mongoose = require('mongoose');


const logDocumentosAWS = new mongoose.Schema({
	envio: Boolean,
	dataCriacao: Date,
	modulo: String,
	statusCode:Number,
	conteudo:{},
	// url:String,
	// log:Object,
	
})

const LogAWS = mongoose.model('LogDocumentosAWS', logDocumentosAWS, 'logDocumentosAWS');

module.exports.LogAWS = LogAWS;
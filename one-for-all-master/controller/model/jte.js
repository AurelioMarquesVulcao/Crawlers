const mongoose = require('mongoose');


// modelo com tudo agregado.
const consultaCadastradas = mongoose.model('ConsultasCadastradas', {
	NumeroProcesso: String,
	DataCadastro: Date,
	AtivoParaAtualizacao: Boolean,
	DataUltimaConsultaTribunal: Date,
	Instancia: String,
	TipoConsulta: String,
	Detalhes: {
		Orgao: Number,
		Tribunal: Number
	}
}, 'consultasCadastradas');

module.exports.consultaCadastradas = consultaCadastradas;


const ultimoSchema = new mongoose.Schema({
	numeroProcesso: String,
	dataCadastro: String,
	origem: Number,
	tribunal: Number,
	data: { dia: Number, mes: Number },
})
const ultimoProcesso = mongoose.model('UltimosProcessos', ultimoSchema, 'ultimosProcessos');

module.exports.ultimoProcesso = ultimoProcesso;


const linkSchema = new mongoose.Schema({
	link: String,
	movimentacao: String,
	data: String,
	numeroProcesso: String,
	tipo: String,
})

const linkDocumento = mongoose.model('SalvaDocumentoLink', linkSchema, 'salvaDocumentoLink');

module.exports.linkDocumento = linkDocumento;

const comarcaSchema = new mongoose.Schema({
	estado: String,
	estadoNumero: String,
	comarca: String,
	status: String,
	dataBusca: {},
	dataCriaçãoJTE: Date,
	numeroUltimoProcecesso: String,

})

const statusEstadosJTE = mongoose.model('comarcasJTE', comarcaSchema, 'comarcasJTE');

module.exports.statusEstadosJTE = statusEstadosJTE;

const logDownloadDocumentos = new mongoose.Schema({
	numeroProcesso: String,
	dataDownload: Date,
	statusDownload: Boolean,
	message: {},
	quantidadeTentativas: Number

})

const LogDownload = mongoose.model('logIniciais', logDownloadDocumentos, 'logIniciais');

module.exports.LogDownload = LogDownload;

const logDocumentosAWS = new mongoose.Schema({
	envio: Boolean,
	dataCriacao: Date,
	modulo: String,
	statusCode: Number,
	conteudo: {},
	// url:String,
	// log:Object,

})

const LogAWS = mongoose.model('LogDocumentosAWS', logDocumentosAWS, 'logDocumentosAWS');

module.exports.LogAWS = LogAWS;

const logsAWSs = new mongoose.Schema({
	numeroProcesso: String,
	statusDownload: Boolean,
	dataDownload: Date,
	quantidadeTentativas: Number,
	envioAWS: []
})

const LogsAWS = mongoose.model('LogsAWS', logsAWSs, 'logsAWS');

module.exports.LogsAWS = LogsAWS;
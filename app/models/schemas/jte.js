const mongoose = require('mongoose');

const { Helper } = require('../../lib/util');


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
	data: { dia: Number, mes: Number},
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
	dataBusca: Date,
	// dataAtualizacao: Date,
	dataCriaçãoJTE: Date,
	numeroUltimoProcecesso: String,
	ano:String
})

const statusEstadosJTE = mongoose.model('comarcasJTE', comarcaSchema, 'comarcasJTE');

module.exports.statusEstadosJTE = statusEstadosJTE;

const logDownloadDocumentos = new mongoose.Schema({
	numeroProcesso: String,
	dataDownload: Date,
	statusDownload: Boolean,
	message:{},
	quantidadeTentativas: Number
	
})

const LogDownload = mongoose.model('logIniciais', logDownloadDocumentos, 'logIniciais');

module.exports.LogDownload = LogDownload;



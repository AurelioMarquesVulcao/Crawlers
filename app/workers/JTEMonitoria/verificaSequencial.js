const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const async = require('async');
const mongoose = require('mongoose');

const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { statusEstadosJTE, ultimoProcesso } = require("../../models/schemas/jte")
const rabbit = new GerenciadorFila();



const red = '\u001b[31m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';

class VerificaNumeracao {
	/**
	 * Busca no controle de comarcas o status de uma dada comarca.
	 * @param {string} estado Numero do estado no fomato CNJ
	 * @param {string} comarca Numero da comarca no padrão CNJ
	 */
	static async buscaComarcas(estado, comarca) {
		let busca = await statusEstadosJTE.find({
			"estadoNumero": estado,
			"comarca": comarca,
		})
		return busca[0]
	}

	/**
	 * 
	 * @param {*} dia 
	 * @param {*} mes 
	 */
	static async buscaProcessos(dia, mes) {
		let busca = await ultimoProcesso.find({
			"data": {
				"dia": 1,
				"mes": 9
			}
		})
		return busca[0]
	}



	/**Conecta ao Banco de dados */
	static onDB() {
		mongoose.connect(enums.mongo.connString, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		mongoose.connection.on('error', (e) => {
			console.log(e);
		});
	}
	/** Desconcta ao Banco de dados */
	static async offDB() {
		await mongoose.connection.close()
	}
}
(async () => {
	await VerificaNumeracao.onDB()
	console.log(await VerificaNumeracao.buscaComarcas("01", "0263"));
	console.log(await VerificaNumeracao.buscaProcessos());
	await VerificaNumeracao.offDB()
})()

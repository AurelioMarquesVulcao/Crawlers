const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const async = require('async');
const mongoose = require('mongoose');

const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { statusEstadosJTE, ultimoProcesso } = require("../../models/schemas/jte")
const { Processo } = require("../../models/schemas/processo");
const rabbit = new GerenciadorFila();



const red = '\u001b[31m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';

class VerificaNumeracao {

	/**
	 * Gera os numeros sequenciais que precisam ser completados
	 * @param {*} sequenciais 
	 */
	static async verificaSequencia(sequenciais) {
		let resultado = [];
		let sequencia = [];
		let max = Math.max.apply(Math, sequenciais);
		let min = Math.min.apply(Math, sequenciais);
		let quantidade = max - min
		for (let i = 0; i < quantidade + 1; i++) {
			sequencia.push(min + i)
		}
		for (let i = 0; i < sequencia.length; i++) {
			if (sequenciais.indexOf(sequencia[i]) < 0) {
				resultado.push(sequencia[i])
			}
		}
		console.log(sequenciais);


		// let sequenciais = await this.buscaProcessos;
		// for (let i = 0; i < sequenciais.length; i++) {
		// 	let compara = sequenciais[i+1]-sequenciais[i]
		// }
		return resultado
	}

	/**
	 * Busca no controle de comarcas o status de uma dada comarca.
	 * @param {string} estado Numero do estado no fomato CNJ
	 * @param {string} comarca Numero da comarca no padrão CNJ
	 */
	static async buscaComarcas(estado, comarca) {
		let busca = await statusEstadosJTE.find({
			"estadoNumero": estado,
			"comarca": comarca,
		});
		return busca[0]
	}

	/**
	 * Busca na base de processos todos os processos de um determinado periodo
	 * @param {number} dia Dia desejado
	 * @param {number} mes Mes desejado
	 * @param {string} comarca comarca desejada
	 * @returns Array de sequenciais em ordem numérica
	*/
	static async buscaProcessos(dia, mes, comarca) {
		let data = new Date()
		// cria uma data 10 dias no passado
		data.setDate(data.getDate() - 10);
		let sequencial = [];
		let busca = await Processo.aggregate([{
			$match: {
				"detalhes.ano": 2020,
				"detalhes.orgao": 5,
				"detalhes.tribunal": 1,
				"detalhes.origem": 1,
				'dataAtualizacao': {
					'$lt': new Date,
					'$gt': data
				}
			}
		},
		{
			$project: {
				"detalhes.numeroProcesso": 1,
				"_id": 0
			}
		},])
		// Extrai apenas os sequenciais dos numeros de prcesso.
		for (let i = 0; i < busca.length; i++) {
			sequencial.push(parseInt(busca[i].detalhes.numeroProcesso.slice(0, 7)));
		}
		// coloca em ordem numérica os sequenciais.
		let ordenado = sequencial.sort((a, b) => (a - b));
		return ordenado
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
	console.log(await VerificaNumeracao.verificaSequencia(
		[
			100798, 100799, 100800, 100818,
			100819, 100820, 100821, 100822,
			100823, 100824, 100825, 100826,
			100827, 100828, 100829, 100830,
			100831, 100832, 100833, 100834,
			100835, 100836, 100837, 100838,
			100839, 100840, 100841, 100842,
			100843, 100844, 100845
		]
	));
	// console.log(await VerificaNumeracao.buscaProcessos(1, 9, "0025"));
	await VerificaNumeracao.offDB()
})()

const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const async = require('async');
const mongoose = require('mongoose');

const { enums } = require('../configs/enums');
const { GerenciadorFila } = require("../lib/filaHandler");
const { statusEstadosJTE, ultimoProcesso } = require("../models/schemas/jte")
const { Processo } = require("../models/schemas/processo");
const rabbit = new GerenciadorFila();



const red = '\u001b[31m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';

class Verificador {
	/**
	 * Gera os numeros sequenciais que precisam ser completados
	 * @param {array} sequenciais Recebe um array de numeros
	 */
	static verificaSequencia(sequenciais) {
		let resultado = [];
		let sequencia = [];
		let max = Math.max.apply(Math, sequenciais);
		let min = Math.min.apply(Math, sequenciais);
		let quantidade = max - min
		for (let i = 0; i < quantidade + 1; i++) {
			sequencia.push(min + i)
		}
		// console.log("ta aqui", sequencia);
		for (let i = 0; i < sequencia.length; i++) {
			if (sequenciais.indexOf(sequencia[i]) < 0) {
				resultado.push(sequencia[i])
			}
		}
		// console.log(sequenciais);
		console.log(resultado);
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
	* Busca no controle de comarcas todas as comarcas.
	* @returns Retorna um array de comarcas e estados [{estadoNumero: "01", comarca: "0001"}]
	*/
	static async buscaTodasComarcas() {
		let busca = await statusEstadosJTE.aggregate([{
			$match: {
			}
		},
		{
			$project: {
				"estadoNumero": 1,
				"comarca": 1,
				"_id": 0
			}
		},])
		return busca
	}


	/**
	 * Busca na base de processos todos os processos de um determinado periodo
	 * @param {number} tribunal Tribunal a ser bucado
	 * @param {number} comarca Comarca a ser buscada
	 * @param {number} periodo quantidade de dias a serem pesquisados, por padrão adotamos 7
	 * @returns Array de sequenciais em ordem numérica
	 */
	static async buscaProcessos(tribunal, comarca, periodo) {
		let data = new Date()
		// cria uma data 7 dias no passado
		data.setDate(data.getDate() - periodo);
		// console.log(data);
		// console.log(new Date);
		let sequencial = [];
		let busca = await Processo.aggregate([{
			$match: {
				"detalhes.ano": 2020,
				"detalhes.orgao": 5,
				"detalhes.tribunal": tribunal,
				"detalhes.origem": comarca,
				'dataCriacao': {
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
		// console.log(ordenado);
		// this.verificaSequencia(ordenado)
		
		return this.verificaSequencia(ordenado)
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
module.exports.Verificador = Verificador;
const mongoose = require("mongoose");
const sleep = require('await-sleep');
const { enums } = require("../configs/enums");

const { GerenciadorFila } = require("../lib/filaHandler");
const { Processo } = require('../models/schemas/processo');
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../models/schemas/jte');
const { Cnj, CnjValidator } = require('../lib/util');
require("dotenv/config");

const util = new Cnj();



class CriaFilaJTE {
	/**
 * Busca dados de comarca de um dado estado.
 * @param {string} codigo Numero do estado 
 * @returns {Array} C	omarcas com detalhes do ultimo processo baixado.
 */
	static async getEstado(codigo) {
		return await statusEstadosJTE.find({ "estadoNumero": codigo })
	}

	/**
	 * Ajusta os dados de controle da colection de controle de comarcas
	 * @param {*} codigo 
	 */
	static async ajusta(codigo) {
		let dados = (await statusEstadosJTE.find({}))
		// .filter(x => x.numeroUltimoProcecesso == null)
		for (let i = 0; i < dados.length; i++) {
			let obj = {
				"estado": "Principal",
				// dataCriaçãoJTE: new Date(),
				// "dataBusca" : new Date(),
				// status: 'Atualizado',
				// ano: "2021"
				// numeroUltimoProcecesso:`10000006620215${dados[i].estadoNumero}${dados[i].comarca}`
			}
			let teste = await statusEstadosJTE.find({ estadoNumero: dados[i].estadoNumero, comarca: dados[i].comarca });
			// console.log(teste);
			if (teste.length > 1) {
				console.log(teste);
				let numero = [teste[0].numeroUltimoProcecesso, teste[1].numeroUltimoProcecesso]
				console.log(retornaIndiceMaiorValor(numero));
				console.log(numero[retornaIndiceMaiorValor(numero)]);
				await statusEstadosJTE.deleteOne({ numeroUltimoProcecesso: numero[retornaIndiceMaiorValor(numero)] })


			}
			// console.log(dados[i].estadoNumero, dados[i].comarca);
			// await statusEstadosJTE.deleteOne({ _id: dados[i]._id })
			// console.log(await statusEstadosJTE.find({ estadoNumero: dados[i].estadoNumero, comarca: dados[i].comarca }));

			// console.log( await statusEstadosJTE.findOneAndUpdate({ _id: dados[i]._id },obj));
			// await statusEstadosJTE.deleteOne({ numeroUltimoProcecesso: del })
			// console.log(dados[i]);
		}
		function retornaIndiceMaiorValor(array) {
			let maior = array[0];
			let indice = 0;
			for (let i = 1; i < array.length; i++) {
				if (array[i] < maior) {
					maior = array[i];
					indice = i;
				}
			}
			return indice;
		}

		// console.log(dados);
	}

	/**
	 * Obtem dados do ultimo processo de mesma comarca/Estado do processo pesquisado. 
	 * @param {String} cnj numero processo qualquer
	 */
	static async getComarca(cnj) {
		let detalhes = Cnj.processoSlice(cnj);
		return await statusEstadosJTE.find({
			"estadoNumero": detalhes.estado,
			"comarca": detalhes.comarca
		})
	}

	/**
	 * Compara se o numero de cnj e o ultimo processo de mesma comarca possuiem um fork de numeração.
	 * @param {String} cnj numero processo qualquer
	 */
	static async verificaSequencial(cnj) {
		try {
			let get = await CriaFilaJTE.getComarca(cnj);
			let retornos = [];
			get.map(x => {
				let { numeroUltimoProcecesso } = x;
				let sequencial = Cnj.processoSlice(numeroUltimoProcecesso).sequencial;
				let sequencial_1 = Cnj.processoSlice(cnj).sequencial;
				console.log(sequencial_1, sequencial);
				let teste = sequencial_1 - sequencial;

				console.log(teste);
				if (teste > 1000) {
					retornos.push(true);
				} else {
					retornos.push(false);
				}
			})
			// localizar um false o retorno final é false => se todos os retornos forem true o retorno é true
			console.log(retornos);
			console.log(retornos.indexOf(false));
			let index = retornos.indexOf(false);
			if (index >= 0) {
				return false
			} else {
				return true
			}
		} catch (e) { }
	}

	static async updateEstado(id, update = { status: 'Atualizado' }) {
		let find = { _id: id };
		// let update = { status: 'Atualizado2' };
		// let update = {status: 'Ultimo Processo'}
		return await statusEstadosJTE.findOneAndUpdate(find, update)
	}

	static async resetEstado(codigo) {
		let comarcas = await this.getEstado(codigo);
		console.log(comarcas);
		comarcas.map(async x => {
			await this.updateEstado(x._id);
			let datas = await statusEstadosJTE.findOne(x._id)
			console.log(datas.estadoNumero, datas.comarca, datas.status);
		})

	}

	async salvaStatusComarca(numero, data, raspagem, buscaProcesso, estado) {
		// if (!estado){estado = "Principal"}
		console.log(numero, data, raspagem, buscaProcesso, estado);
		let cnj = Cnj.processoSlice(numero);
		let busca = buscaProcesso;
		let verifica = await statusEstadosJTE.find(busca);
		// let estado = "";
		let estadoNumero = cnj.estado;
		// let dataAtualizacao = new Date();
		let comarca = cnj.comarca;
		let status = "Novo";
		let dataBusca = new Date();
		let dataCriaçãoJTE = data;
		let numeroUltimoProcecesso = numero;
		let ano = cnj.ano;
		let verificaSequencial = await CriaFilaJTE.verificaSequencial(numero);
		console.log(verificaSequencial);
		if (verificaSequencial) {
			let getComarca = await statusEstadosJTE.find({
				"estadoNumero": cnj.estado,
				"comarca": cnj.comarca,
				"ano": new Date().getFullYear()
			})
			console.log(getComarca);
			if (getComarca.length == 1) {
				estado = "fork-1"
			} else {
				estado = `fork-${getComarca.length}`
			}
			// estado = "1"		} else {
			// estado = "Principal"
		}
		console.log(estado);
		busca.estado = estado;
		console.log(busca);
		// console.log(verifica);
		// process.exit();
		let obj = { estado, estadoNumero, comarca, status, dataBusca, dataCriaçãoJTE, numeroUltimoProcecesso, ano };

		if (cnj.sequencial == "0000000") {

			status = "Não possui processos";
			let obj2 = { status, estadoNumero, comarca, dataBusca, numeroUltimoProcecesso, ano };
			if (verifica.length == 0) {

				await new statusEstadosJTE(obj2).save()
			} else {
				await statusEstadosJTE.findOneAndUpdate(busca, obj2)
			}
		} else if (verifica.length == 0) {
			await new statusEstadosJTE(obj).save()
		} else if (raspagem == true) {
			let buscaUltimo = {
				estado, estadoNumero, comarca
			}
			console.log(buscaUltimo);
			status = "Ultimo Processo";
			let obj2 = { status, dataBusca };
			console.log("-------- update -------------");
			console.log(await statusEstadosJTE.findOne(buscaUltimo));
			await statusEstadosJTE.findOneAndUpdate(buscaUltimo, obj2)
		} else {
			// verifica se o numero atual não é menor do que o registrado.
			if (verificaUltimo(estado, estadoNumero, comarca, numeroUltimoProcecesso, ano)) {
				status = "Atualizado";
				let obj2 = { estado, estadoNumero, comarca, status, dataBusca, dataCriaçãoJTE, numeroUltimoProcecesso, ano };
				console.log("-------- update -------------");
				await statusEstadosJTE.findOneAndUpdate(busca, obj2)
			}
		}
		// process.exit();

		async function verificaUltimo(estado, estadoNumero, comarca, numeroUltimoProcecesso, ano) {
			try {
				let busca = await statusEstadosJTE.findOne({ estado, estadoNumero, comarca, ano });
				let sequencial1 = Cnj.processoSlice(busca.numeroUltimoProcecesso).sequencial;
				let sequencial2 = Cnj.processoSlice(numeroUltimoProcecesso).sequencial;
				if (sequencial2 < sequencial1) {
					return true
				} else {
					return false
				}
			} catch (e) {
				// caso seja o 1 processo da comarca o retorno da busca e um erro,
				// nesse caso tenho que possuir retorno true para salvar o 1 processo.
				return true
			}
		}


		function novoSequencial(numero) {
			let resultado;
			let cnj = Cnj.processoSlice(numero);
			let sequencial = cnj.sequencial;
			let sequencialSlice = util.corrigeSequencial(sequencial);
			let zero = sequencialSlice.zero;
			let numeros = sequencialSlice.seq;
			let numerosAnterior = parseInt(numeros) - 1
			if ((numerosAnterior.toString().length + zero.length) < 7) {
				resultado = zero + "0" + numerosAnterior
			} else {
				resultado = resultado = zero + numerosAnterior
			}

			return resultado
		}

	}

	enviarMensagem(nome, message) {
		new GerenciadorFila().enviar(nome, message);
	}

	async buscaDb(quantidade, salto) {
		return await consultaCadastradas.find({ "Detalhes.Tribunal": 5 }).limit(quantidade).skip(salto)
	}

	async salvaUltimo(ultimo) {
		let verifica = await ultimoProcesso.find({ "numeroProcesso": ultimo.numeroProcesso })
		if (!verifica[0]) {
			return await new ultimoProcesso(ultimo).save()
		}

	}

	/**
	 * Salva os links dos documentos no banco de dados
	 * @param {object} link Objeto com o link e movimentação do processo.
	 */
	async salvaDocumentoLink(link) {
		let verifica = await linkDocumento.find({ "numeroProcesso": link.numeroProcesso, "movimentacao": link.link })
		if (!verifica[0]) {
			return await new linkDocumento(link).save()
		}
	}

	async abreUltimo(parametro) {
		let busca = await ultimoProcesso.find(parametro)
		let obj = busca;
		return obj
	}

	async filtraTrunal() {
		let recebeNumeros = [];
		let resultado = [];
		let dados = await this.buscaDb(60000, 0);
		for (let i = 0; i < dados.length; i++) {
			let numero = dados[i].NumeroProcesso
			let sequencial = numero.slice(0, 7)
			let varaTrabalho = numero.slice(numero.length - 4, numero.length)
			if (recebeNumeros.indexOf(varaTrabalho) < 0) {
				recebeNumeros.push(varaTrabalho,)
				resultado.push([varaTrabalho, sequencial])
			}
		}
		return resultado.sort()
	}
	async peganumero() {
		let dados = await this.buscaDb(60000, 0)
		for (let i = 0; i < dados.length; i++) {
			let numero = dados[i].NumeroProcesso

			let varaTrabalho = numero.slice(numero.length - 4, numero.length)
			if (recebeNumeros.indexOf(varaTrabalho) < 0) {

				recebeNumeros.push(varaTrabalho)
			}
		}
	}
	/**
	 * Cria um numero de processo para ser enviado para fila
	 * @param {string} sequencial numero sequencial que deverá ser trabalhado para o envio a fila.
	 * @param {string} origem comarca que será buscada
	 * @param {number} tentativas numero de processos a serem testados
	 * @param {string} tribunal referêncial numerico do estado a ser buscado
	 * @param {string} fila fila que receberá a mensagem.
	 * @return {string} Retorna um Array de numeros CNJ para serem buscados
	 */
	async procura(sequencial, origem, tentativas, tribunal, estado) {
		// console.log(sequencial, "aqui");
		if (sequencial == "0000000") {
			sequencial = "0000000"
		}
		console.log(sequencial, "2");
		// console.log(sequencial, origem, tentativas, tribunal);
		if (estado == "") {
			estado = "Principal";
		}
		let mensagens = [];
		try {
			let obj = corrigeSequencial(sequencial)
			let zeros = ""
			let processo = ""
			origem = corrigeOrigem(origem)
			for (let i = 0; i < tentativas; i++) {
				sequencial = parseInt(obj.seq)
				// console.log(sequencial);
				let a = sequencial + 1 + i
				// console.log(a);
				if ((obj.zero + a).length > 7) {
					zeros = obj.zero.substr(1)
					let numeroAleatorio = CnjValidator.calcula_mod97(
						`${zeros}${a}`, `${new Date().getFullYear()}`, `5${tribunal}`, `${origem}`
					);
					processo = `${zeros}${a}${numeroAleatorio}${new Date().getFullYear()}5${tribunal}${origem}`

				} else {
					let numeroAleatorio = CnjValidator.calcula_mod97(
						`${zeros}${a}`, `${new Date().getFullYear()}`, `5${tribunal}`, `${origem}`
					);
					processo = `${zeros}${a}${numeroAleatorio}${new Date().getFullYear()}5${tribunal}${origem}`
				}
				let teste = await Processo.find({ "detalhes.numeroProcesso": processo });
				if (teste.length == 0) {
					mensagens.push(criaPost(processo, estado));
				}
			}
			return mensagens
		} catch (e) {
			// console.log(e);
			console.log(`O Processo numero: ${processo} FALHOU !!!`);
		}

	}

	/**
	 * Cria um numero de processo para ser enviado para fila
	 * @param {string} sequencial numero sequencial que deverá ser trabalhado para o envio a fila.
	 * @param {string} origem comarca do esdo que será buscada
	 * @param {number} tentativas numero de processos a serem testados
	 * @param {string} tribunal referêncial numerico do estado a ser buscado
	 * @param {string} fila fila que receberá a mensagem.
	 * @return {string} Retorna um numero CNJ para ser buscado
	 */
	async procura10(sequencial, origem, tentativas, tribunal, fila) {
		let mensagens = [];
		try {
			let obj = corrigeSequencial(sequencial)
			let zeros = ""
			let processo = ""
			origem = corrigeOrigem(origem)
			for (let i = 0; i < tentativas; i++) {
				sequencial = parseInt(obj.seq)
				let a = sequencial + 1 + i
				if ((obj.zero + a).length > 7) {
					zeros = obj.zero.substr(1)
					processo = `${zeros}${a}00${new Date().getFullYear()}5${tribunal}${origem}`
				} else {
					processo = `${obj.zero}${a}00${new Date().getFullYear()}5${tribunal}${origem}`
				}
				mensagens.push(criaPost(processo));
				// await this.enviaFila([{
				// 	NumeroProcesso: processo
				// }], fila)
			}
			return mensagens
			// console.log(`O Processo numero: ${processo} foi enviado para a fila.`);
		} catch (e) {
			console.log(`O Processo numero: ${processo} FALHOU !!!`);
		}
	}

	/**
		* Cria um numero de processo para ser enviado para fila
		* @param {string} sequencial numero sequencial que deverá ser trabalhado para o envio a fila.
		* @param {string} origem comarca do esdo que será buscada
		* @param {number} tentativas numero de processos a serem testados
		* @param {string} tribunal referêncial numerico do estado a ser buscado
		* @param {string} fila fila que receberá a mensagem.
		* @return {string} Retorna um numero CNJ para ser buscado
		*/
	async procuraEspecial(sequencial, origem, tentativas, tribunal, fila) {
		let mensagens = [];
		try {
			let obj = corrigeSequencial(sequencial)
			let zeros = ""
			let processo = ""
			origem = corrigeOrigem(origem)
			for (let i = 0; i < tentativas; i++) {
				sequencial = parseInt(obj.seq)
				let a = sequencial + 1 + i
				if ((obj.zero + a).length > 7) {
					zeros = obj.zero.substr(1)
					processo = `${zeros}${a}00${new Date().getFullYear()}5${tribunal}${origem}`
				} else {
					processo = `${obj.zero}${a}00${new Date().getFullYear()}5${tribunal}${origem}`
				}
				mensagens.push(criaPost(processo));

			}
			return mensagens
		} catch (e) {
			console.log(`O Processo numero: ${processo} FALHOU !!!`);
		}

	}
	relogio() {
		let data = new Date();
		// Guarda cada pedaço em uma variável
		let dia = data.getDate();           // 1-31
		let dia_sem = data.getDay();        // 0-6 (zero=domingo)
		let mes = data.getMonth();          // 0-11 (zero=janeiro)
		let ano2 = data.getYear();           // 2 dígitos
		let ano4 = data.getFullYear();       // 4 dígitos
		let hora = data.getHours();          // 0-23
		let min = data.getMinutes();        // 0-59
		let seg = data.getSeconds();        // 0-59
		let mseg = data.getMilliseconds();   // 0-999
		let tz = data.getTimezoneOffset(); // em minutos

		return { dia, mes, ano4, hora, min, seg }
	}


	async verificaComarcas(estado, comarca) {
		let data = new Date();
		// data.setDate(data.getDate() - 1);
		data.getDate()
		data.getMonth()
		let busca = { "estadoNumero": estado, "comarca": comarca }
		let checagem = await statusEstadosJTE.findOne(busca);
		let { status, dataBusca: { dia, mes } } = checagem;
		// console.log(status, dia, mes);
		// console.log(data.getDate(),data.getMonth());
		// console.log(checagem);
		// console.log(status);
		if (dia == data.getDate() && mes == data.getMonth()) {
			if (status != "Ultimo Processo") {
				return true;
			} else {
				return false
			}
		} else {
			return true
		}
	}

}


class CriaFilaTRT {
	async enviar(processo, fila) {
		await this.enviaFila([{
			NumeroProcesso: processo
		}], fila)
	}
}
// ------------------------------------funcoes complementares--------------------------------------------------------------------------------------------------------------------------------


function corrigeSequencial(sequencial) {
	// console.log(sequencial);
	if (sequencial == "0000000") {
		return obj = { seq: "0", zero: "000000" }
	}
	let novoSequencial = sequencial
	let zero = ''
	for (let i = 0; i < sequencial.length; i++) {
		if (sequencial[i] == '0') {
			novoSequencial = novoSequencial.slice(1, novoSequencial.length)
			zero += "0"
		} else {
			break
		};
	}; let seq = novoSequencial;
	// console.log({ seq, zero });
	return obj = { seq, zero }
}
function corrigeOrigem(origem) {
	let zero = ''
	let n = 4 - origem.length
	for (let i = 0; i < 5; i++) {
		if (n > i) {
			zero += "0"
		} else {
			break
		};
	}
	return zero + origem
}

/**
 * Cria Mensagem para ser enviada ao rabbit
 * @param {string} numero Numero CNJ que será usado para criar mensagem
 */
function criaPost(numero, estado) {
	let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true, "estado":"${estado}"}`;
	return post
}

// gera numero aleatório para preencher os campos os dados
function numeroAleatorio(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

// gera id aleatorio não unico
function makeid() {
	let text = "5ed9";
	let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
	let letra = "abcdefghijklmnopqrstuvwxyz";
	let numero = "0123456789";

	for (var i = 0; i < 20; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
}

function detalhes(numeroProcesso) {
	let numero = mascaraNumero(numeroProcesso)
	let detalhes = Processo.identificarDetalhes(numero)
	return detalhes
}

function mascaraNumero(numeroProcesso) {
	let resultado = '';
	resultado = numeroProcesso.slice(0, 7) + '-' + numeroProcesso.slice(7, 9)
		+ '.' + numeroProcesso.slice(9, 13) + '.' + numeroProcesso.slice(13, 14)
		+ '.' + numeroProcesso.slice(numeroProcesso.length - 6, numeroProcesso.length - 4)
		+ '.' + numeroProcesso.slice(numeroProcesso.length - 4, numeroProcesso.length)
	return resultado
}



module.exports.CriaFilaJTE = CriaFilaJTE;


module.exports.linkDocumento1 = linkDocumento;

// (async () => {
// 	mongoose.connect(enums.mongo.connString, {
// 		useNewUrlParser: true,
// 		useUnifiedTopology: true,
// 	});
// 	mongoose.connection.on('error', (e) => {
// 		console.log(e);
// 	});
// 	await CriaFilaJTE.ajusta()
// 	process.exit()

// })()
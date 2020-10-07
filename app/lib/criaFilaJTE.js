const mongoose = require("mongoose");
// const re = require('xregexp');
const sleep = require('await-sleep');
const { enums } = require("../configs/enums");

const { GerenciadorFila } = require("../lib/filaHandler");
// const { ExtratorBase } = require('../extratores/extratores');
// const { JTEParser } = require('../parsers/JTEParser');
const { Processo } = require('../models/schemas/processo');
const { consultaCadastradas, ultimoProcesso, linkDocumento, statusEstadosJTE } = require('../models/schemas/jte');
const { Cnj } = require('../lib/util');
require("dotenv/config");

const util = new Cnj();
// let devDbConection = process.env.MONGO_CONNECTION_STRING;
// mongoose.connect(devDbConection, {
// 	useNewUrlParser: true,
// 	useUnifiedTopology: true
// });


class CriaFilaJTE {
	async salvaStatusComarca(numero, data, raspagem, buscaProcesso) {
		let cnj = util.processoSlice(numero);
		let busca = buscaProcesso;
		let verifica = await statusEstadosJTE.find(busca);
		let estado = "";
		let estadoNumero = cnj.estado;
		let comarca = cnj.comarca;
		let status = "Novo";
		let dataBusca = { dia: this.relogio().dia, mes: this.relogio().mes }
		let dataCriaçãoJTE = data;
		let numeroUltimoProcecesso = numero;

		let obj = { estado, estadoNumero, comarca, status, dataBusca, dataCriaçãoJTE, numeroUltimoProcecesso, };

		if (cnj.sequencial == "0000000") {

			status = "Não possui processos";
			let obj2 = { status, estadoNumero, comarca, dataBusca, numeroUltimoProcecesso };
			if (verifica.length == 0) {

				await new statusEstadosJTE(obj2).save()
			} else {
				await statusEstadosJTE.findOneAndUpdate(busca, obj2)
			}

		} else if (verifica.length == 0) {
			await new statusEstadosJTE(obj).save()
		} else if (raspagem == true) {
			status = "Ultimo Processo";
			let obj2 = { status, dataBusca };
			console.log("-------- update -------------");
			await statusEstadosJTE.findOneAndUpdate(busca, obj2)
		} else {
			status = "Atualizado";
			let obj2 = { estado, estadoNumero, comarca, status, dataBusca, dataCriaçãoJTE, numeroUltimoProcecesso, };
			console.log("-------- update -------------");
			await statusEstadosJTE.findOneAndUpdate(busca, obj2)
		}

		function novoSequencial(numero) {
			let resultado;
			let cnj = util.processoSlice(numero);
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
		let veirifica = await ultimoProcesso.find({ "numeroProcesso": ultimo.numeroProcesso })
		if (!veirifica[0]) {
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
	 * @param {string} origem comarca do esdo que será buscada
	 * @param {number} tentativas numero de processos a serem testados
	 * @param {string} tribunal referêncial numerico do estado a ser buscado
	 * @param {string} fila fila que receberá a mensagem.
	 * @return {string} Retorna um numero CNJ para ser buscado
	 */
	async procura(sequencial, origem, tentativas, tribunal, fila) {
		let mensagens;
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
					processo = `${zeros}${a}4720205${tribunal}${origem}`
				} else {
					processo = `${obj.zero}${a}4720205${tribunal}${origem}`
				}
				mensagens = criaPost(processo);
				// await this.enviaFila([{
				// 	NumeroProcesso: processo
				// }], fila)
				// console.log(`O Processo numero: ${processo} foi enviado para a fila.`);
				// console.log(`Estado ${tribunal}`);
			}
			return mensagens
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
	async procura10(sequencial, origem, tentativas, tribunal, fila) {
		let mensagens;
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
					processo = `${zeros}${a}4720205${tribunal}${origem}`
				} else {
					processo = `${obj.zero}${a}4720205${tribunal}${origem}`
				}
				mensagens = criaPost(processo);
				// await this.enviaFila([{
				// 	NumeroProcesso: processo
				// }], fila)
			}
			return mensagens
			console.log(`O Processo numero: ${processo} foi enviado para a fila.`);
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
					processo = `${zeros}${a}4720205${tribunal}${origem}`
				} else {
					processo = `${obj.zero}${a}4720205${tribunal}${origem}`
				}
				mensagens.push(criaPost(processo));
				// await this.enviaFila([{
				// 	NumeroProcesso: processo
				// }], fila)
				// console.log(`O Processo numero: ${processo} foi enviado para a fila.`);
				// console.log(`Estado ${tribunal}`);
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

		return { dia, mes, hora, min, seg }
	}

	/**
	 * decontinuado...
	 * @param {*} numeroProcesso 
	 * @param {*} fila 
	 */
	// async enviaFila(numeroProcesso, fila) {
	// 	let filtro = numeroProcesso;
	// 	for (let i = 0; i < filtro.length; i++) {
	// 		let tribunal = 0
	// 		tribunal = detalhes(filtro[i].NumeroProcesso).tribunal;
	// 		// estou usando uma fila unica o código abaixo esta obsoleto.
	// 		if (tribunal != 150000) {
	// 			const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos${fila}`;
	// 			let message = criaPost(filtro[i].NumeroProcesso)

	// 			// await this.enviarMensagem(nomeFila, message)



	// 		}

	// 	}
	// }
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
function criaPost(numero) {
	let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true}`;
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


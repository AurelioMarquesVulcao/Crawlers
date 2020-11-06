const { Sequencial } = require("../../monitoria/JTE/sequencialJte");
const { Email } = require('../../lib/sendEmail');
const sleep = require('await-sleep');
const mensagens = require('../../assets/Monitoria/mensagens.json');
const { Verificador } = require("../../lib/verificaSequencial");


(async () => {
	// await Sequencial.onDB();
	try {
		await verificador();
		// await Sequencial.geraEmail();
	} catch (e) {
		console.log("Travei em algum ponto da verificação");
		await verificador()
		// await Sequencial.geraEmail();
	}
})()

async function verificador() {
	let teste = true;
	let data;
	let comarcas;
	let texto = "";
	let resumo = "";
	let ultimo;
	let atualizando;
	try {
		while (true) {
			data = new Date();
			console.log(data.getHours(), data.getMinutes());
			if (data.getHours() == 16) { teste = true }
			console.log(teste);
			if (data.getHours() == 17 && teste == true) {
				await Sequencial.onDB();
				// console.log(await Sequencial.geraEmail());
				comarcas = await Sequencial.geraEmail();
				ultimo = comarcas.filter((res) => {
					return res.status == "Ultimo Processo"
				})
				atualizando = comarcas.length - ultimo.length
				console.log(ultimo.length);
				resumo = `Possuimos ${comarcas.length} comarcas desatualizadas a mais de 7 dias,
				e destas comarcas ${ultimo.length}, sao ultimo processo e ${atualizando} estao atualizando. 
				Detalhes no link: http://172.16.16.38:3305/01`
				texto = JSON.stringify(comarcas)
				if (comarcas.length > 0) {
					await Email.send(mensagens.Comarcas.destinatarios, mensagens.Comarcas.titulo, resumo);
				}
				await sleep(5000)
				await Sequencial.offDB();
				// process.exit()
				teste = false
				console.log(teste);
			}
			await sleep(60000);
		}
	} catch (e) {
		await verificador()
	}
}
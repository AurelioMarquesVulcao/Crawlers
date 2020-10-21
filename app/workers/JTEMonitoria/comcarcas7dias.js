const { Sequencial } = require("../../monitoria/JTE/sequencialJte");
const { Email } = require('../../lib/sendEmail');
const sleep = require('await-sleep');
const mensagens = require('../../assets/Monitoria/mensagens.json');


(async () => {
	let data;
	let comarcas;
	let texto=""
	while (true) {
		data = new Date();
		console.log(data.getHours(), data.getMinutes());
		if (data.getHours() == 18 && data.getMinutes() == 24) {
			await Sequencial.onDB();
			// console.log(await Sequencial.geraEmail());
			comarcas = await Sequencial.geraEmail();
			texto = JSON.stringify(comarcas)
			// console.log(comarcas);
			// for (let i = 0; i < comarcas.length; i++) {
			// 	console.log(comarcas[i]);
			// 	texto += i//`${comarcas[i]} ; `
			// }
			console.log(texto);
			// await Email.send()
			await Email.send(mensagens.Comarcas.destinatarios,mensagens.Comarcas.titulo,texto);

			await sleep(5000)
			await Sequencial.offDB();

		}

		await sleep(60000);
	}


	// 	let data = new Date();
	// 		// Guarda cada pedaço em uma variável
	// 		let dia = data.getDate();           // 1-31
	// 		let dia_sem = data.getDay();        // 0-6 (zero=domingo)
	// 		let mes = data.getMonth();          // 0-11 (zero=janeiro)
	// 		let ano2 = data.getYear();           // 2 dígitos
	// 		let ano4 = data.getFullYear();       // 4 dígitos
	// 		let hora = data.getHours();          // 0-23
	// let min = data.getMinutes();        // 0-59
	// 	Sequencial.onDB();

	// 	Sequencial.offDB();
})()
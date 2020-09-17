
const async = require('async');
var teste2 = [];
var loop = 200000;
(async () => {
	console.time("entrou na tarefa de linha");
	let a = await teste()
	teste2.push(a)
	let b = await teste()
	teste2.push(b)
	let c = await teste()
	teste2.push(c)
	console.timeEnd("entrou na tarefa de linha");

	console.time("entrou na tarefa de promisse");
	Promise.all([
		teste(),
		teste(),
		teste()
	]).then(res => {
		teste2.push(res)
		console.timeEnd("entrou na tarefa de promisse");
	})

	console.time("entrou na tarefa de paralelo");
	async.parallel({
		one: function teste() {
			let teste1 = [];
			for (let i = 0; i < loop; i++) {
				teste1.push(makeid());
			}
			return teste1
		},
		two: function teste() {
			let teste1 = [];
			for (let i = 0; i < loop; i++) {
				teste1.push(makeid());
			}
			return teste1
		},
		thre: function teste() {
			let teste1 = [];
			for (let i = 0; i < loop; i++) {
				teste1.push(makeid());
			}
			return teste1
		}
	},
		function (err, results) {
			// 'results' is now equal to: {one: 1, two: 2, ..., something_else: some_value}
			teste2.push(results.one)
			teste2.push(results.two)
			teste2.push(results.thre)
		}
	);
	console.timeEnd("entrou na tarefa de paralelo");

})()

function makeid() {
	let text = "5ed9";
	let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
	for (var i = 0; i < 20; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}

async function teste() {
	let teste1 = [];
	for (let i = 0; i < loop; i++) {
		teste1.push(makeid());
	}
	return teste1
}



// async ()=>{
// teste()
// teste()
// teste()
// teste()
// await sleep(500000);
// }
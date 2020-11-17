// console.log(process.argv[0],process.argv[1],process.argv[2],process.argv[3]);
// console.log(process.argv);
const mongoose = require('mongoose');
const {LogDownload} = require('../../../models/schemas/jte');
const { enums } = require('../../../configs/enums');
// liga ao banco de dados


(async()=>{
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose.connection.on('error', (e) => {
    console.log(e);
  });
let message = {"lala":"lala"};

let messagemDownload = {
  numeroProcesso: "numeroProcesso",
	dataDownload: new Date,
	statusDownload: false,
	message:message
}

await new LogDownload(messagemDownload).save()
console.log( "enviei ao banco");
})()

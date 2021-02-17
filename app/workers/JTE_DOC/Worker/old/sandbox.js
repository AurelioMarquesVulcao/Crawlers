// console.log(process.argv[0],process.argv[1],process.argv[2],process.argv[3]);
// console.log(process.argv);
const mongoose = require('mongoose');
const { LogDownload } = require('../../../../models/schemas/jte');
const { enums } = require('../../../../configs/enums');
// liga ao banco de dados


(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose.connection.on('error', (e) => {
    console.log(e);
  });
  let message = { "lala": "lala" };
  let numeroProcesso = 1;
  await logInciniais(numeroProcesso, message)




  console.log("enviei ao banco");
})()


async function logInciniais(numeroProcesso, message) {
  let tentativa = 0;
  let verifica = await LogDownload.findOne({ "numeroProcesso": numeroProcesso });
  if (verifica) {
    tentativa = verifica.quantidadeTentativas + 1

  }
  console.log(verifica);

  let update = {
    numeroProcesso: numeroProcesso,
    dataDownload: new Date,
    statusDownload: false,
    message: message,
    quantidadeTentativas: tentativa
  };
  console.log(update);


  // await LogDownload.findOneAndUpdate({ "numeroProcesso": numeroProcesso }, update, {
  //   new: true,
  //   upsert: true
  // });
  await findUpdateSave(numeroProcesso, update)
}

async function findUpdateSave(numeroProcesso, update) {
  let filter = { "numeroProcesso": numeroProcesso };
  let verifica = await LogDownload.findOne(filter);
  if (!verifica) {
    return await new LogDownload(update).save()
  } else {
    await LogDownload.findOneAndUpdate(filter, update)
  }
}

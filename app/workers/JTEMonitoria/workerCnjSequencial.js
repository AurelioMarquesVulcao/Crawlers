const { Verificador } = require('../../lib/verificaSequencial');
const { Fila } = require('./getFila');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { Cnj } = require('../../lib/util');
const sleep = require('await-sleep');
const { Filas } = require('./criaFila');
const rabbit = new GerenciadorFila();

(async () => {
  let fila;
  let status;
  // setInterval(async function () {
  while (true){
    fila = await Fila.getFila()
    status = fila.find(element => element.nome == "ReprocessamentoJTE");
    
    if (status) {
      console.log(status);
      if (status.qtd < 100) {
        console.log("Entrou na busca");
        // await Filas()
        await rabbit.enfileirarLoteTRT("ReprocessamentoJTE", await Filas());
        await sleep(15000);
      }
    }
    await sleep(1000);


    console.log("A fila não consumiu...");
  }//, 1000);

})()


// Filas()
// await rabbit.enfileirarLoteTRT("ReprocessamentoJTE", resultado);

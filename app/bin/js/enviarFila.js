const { GerenciadorFila } = require("../../lib/filaHandler");
const { Helper } = require("../../lib/util");
const moment = require('moment');

const ajuda = () => {

  console.log('utilizacao: node bin/js/enviarFila [nome da fila]');

}

const identificarSeccional = (cnj) => {
  let seccional;  

  if (/\.8\.19\./.test(cnj))
    seccional = "RS";

  if (/\.8\.26\./.test(cnj))
    seccional = "SP";  

  if (/\.8\.21\./.test(cnj))
    seccional = "RS";

  return seccional;
}

(async () => {

  let args = process.argv;

  try {

    if (args.length == 0)
      throw Error("AJUDA");

    if (!args[1])
      throw Error("SEM_FILA")

    if (!args[2])
      throw Error("SEM_NUMERO_PROCESSO")

    if (!args[3])
      throw Error("SEM_OAB")          

    let mensagem = {
      "ExecucaoConsultaId": "123123",
      "ConsultaCadastradaId": "123123",
      "DataEnfileiramento": moment().toJSON(),
      "NumeroProcesso": args[2],
      "NumeroOab" : args[3],
      "SeccionalOab" : identificarSeccional(args[2])
    };

    new GerenciadorFila().enviar(args[4], mensagem);
  } catch (e) {
    console.log(e);
    ajuda();
  }

})();

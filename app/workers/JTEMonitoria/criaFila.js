const { Verificador } = require('../../lib/verificaSequencial');
const { getFilas } = require('../JTE/criadoresFila/get_fila');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { Cnj } = require('../../lib/util');
const sleep = require('await-sleep');

// const rabbit = new GerenciadorFila();

module.exports.Filas = async function Filas() {
  console.log("Iniciando processo de busca");
  try {
    await Verificador.onDB()
    let resultado = [];
    let tribunal;
    let comarca;
    let processo;
    const comarcas = await Verificador.buscaTodasComarcas();
    for (let i = 0; i < comarcas.length; i++) {
      tribunal = parseInt(comarcas[i].estadoNumero)
      comarca = parseInt(comarcas[i].comarca)
      console.log(" iniciando comarca.: ", tribunal, comarca);

      await Verificador.buscaProcessos(tribunal, comarca, 7)
        .then(res => {
          for (let ii = 0; ii < res.length; ii++) {
            console.log("Criando mensagem.:" + ii);
              resultado.push(Cnj.criaPostJTE(Cnj.organizaCNJ(res[ii], tribunal, comarca)))
          }
          console.log(" Mensagesn.: ", tribunal, comarca, "Criadas...");
        })
      // if (i == 50) {
      //   break
      // }
    }
    await Verificador.offDB()
    // console.log(resultado);
    return resultado

  } catch (e) {
    Filas
  }
}
const { modelNames } = require("mongoose");

require("../bootstrap");
const { FluxoController } = require('../lib/fluxoController');
const axios = require("axios").default;
const GerenciadorFila = require("../lib/filaHandler").GerenciadorFila;
const { ConsultasCadastradas } = require("../models/schemas/consultas_cadastradas");
const bigDataAddress = require("../configs/enums").enums.bigdataAddress;

const gerenciadorFila = new GerenciadorFila();

async function feedbackCadastroConsulta(mensagemObj) {
  const res = await axios
    .get(`${bigDataAddress}/consultaPublica/confirmarCadastro/${mensagemObj.CadastroConsultaId}`)
    .then(res => {
      return {
        data: res.data,
        error: null,
      };
    })
    .catch(err => {
      return {
        data: null,
        error: err,
      };
    });
  return res;
}

gerenciadorFila.consumir("cadastro_consulta", async (ch, mensagem) => {
  let tribunal;
  const mensagemObj = JSON.parse(mensagem.content);

  try {

    let consulta = await FluxoController.cadastrarConsulta(mensagemObj)

    if (!consulta) {
      const res = await feedbackCadastroConsulta(mensagemObj);

      if (res.data) {
        console.log(`Cadastro da consulta ${mensagemObj.CadastroConsultaId} no bigdata confirmado com sucesso!`);
      } else {
        throw res.err;
      }

    } else {
      console.log("Consulta já cadastrada no crawler.");
    }

  } catch (e) {
    console.log(e);
    console.error(`Consulta não registrada com sucesso: ${e.message}`);
  } finally {
    console.log(`Liberando mensagem ${mensagemObj.TipoConsulta === 'processo' ? mensagemObj.NumeroProcesso : mensagemObj.NumeroOab}!`);
    ch.ack(mensagem);
  }
});

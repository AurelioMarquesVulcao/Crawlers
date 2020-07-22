const { modelNames } = require("mongoose");

require("../bootstrap");
const axios = require("axios").default;
const GerenciadorFila = require("../lib/filaHandler").GerenciadorFila;
const { ConsultasCadastradas } = require("../models/schemas/consultas_cadastradas");
const bigDataAddress = require("../configs/enums").enums.bigdataAddress;

const gerenciadorFila = new GerenciadorFila();

const identificarDetalhes = (cnj) => {

  let tribunal;

  try {

    const cnjMascara = cnj.replace(/([0-9]{7})([0-9]{2})([0-9]{4})([0-9])([0-9]{2})([0-9]{4})/,
    '$1-$2.$3.$4.$5.$6');

    const numeroMatch = cnjMascara.match(/\.([0-9]{1}\.[0-9]{2})\./);

    if (numeroMatch) {
      const numeroSplit = numeroMatch[1].split('.');
      tribunal = {
        Orgao: parseInt(numeroSplit[0]),
        Tribunal: parseInt(numeroSplit[1])
      }
    }

  } catch(e) {
    console.log(e.message);
  }

  return tribunal;
}

gerenciadorFila.consumir("cadastro_consulta", async (ch, mensagem) => {
  
  const mensagemObj = JSON.parse(mensagem.content);

  try {

    const query = {
      NumeroOab: mensagemObj.NumeroOab,
      NumeroProcesso: mensagemObj.NumeroProcesso,
      TipoConsulta: mensagemObj.TipoConsulta,
      SeccionalOab: mensagemObj.SeccionalOab,
      Instancia: mensagemObj.Instancia
    };    

    const tribunal = identificarDetalhes(mensagemObj.NumeroProcesso);

    if (tribunal) {
      mensagemObj.Detalhes = tribunal;
    }

    const consulta = await ConsultasCadastradas.findOne(query);

    if (!consulta) {
      const consultaSalva = await new ConsultasCadastradas(mensagemObj).save();      
      mensagemObj.CadastroConsultaId = consultaSalva._id;
      console.log(`Criado documento com _id ${mensagemObj.CadastroConsultaId}`);
      const res = await axios
        .get(`${bigDataAddress}/consultaPublica/confirmarCadastro/${mensagemObj.CadastroConsultaId}`)
        .then(res => {
          return {
            data: res.data,
            error: null
          }
        })
        .catch(err => {
          return {
            data: null,
            error: err
          }
        });

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

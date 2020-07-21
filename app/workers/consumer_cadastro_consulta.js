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

    const cnjMascara = cnj
    .replace(/([0-9]{7})([0-9]{2})([0-9]{4})([0-9])([0-9]{2})([0-9]){4}/,
    '$1-$2.$3.$4.$5.$6');
  
    if (/\.5\.[0-9]{2}\./.test(cnjMascara)) { 
      let numeroMatch = cnjMascara.match(/5\.[0-9]{2}/);
  
      if (numeroMatch) {
        let numeroSplit = numeroMatch[0].split('.');
        tribunal = {
          Orgao: parseInt(numeroSplit[0]),
          Tribunal: parseInt(numeroSplit[1])
        }
      }
      
    }

  } catch(e) {
    console.log(e.message);
  }

  return tribunal;
}

gerenciadorFila.consumir("cadastro_consulta", async (ch, mensagem) => {
  try {
    const mensagemObj = JSON.parse(mensagem.content);

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
      console.log(`Criado documento com _id ${consultaSalva._id}`);
      axios
        .get(`${bigDataAddress}/consultaPublica/confirmarCadastro/${mensagemObj.CadastroConsultaId}`)
        .then(res => {
          console.log(res.data);
          console.log(`Confirmando cadastro da consulta ${mensagemObj.CadastroConsultaId}`);
        })
        .catch(err => {
          console.log(err);
          throw err;
        });
    } else {
      console.log("Consulta já cadastrada no crawler.");
    }

    // if (consulta) {
    //   console.log(query);
    //   console.log(consulta);
    //   console.log("Consulta já cadastrada no crawler.");
    //   // ch.ack(mensagem);
    //   return;
    // }

    // ConsultasCadastradas.create(mensagemObj)
    //   .then((doc) => {
    //     console.log(`Criado documento com _id ${doc._id}`);
    //     console.log(
    //       `Confirmando cadastro da consulta ${mensagemObj.CadastroConsultaId}`
    //     );

    //     axios
    //       .get(
    //         `${bigDataAddress}/consultaPublica/confirmarCadastro/${mensagemObj.CadastroConsultaId}`
    //       )
    //       .then((res) => console.log(res.data))
    //       .catch((err) => console.error("Erro: ", err));
    //   })
    //   .catch((err) => {
    //     console.error(`Consulta não registrada com sucesso: ${err}`);
    //   })
    //   .finally(() => ch.ack(mensagem));
  } catch (e) {
    console.error(`Consulta não registrada com sucesso: ${e}`);
    // console.error("Falha no parseamento da mensagem ", e);
    // ch.ack(mensagem);
    // return;
  } finally {
    console.log(`Liberando mensagem ${mensagem}!`);
    ch.ack(mensagem);
  }
});

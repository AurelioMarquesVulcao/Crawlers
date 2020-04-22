require("../bootstrap");
const axios = require("axios").default;
const GerenciadorFila = require("../lib/filaHandler").GerenciadorFila;
const ConsultasCadastradas = require("../models/schemas/consultas_cadastradas")
  .ConsultasCadastradas;

const gerenciadorFila = new GerenciadorFila();

gerenciadorFila.consumir("cadastro_consulta", async (ch, mensagem) => {
  try {
    const mensagemObj = JSON.parse(mensagem.content);

    const query = {
      NumeroOab: mensagemObj.NumeroOab,
      NumeroProcesso: mensagemObj.NumeroProcesso,
      TipoConsulta: mensagemObj.TipoConsulta,
      SeccionalOab: mensagemObj.SeccionalOab,
    };

    const consulta = await ConsultasCadastradas.findOne(query);

    if (consulta) {
      console.log("Consulta já cadastrada no crawler.");
      ch.ack(mensagem);
      return;
    }

    ConsultasCadastradas.create(mensagemObj)
      .then((doc) => {
        console.log(`Criado documento com _id ${doc._id}`);
        console.log(
          `Confirmando cadastro da consulta ${mensagemObj.CadastroConsultaId}`
        );

        axios
          .get(
            `http://192.168.99.100:8083/consultaPublica/confirmarCadastro/${mensagemObj.CadastroConsultaId}`
          )
          .then((res) => console.log(res.data))
          .catch((err) => console.error("Erro: ", err));
      })
      .catch((err) => {
        console.error(`Consulta não registrada com sucesso: ${err}`);
      })
      .finally(() => ch.ack(mensagem));
  } catch (e) {
    console.error("Falha no parseamento da mensagem ", e);
    ch.ack(mensagem);
    return;
  }
});

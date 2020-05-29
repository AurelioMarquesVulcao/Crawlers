const mongoose = require("mongoose");
const { enums } = require("../../configs/enums");
const { GerenciadorFila } = require("../../lib/filaHandler");
const { ExtratorFactory } = require("../../extratores/extratorFactory");
const { Extracao } = require("../../models/schemas/extracao");
const { Helper } = require("../../lib/util");
const { LogExecucao } = require('../../lib/logExecucao');

const logarExecucao = async (execucao) => {
  await LogExecucao.salvar(execucao);
}

(async () => {
  mongoose.connect(enums.mongo.address, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }); 

  mongoose.connection.on("error", (e) => {
    console.log(e);
  });

  const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.TJBAPortal}.extracao.novos`;

  new GerenciadorFila()
    .consumir(nomeFila, async (ch, msg) => {
    
    const mensagem = JSON.parse(msg.content.toString());

    try {
      const extrator = ExtratorFactory.getExtrator(nomeFila, true);
      const resultadoExtracao = await extrator.extrair(mensagem.NumeroDaOab);

      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        "BA"
      );
      const resposta = await Helper.enviarFeedback(
        extracao.prepararEnvio()
      ).catch((err) => {
        console.log("Erro detectado", err);
      });
      ch.ack(msg);
      console.log(resposta);
      
      await logarExecucao({ ...mensagem, status: 'OK' });
    } catch (e) {
      await logarExecucao({ ...mensagem, status: e.message, error: e.stack.replace(/\n+/,' ').trim() });
    }
  });
  
})();

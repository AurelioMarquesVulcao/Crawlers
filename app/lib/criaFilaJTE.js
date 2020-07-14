const GerenciadorFila = require('./filaHandler');




(async () => {
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  
    mongoose.connection.on("error", (e) => {
      console.log(e);
    });
  
    // const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.JTE}.extracao.novos`;
    const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-RJ`;
    const reConsumo = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-RJ`;

    new GerenciadorFila().enviar(nomeFila, message);
    new GerenciadorFila().enviar(reConsumo, message);
})()  

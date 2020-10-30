const mongoose = require('mongoose');
const { AplicacaoVar } = require('../models/schemas/variaveis');
const sleep = require('await-sleep');
const { enums } = require('../configs/enums');
const comarcas = require('../assets/jte/comarcascopy.json');
const banco = require('../controller/lib/banco.json');

// liga ao banco de dados
mongoose.connect(enums.mongo.connString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
  console.log(e);
});


const variaveis = {
  "aplicacao": "Calendario",
  "codigo": "000002",
  "origem": "controller",
  "variaveis": []
};
console.log(variaveis);

class VariaveisRobos {

  static async catch(busca){
    try {
      let resultado = await AplicacaoVar.findOne(busca)
      console.log("Dados salvos com sucesso!");
    } catch (e) {
      console.log("Erro ao atualizar os dados");
    }
    await sleep(1000);
    // Desliga Banco de dados
    // await mongoose.connection.close()
    return resultado
  }

  static async insert(variaveis) {
    try {
      await new AplicacaoVar(variaveis).save()
      // console.log(variaveis);
      console.log("Dados salvos com sucesso!");
    } catch (e) {
      console.log("Erro ao savar os doados");
    }
    await sleep(1000);
    // Desliga Banco de dados
    // await mongoose.connection.close()
  }

  /**
   * @param {object} busca objeto Ex.: => {"aplicacao": "criaFilaJte", "codigo": "000001"}
   * @param {object} variaveis exemplo abaixo
   */
  static async update(busca, variaveis) {
    try {
      await AplicacaoVar.findOneAndUpdate(busca, variaveis)
      console.log("Dados salvos com sucesso!");
    } catch (e) {
      console.log("Erro ao atualizar os dados");
    }
    await sleep(1000);
    // Desliga Banco de dados
    // await mongoose.connection.close()
  }

}
// Exemplo de Insert de dados
// const variaveis = {
//   "aplicacao": "criaFilaJte",
//   "codigo": "000001",
//   "origem": "JTE",
//   "variaveis": [
//     comarcas
//   ]
// };

// VariaveisRobos.insert(variaveis)
// VariaveisRobos.update({ "aplicacao": "criaFilaJte", "codigo": "000001" }, variaveis)
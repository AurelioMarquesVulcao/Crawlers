const mongoose = require('mongoose');
const { AplicacaoVar } = require('../models/schemas/variaveis');
const sleep = require('await-sleep');
const { enums } = require('../configs/enums');

// liga ao banco de dados
mongoose.connect(enums.mongo.connString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
  console.log(e);
});


const variaveis = {
  "aplicacao": "criaFilaJte",
  "codigo": "000001",
  "origem": "JTE",
  "variaveis": [
    {
      "rj": {
        "codigo": "01",
        "estado": "rj",
        "tempo": "1200",
        "comarcas": [
          "0000", "0001", "0002", "0003", "0004", "0005", "0006",
          "0007", "0008", "0009", "0010", "0011", "0012", "0013",
          "0014", "0015", "0016", "0017", "0018", "0019", "0020",
          "0021", "0022", "0023", "0024", "0025", "0026", "0027",
          "0028", "0029", "0030", "0031", "0032", "0033", "0034",
          "0035", "0036", "0037", "0038", "0039", "0040", "0041",
          "0042", "0043", "0044", "0045", "0046", "0047", "0048",
          "0049", "0050", "0051", "0052", "0053", "0054", "0055",
          "0056", "0057", "0058", "0059", "0060", "0061", "0062",
          "0063", "0064", "0065", "0066", "0067", "0068", "0069",
          "0070", "0071", "0072", "0073", "0074", "0075", "0076",
          "0077", "0078", "0079", "0080", "0081", "0082", "0201",
          "0202", "0203", "0204", "0205", "0206", "0207", "0221",
          "0222", "0223", "0224", "0225", "0226", "0227", "0241",
          "0242", "0243", "0244", "0245", "0246", "0247", "0248",
          "0261", "0262", "0263", "0264", "0265",
          "0266", "0281", "0282", "0283", "0284",
          "0301", "0302", "0321", "0322", "0323",
          "0341", "0342", "0343", "0401", "0411",
          "0421", "0431", "0432", "0441", "0451",
          "0452", "0461", "0462", "0471", "0481",
          "0482", "0483", "0491", "0501", "0511",
          "0512", "0521", "0522", "0531", "0541",
          "0551", "0561", "0571", "0581"
        ]
      }
    }
  ]
};

async function insert(variaveis) {
  // const insert = await statusEstadosJTE.findOne({ "numeroUltimoProcecesso": numero });
  try {
    await new AplicacaoVar(variaveis).save()
    console.log(variaveis);
  } catch (e) {
    console.log("erro no save");
  }

  await sleep(5000);
}
insert(variaveis)
/**
 * 
 * @param {object} busca objeto Ex.: => {"aplicacao": "criaFilaJte", "codigo": "000001"}
 * @param {object} variaveis exemplo abaixo
 */
async function update(busca, variaveis) {
  await statusEstadosJTE.findOneAndUpdate(busca, variaveis)
}

// Model
// {
//   "aplicacao": "criaFilaJte",
//     "codigo": "000001",
//       "origem": "JTE",
//         "variaveis": [
//           {
//             "rj": {
//               "codigo": "01",
//               "estado": "rj",
//               "tempo": "1200",
//               "comarcas": [
//                 "0000", "0001", "0002", "0003", "0004", "0005", "0006",
//                 "0007", "0008", "0009", "0010", "0011", "0012", "0013",
//                 "0014", "0015", "0016", "0017", "0018", "0019", "0020",
//                 "0021", "0022", "0023", "0024", "0025", "0026", "0027",
//                 "0028", "0029", "0030", "0031", "0032", "0033", "0034",
//                 "0035", "0036", "0037", "0038", "0039", "0040", "0041",
//                 "0042", "0043", "0044", "0045", "0046", "0047", "0048",
//                 "0049", "0050", "0051", "0052", "0053", "0054", "0055",
//                 "0056", "0057", "0058", "0059", "0060", "0061", "0062",
//                 "0063", "0064", "0065", "0066", "0067", "0068", "0069",
//                 "0070", "0071", "0072", "0073", "0074", "0075", "0076",
//                 "0077", "0078", "0079", "0080", "0081", "0082", "0201",
//                 "0202", "0203", "0204", "0205", "0206", "0207", "0221",
//                 "0222", "0223", "0224", "0225", "0226", "0227", "0241",
//                 "0242", "0243", "0244", "0245", "0246", "0247", "0248",
//                 "0261", "0262", "0263", "0264", "0265",
//                 "0266", "0281", "0282", "0283", "0284",
//                 "0301", "0302", "0321", "0322", "0323",
//                 "0341", "0342", "0343", "0401", "0411",
//                 "0421", "0431", "0432", "0441", "0451",
//                 "0452", "0461", "0462", "0471", "0481",
//                 "0482", "0483", "0491", "0501", "0511",
//                 "0512", "0521", "0522", "0531", "0541",
//                 "0551", "0561", "0571", "0581"
//               ]
//             }
//           }
//         ]
// }

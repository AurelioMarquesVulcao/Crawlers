require('../../bootstrap');
const mongoose = require('mongoose');
const { ConsultasCadastradas } = require('../../models/schemas/consultas_cadastradas');

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

(async () => {  

  const consultas = await ConsultasCadastradas.find({
    TipoConsulta: 'processo'
  });

  for (let i = 0, si = consultas.length; i < si; i++) {
    const consulta = consultas[i];
    const detalhes = identificarDetalhes(consultas[i].NumeroProcesso);

    if (detalhes) {      
      console.log(`${i+1}|${consulta._id}|${consulta.NumeroProcesso}|${detalhes.Orgao}|${detalhes.Tribunal}`);
      await ConsultasCadastradas.updateOne({_id: mongoose.Types.ObjectId(consulta._id)}, {
        $set: {
          Detalhes: detalhes 
        }
      });
      console.log(`${i+1}|${consulta._id}|${consulta.NumeroProcesso}|${detalhes.Orgao}|${detalhes.Tribunal}|OK`);      
    } else {
      console.log('Não conseguiu identificar os detalhes');
    }

  }

})();
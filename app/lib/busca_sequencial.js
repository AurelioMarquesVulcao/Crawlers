const MongoClient = require('mongodb').MongoClient;
const moment = require('moment')
const ObjectId = require('mongoose/lib/types/objectid');
const CONNECTION_URL_BDV2 = 'mongodb://admin:admin@bigrj01mon01:19000,bigrj01mon02:19001,bigrj01mon03:19000/bigDataV2?authSource=admin&replicaSet=rsBigData&readPreference=primary&appname=MongoDB%20Compass&ssl=false'

module.exports.buscar_sequencial = async (tribunalExplicito, ano) => {
  let tribunal = tribunalFactory[tribunalExplicito];
  return new Promise((resolve, reject) => {
    {

      if (!tribunal) throw new Error('Tribunal invalido');

      if (!ano) throw new Error('Ano não informado');

      MongoClient.connect(CONNECTION_URL_BDV2, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }, function(err, client) {
        if (err) {
          console.log(err);
          throw err;
        };

        console.log('Conectado ao servidor');

        const db = client.db('bigDataV2');

        let comarcas = consultar(db, tribunal)
          .then(res => {
            console.log(res.length);
            client.close();
            return res
          }).catch( err => {
            throw new Error(err);
          });

        resolve(comarcas);

      })

    }
  })
}

let consultar = (db, tribunal) => {
  return new Promise((resolve, reject) => {
    const collection = db.collection('processo');

    let data = moment().subtract(1, 'month');
    data = data.format('YYYY-MM-DD');

    let OBJ_ID = ObjectId(Math.floor((new Date(data))/1000).toString(16) + "0000000000000000");

    collection.aggregate([
      {'$match': {
          '_id': {'$gt': OBJ_ID},
          'CnjDetalhes.Ano': 2020,
          'CnjDetalhes.OrgaoJustica': tribunal.orgao,
          'CnjDetalhes.Tribunal': tribunal.tribunal,
        }},
      {
        '$group': {
          '_id': '$CnjDetalhes.UnidadeOrigem',
          'UltimoSequencial': {'$max': '$CnjDetalhes.NumeroSequencial'},
          'CNJ': {'$max': '$NumeroCNJ'}
        }
      },
      {
        '$project': {
          '_id':0,
          'UnidadeOrigem': '$_id',
          'UltimoSequencial': 1,
          'CNJ': 1
        }
      }])
      .toArray(function(err, docs){
        if (err) reject(err);
        console.log('consulta bem sucedida');
        resolve(docs)
    })
  })
}

const tribunalFactory = {
  'TJRS': {
    tribunal: 21,
    orgao: 8
  },
  'TJSP': {
    tribunal: 26,
    orgao: 8
  }
}
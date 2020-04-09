require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');

const { Processo } = require('./models/schemas/processo');
const { Andamento } = require('./models/schemas/andamento');
const axios = require('axios');

const port = process.env.API_PORT || '3133';
const app = express();

app.get('/', (req, res) => {
  Processo.countDocuments({}, function (err, result) {
    if (err) {
      console.log(err);
      res.status(220).send(err);
    }
    res.status(200).send(`${result} Processos cadastrados`);
  });
});

app.get('/teste', async (req, res) => {
  const options = {
    url: 'http://www5.tjba.jus.br/portal/',
    method: 'GET',
  };
  axios(options)
    .then((response) => {
      res.status(200).send(response.data);
    })
    .catch((err) => {
      res.status(200).send(err);
    });
});

app.get('/getProcesso', (req, res) => {
  Processo.findOne(
    { 'detalhes.numeroProcesso': req.query.numeroProcesso },
    function (err, result) {
      if (err) {
        console.log(err);
        res.status(220).send(err);
      }
      let resposta = result.toJSON();
      Andamento.find({ numeroProcesso: req.query.numeroProcesso }, function (
        err,
        result
      ) {
        if (err) {
          console.log(err);
          res.status(220).send(err);
        }
        let andamentos = result.map((element, index) => {
          return element.toJSON();
        });
        resposta.andamentos = andamentos;
        res.status(200).send(resposta);
      });
    }
  );
});

mongoose.connect(
  `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@mongodb/admin`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.listen(3300, () => {
  console.log(`API rodando em: http://localhost:${port}`);
  console.log();
});

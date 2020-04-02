require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');

const { Processo } = require('./models/schemas/processo');

const port = process.env.API_PORT || '3133';
const app = express();

app.get('/', (req, res) => {
  Processo.countDocuments({}, function(err, result) {
    if (err) {
      console.log(err);
      res.status(220).send(err);
    }
    res.status(200).send(`${result} Processos cadastrados`);
  });
});

mongoose.connect(
  `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@mongodb/admin`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

app.listen(3300, () => {
  console.log(`API rodando em: http://localhost:${port}`);
  console.log();
});

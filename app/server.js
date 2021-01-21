require('dotenv').config();

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const { ProcessoController } = require('./api/controller/processoController');

const { enums } = require('./configs/enums');

const routes = require('./api/routes/routes');

const port = process.env.API_PORT || '3133';
const app = express();

app.use(bodyParser.urlencoded({ limit: '500mb', extended: true }));
app.use(bodyParser.json({ limit: '500mb' }));
app.use('/api', routes);

console.log(enums.mongo.connString);

mongoose.connect(enums.mongo.connString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.listen(port, () => {
  console.log(`API rodando em: http://localhost:${port}`);
});

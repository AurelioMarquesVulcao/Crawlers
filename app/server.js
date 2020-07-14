require("dotenv").config();

const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");

const { Processo } = require("./models/schemas/processo");
const { Andamento } = require("./models/schemas/andamento");
const { enums } = require("./configs/enums");
const axios = require("axios");

const routes = require("./api/routes/routes");

const port = process.env.API_PORT || "3133";
const app = express();

app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  Processo.countDocuments({}, function (err, result) {
    if (err) {
      console.log(err);
      res.status(220).send(err);
    }
    res.status(200).send(`${result} Processos cadastrados`);
  });
});

app.get("/getProcesso", (req, res) => {
  Processo.findOne(
    { "detalhes.numeroProcesso": req.query.numeroProcesso },
    function (err, result) {
      if (err) {
        console.log(err);
        res.status(220).send(err);
      }
      console.log('resposta', result);
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

app.get("/getAndamentos", (req, res) => {
  Andamento.retornaAndamentos(req.query.numeroProcesso).then((andamentos) => {
    res
      .status(200)
      .send({ processo: req.query.numeroProcesso, andamentos: andamentos });
  });
});

app.use("/api", routes);

// `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@mongodb/admin`,

mongoose.connect(enums.mongo.connString, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

app.listen(port, () => {
  console.log(`API rodando em: http://localhost:${port}`);
  console.log();
});

require("dotenv").config();
const mongoose = require("mongoose");

if (!process.env.MONGO_CONNECTION_STRING)
  throw Error("MONGO_CONNECTION_STRING é uma variável obrigatória");

if (!process.env.RABBITMQ_CONNECTION_STRING)
  throw Error("RABBITMQ_CONNECTION_STRING é uma variável obrigatória");

mongoose.connect(
  `${process.env.MONGO_CONNECTION_STRING}/${process.env.MONGO_DATABASE}`,
  { useNewUrlParser: true, useUnifiedTopology: true }
);

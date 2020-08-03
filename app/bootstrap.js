require("dotenv").config();
const enums = require("./configs/enums").enums;
const mongoose = require("mongoose");

if (!process.env.MONGO_CONNECTION_STRING)
  throw Error("MONGO_CONNECTION_STRING é uma variável obrigatória");

if (!process.env.RABBITMQ_CONNECTION_STRING)
  throw Error("RABBITMQ_CONNECTION_STRING é uma variável obrigatória");
  
mongoose.connect(enums.mongo.connString, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

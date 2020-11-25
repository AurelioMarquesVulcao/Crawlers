const express = require("express");
const db = require("./database/config");
const mongoose = require("mongoose");
const cors = require("cors");

class App {
  constructor() {
    this.express = express();
    
    this.database();
    this.middlewares();
    this.routes();
    
    // use o numero final do seu servidor após o 33
    this.express.listen(3338, () =>
      console.log(`Sua API REST está funcionando na porta 3338 `)
    );
  }

  database() {
    mongoose.connect(db.uri2, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }

  middlewares() {
    this.express.use(express.json());
    this.express.use(cors());
  }

  routes() {
    this.express.use(require("./routes"));
  }
}
module.exports = new App().express;
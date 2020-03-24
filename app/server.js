require('dotenv').config();

const mongoose = require('mongoose');
const express = require("express");

const port = process.env.API_PORT || "3133";
const app = express();

app.get("/", (req, res) => {
    res.status(200).send("VAZIO");
})

// mongoose.connect(
//     `mongodb://${process.env.MONGO_ROOT_USERNAME}:${process.env.MONGO_ROOT_PASSWORD}@mongodb/admin`,
//     {useNewUrlParser: true,  useUnifiedTopology: true}
// );


app.listen(3300, () => {
    console.log(`API rodando em: http://localhost:${port}`);
    console.log();
})
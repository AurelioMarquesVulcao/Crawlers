require('dotenv/config');

const express = require("express");

const port = process.env.API_PORT || "3133";
const app = express();

app.get("/", (req, res) => {
    res.status(200).send("VAZIO");
})

app.listen(port, () => {
    console.log(`API rodando em: http://localhost:${port}`);
    console.log();
})
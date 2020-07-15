const mongoose = require("mongoose");
const re = require('xregexp');

const { enums } = require("../configs/enums");
const { GerenciadorFila } = require("./filaHandler");
const { ExtratorFactory } = require("../extratores/extratorFactory");
const { Extracao } = require("../models/schemas/extracao");
const { Helper, Logger } = require("./util");
const { LogExecucao } = require("./logExecucao");
const { Andamento } = require('../models/schemas/andamento');
const { BaseException, RequestException, ExtracaoException, AntiCaptchaResponseException, } = require('../../models/exception/exception');
const { ExtratorBase } = require('../extratores/extratores');
const { JTEParser } = require('../parsers/JTEParser');




(async () => {
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  
    mongoose.connection.on("error", (e) => {
      console.log(e);
    });
  
    
    const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-RJ`;
    const reConsumo = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-RJ`;

    //new GerenciadorFila().enviar(nomeFila, message);
    //new GerenciadorFila().enviar(reConsumo, message);
})()  

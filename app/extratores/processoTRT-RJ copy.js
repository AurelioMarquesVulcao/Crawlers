const mongoose = require('mongoose');
const cheerio = require('cheerio');
const shell = require('shelljs');
const sleep = require('await-sleep');
const re = require('xregexp');
const fs = require('fs');
const querystring = require('querystring');
const axios = require('axios');

const { Robo } = require("../lib/robo");
const { enums } = require('../configs/enums');
const { GerenciadorFila } = require('../lib/filaHandler');
const { ExtratorFactory } = require('../extratores/extratorFactory');
const { Extracao } = require('../models/schemas/extracao');
const { Helper, Logger, Cnj } = require('../lib/util');
const { LogExecucao } = require('../lib/logExecucao');
const { Andamento } = require('../models/schemas/andamento');
const { ExtratorBase } = require('../extratores/extratores');
const { JTEParser } = require('../parsers/JTEParser');
const { RoboPuppeteer3 } = require('../lib/roboPuppeteer');
const { CriaFilaJTE } = require('../lib/criaFilaJTE');
const desligado = require('../assets/jte/horarioRoboJTE.json');

class ExtratorTrtrj {
  constructor(url, isDebug) {
    // super(url, isDebug);
    this.robo = new Robo();
    this.url = `https://pje.trt1.jus.br/pje-consulta-api`;
    // this.dataSiteKey = '6LcX22AUAAAAABvrd9PDOqsE2Rlj0h3AijenXoft';

  }
  /**
   * Executa a extração da capa do cnj desejado.
   * @param {string} cnj Numero de processo a ser buscado.
   */
  async extrair(cnj) {

  }
  async captura(header, cnj) {
    let objResponseCapcha = await this.robo.acessar({
      // url: `${this.url}/api/processos/dadosbasicos/${cnj}`,
      url: "http//google.com",
      usaProxy: false,
    })
    console.log(await objResponseCapcha.responseBody);
    console.log("Ativei captura");
  }

}
(async () => {
  console.log("Teste");
  new ExtratorTrtrj().captura("", "01006283220205010005")
  process.exit()
})()
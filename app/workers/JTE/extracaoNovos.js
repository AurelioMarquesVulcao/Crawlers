const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const fs = require('fs');
const axios = require('axios');

const { enums } = require("../../configs/enums");
const { GerenciadorFila } = require("../../lib/filaHandler");
const { ExtratorFactory } = require("../../extratores/extratorFactory");
const { Extracao } = require("../../models/schemas/extracao");
const { Helper, Logger } = require("../../lib/util");
const { LogExecucao } = require('../../lib/logExecucao');
const { RoboPuppeteer } = require('../../lib/roboPuppeteer')
const { Andamento } = require('../../models/schemas/andamento');
const { BaseException, RequestException, ExtracaoException, AntiCaptchaResponseException, } = require('../../models/exception/exception');
const { ExtratorBase } = require('../../extratores/extratores');
const { JTEParser } = require('../../parsers/JTEParser');

/**
 * Logger para console e arquivo
 */
let logger;



const logarExecucao = async (execucao) => {
  await LogExecucao.salvar(execucao);
}

class RoboPuppeteer_3 {
  async iniciar() {
    // para abrir o navegador use o headless: false
    this.browser = await puppeteer.launch({
      headless: false,
      slowMo: 60,
      ignoreHTTPSErrors: true,
      args: ['--ignore-certificate-errors']
    });
    this.page = await this.browser.newPage();
    this.acessar('http://www.google.com');
  }

  async acessar(url) {
    let content;
    try {
      //console.log(params);
      await this.page.goto(url, {
        waitUntil: "load",
        timeout: 0,
        waitUntil: 'networkidle2'
      });
      // isso me da o url completo
      //content = await this.page.content();
      // provisório
      content = true
    } catch (e) {
      console.log(e);
      process.exit();
    }
    return content;
  }

  async preencheTribunal(numero) {
    await console.log(`info: JTE - CNJ: ${numero} - Puppeteer entrou na pagina => https://jte.csjt.jus.br/`);
    // para esperar carregar o elemento onde fica o tribunal
    await this.page.waitFor(900)
    await this.page.waitFor('mat-form-field');
    await this.page.waitFor(900)
    await this.page.waitFor('#mat-select-1 > div > div.mat-select-arrow-wrapper')
    await this.page.waitFor(900)
    await this.page.click('#mat-select-1 > div > div.mat-select-arrow-wrapper')
    await this.page.waitFor(900)
    await this.page.click(`#mat-option-${escolheEstado(numero)}`)
    await this.page.click('ng-component > div.botoesAcao.mat-dialog-actions > button:nth-child(2) > span')
    await this.page.waitFor(1200)
    //await this.page.waitFor('#consultaProcessual')
    await this.page.click('#consultaProcessual')
  }


  async preencheProcesso(numero, contador) {
    let entrada = processaNumero(numero)
    //await this.page.click('#consultaProcessual')
    await this.page.waitFor(600)
    await this.page.waitFor('#campoNumeroProcesso')
    // const input1 = await this.page.$('#campoNumeroProcesso');
    await this.page.click('#campoNumeroProcesso', { clickCount: 3 })
    await this.page.type('#campoNumeroProcesso', `${entrada.numeroprocesso}`)

    const input2 = await this.page.$('#campoAno');
    await input2.click({ clickCount: 3 })

    await this.page.type('#campoAno', `${entrada.ano}`)

    const input3 = await this.page.$('#campoVara');
    await input3.click({ clickCount: 3 })

    await this.page.type('#campoVara', `${entrada.vara}`)
    await this.page.click('#consulta > ion-row > ion-col:nth-child(1) > mat-card > div > form > ion-button')

    //await page.waitFor('#mat-tab-content-0-0 > div > detalhes-aba-geral > div')
    await this.pegaHtml(contador,numero)
  }


  async pegaHtml(contador,numero) {
    //const contador = 0

    await this.page.waitFor('#listaProcessoEncontrado > mat-tab-group > div')

    console.log(contador);

    await this.page.waitFor(`#mat-tab-content-${contador}-0 > div > detalhes-aba-geral > div`)
    // se o processo existir pego os dados gerais.
    let html1 = await this.page.evaluate(() => {

      let text = document.querySelector('html').innerHTML;
      return text
    })
    await console.log(`info: JTE - CNJ: ${numero} - html da capa do processo extraido do Puppeteer`);

    const divButon = '#listaProcessoEncontrado > mat-tab-group > mat-tab-header > div.mat-tab-label-container > div > div'
    // #listaProcessoEncontrado > mat-tab-group > mat-tab-header
    await this.page.click(`#mat-tab-label-${contador}-1`)
    //await page.click(divButon)[0].children[1]
    await this.page.waitFor('#divMovBrowser1 > ion-grid > ion-row > ion-col')
    // pego os andamentos do processo
    let html2 = await this.page.evaluate(() => {

      let text = document.querySelector('html').innerHTML;
      return text
    })
    await console.log(`info: JTE - CNJ: ${numero} - html dos andamentos extraido do Puppeteer`);
    // await page.close()
    //await browser.close()
    return { geral: html1, andamentos: html2 }
  }


  async fechar() {
    await this.browser.close();
  }
}


class ProcJTE extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new JTEParser();
    this.pupp = new RoboPuppeteer_3()
    this.dataSiteKey = '6LfDrDsUAAAAAOpZjoH4CP7G3_NJR1ogyeRFlOzR';
  }


  async extrair(numeroProcesso) { 
    // let numeroProcesso = NumeroOab
    let dadosProcesso;
    try {

      logger = new Logger(
        'info',
        'logs/ProcJTE/ProcJTE.log', {
        nomeRobo: enums.nomesRobos.JTE,
        numeroProcesso: numeroProcesso,
      }
      );

      
      
      // let objResponse = await this.pupp.preencheProcesso(numeroProcesso)

      //Estou carregando paginas locais até resolver o Puppeteer.
      let $ = cheerio.load(objResponse.geral);
      let $2 = cheerio.load(objResponse.andamentos);
      dadosProcesso = this.parser.parse($, $2)
      var processo = dadosProcesso.processo
      await dadosProcesso.processo.salvar()
      await Andamento.salvarAndamentos(dadosProcesso.andamentos)
    } catch (e) {
      //console.log(e);
    }

    //  usar return simples apenas para dev
    logger.info('Processos extraidos com sucesso');
    if (!!dadosProcesso){
      return {
        resultado: dadosProcesso,
        sucesso: true,
        detalhes: '',
        logs: logger.logs
      };
    }
    

  } // End extrair function


} // End  class TJPR


(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  mongoose.connection.on("error", (e) => {
    console.log(e);
  });

  // const nomeFila = `${enums.tipoConsulta.Oab}.${enums.nomesRobos.JTE}.extracao.novos`;
  const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-RJ`;
  const reConsumo = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-RJ`;
  
  let puppet = new RoboPuppeteer();

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    const dataInicio = new Date();
    let message = JSON.parse(msg.content.toString());
    let logger = new Logger(
      'info',
      'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      NumeroDoProcesso: message.NumeroProcesso,
    }
    );
    try {
      logger.info('Mensagem recebida');
      //const extrator = ExtratorFactory.getExtrator(nomeFila, true);

      logger.info('Iniciando processo de extração');
      

      await puppet.iniciar()


      const resultadoExtracao = {}
      // const resultadoExtracao = await extrator.extrair(message.NumeroProcesso);
      // const resultadoExtracao = extrator.extrair(message.NumeroProcesso)
      console.log(resultadoExtracao);
      
      // testa se a extração ocorreu corretamente
      resultadoExtracao.length
      
      logger.logs = [...logger.logs, ...resultadoExtracao.logs];
      logger.info('Processo extraido');
      let extracao = await Extracao.criarExtracao(
        message,
        resultadoExtracao,
        message.SeccionalProcesso
      );
      logger.info('Resultado da extracao salva');

      logger.info('Enviando resposta ao BigData');
      const resposta = await Helper.enviarFeedback(
        extracao.prepararEnvio()
      ).catch((err) => {
        console.log(err);
        throw new Error(`JTE - Erro ao enviar resposta ao BigData - Processo: ${message.NumeroProcesso}`)
      });
      logger.info('Resposta enviada ao BigData');
      logger.info('Reconhecendo mensagem ao RabbitMQ');

      logger.info('Mensagem reconhecida');
      logger.info('Finalizando processo');
      // tentar reativar codigo
      // await logarExecucao({
      //   Mensagem: message,
      //   DataInicio: dataInicio,
      //   DataTermino: new Date(),
      //   status: 'OK',
      //   logs: logger.logs,
      //   NomeRobo: enums.nomesRobos.JTE
      // });

      ch.ack(msg);
    } catch (e) {
      console.log(e);
      
      // envia a mensagem para a fila de reprocessamento
      new GerenciadorFila().enviar(reConsumo, message);

      logger.info('Encontrado erro durante a execução');
      // trata erro especifico para falha na estração
      let error01 = "TypeError: Cannot read property 'length' of undefined at /app/workers/JTE/extracaoNovos_Sp_2.js:48:25 at async /app/lib/filaHandler.js:96:11";
      if (e = error01) {
        logger.info(erro01 = "\033[31m" + 'Extração Falhou')
      }
      logger.info(`Error: ${e.message}`);
      logger.info('Reconhecendo mensagem ao RabbitMQ');

      logger.info('Mensagem reconhecida');
      logger.info('Finalizando proceso');
      console.log(message.LogConsultaId);

      // await logarExecucao({
      //   LogConsultaId: message.LogConsultaId,
      //   Mensagem: message,
      //   DataInicio: dataInicio,
      //   DataTermino: new Date(),
      //   status: e.message,
      //   error: e.stack.replace(/\n+/, ' ').trim(),
      //   logs: logger.logs,
      //   NomeRobo: enums.nomesRobos.JTE
      // });
      ch.ack(msg);
    }

  });

})();

//---------- funcoes complementares de tratamento--------------

function escolheEstado(numero) {
  let resultado;
  numero = numero.slice(numero.length - 6, numero.length - 4)
  if (numero == 01) resultado = 2     // Rio de Janeiro
  if (numero == 02 || numero == 05) resultado = 03    // São Paulo
  if (numero == 21) resultado = 22    // Rio Grande do Norte
  if (numero == 15) resultado = 16    // São Paulo
  if (numero == 03) resultado = 4    // São Paulo
  return resultado
}
function processaNumero(numero) {
  let numeroProcesso = numero.trim().slice(0, 7);
  let ano = numero.trim().slice(9, 13);
  let vara = numero.trim().slice(numero.length - 4, numero.length);
  return {
    numeroprocesso: numeroProcesso,
    ano: ano,
    vara: vara
  }
}
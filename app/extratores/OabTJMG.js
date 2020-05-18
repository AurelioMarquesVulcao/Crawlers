const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');
const { Helper } = require('../lib/util');
const { antiCaptchaHandler } = require('../lib/captchaHandler');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');
const {
  BaseException,
  RequestException,
  ExtracaoException,
  AntiCaptchaResponseException,
} = require('../models/exception/exception');
const { ExtratorBase } = require('./extratores');
const { TJMGParser } = require('../parsers/TJMGParser');

class OabTJMG extends ExtratorBase {
  constructor(url, isDebug) {
    super(url, isDebug);
    this.parser = new TJMGParser();
  }

  async acessarComarca(numeroOab, tipoOab, comarcaCode, cookies) {
    let objResponse = await this.robo.acessar(
      `https://www4.tjmg.jus.br/juridico/sf/proc_resultado_oab.jsp?nomeAdvogado=&codigoOAB=${numeroOab}&tipoOAB=${tipoOab}&ufOAB=MG&tipoConsulta=1&natureza=0&ativoBaixado=X&dataAudienciaFinal=&comrCodigo=${comarcaCode}&numero=1`,
      'GET',
      'latin1',
      false,
      false,
      null,
      {
        Host: ' www4.tjmg.jus.br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Site': 'same-origin',
        'Sec-Fetch-Mode': 'navigate',
        Referer:
          'https://www4.tjmg.jus.br/juridico/sf/proc_oab.jsp?comrCodigo=0024&cbo_nome_comarca=24&numero=1',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7,la;q=0.6',
        Cookie: cookies,
      }
    );

    let $ = cheerio.load(objResponse.responseBody);
    const captchaImageUrl = $('#captcha_image').attr('src'); // https://www4.tjmg.jus.br/juridico/sf/
    const captchaStream = await Helper.downloadImage(captchaImageUrl);
    return; // TODO fazer chamadas para o sites com as comarcas
  }

  async extrair(numeroDaOab) {
    const tipo = numeroDaOab[numeroDaOab.length - 1];
    numeroDaOab = numeroDaOab.slice(0, numeroDaOab.length - 1);
    try {
      // TODO tratar oab separando numero da letra
      const resultados = [];
      const preParse = {};
      let cookies = {};

      let objResponse = {};

      // Primeira parte: pegar cookies e ids de sessao
      objResponse = await this.robo.acessar(
        this.url,
        'GET',
        'latin1',
        false,
        false,
        null
      );
      console.log('finalizado request');
      cookies = objResponse.cookies;
      cookies = cookies.map((element) => {
        return element.replace(/\;.*/, '');
      });
      cookies = cookies.join('; ');

      // Segunda parte, realizar um forloop dentro de todas as comarcas
      const $ = cheerio.load(objResponse.responseBody);
      // let comarcasDisponiveis = $('#cbo_nome_comarca')
      //   .children()
      //   .map((index, element) => element.attribs.value);
      // if (comarcasDisponiveis.length === 0) {
      //   throw Error('Não foi possivel encontrar as comarcas disponiveis');
      // }
      // comarcasDisponiveis = comarcasDisponiveis.filter(Number);
      // const promessas = comarcasDisponiveis.map((comarcaCode) => {});
      await this.acessarComarca(numeroDaOab, 'N', '24', cookies);

      return {
        resultado: [],
        sucesso: false,
        detalhes: 'Lista de processos vazia',
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports.OabTJMG = OabTJMG;

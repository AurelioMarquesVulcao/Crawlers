const cheerio = require('cheerio');
const moment = require('moment');

const { BaseParser } = require('./BaseParser');

// parser => processo

class TJBAPortalParser extends BaseParser {
  /**
   * TJBAPortalParser
   */
  constructor() {
    super();
  }

  extrairCapa($) {}

  extrairAssunto($) {}

  extrairEnvolvidos($) {}

  extrairAndamentos($, dataAtual) {}

  parse(content) {
    const $ = cheerio.load(content);
    const dataAtual = moment().format('YYYY-MM-DD');

    const jsonCapa = this.extrairCapa($);
    const jsonEnvolvidos = this.extrairEnvolvidos($);
    const jsonAndamentos = this.extrairAndamentos($, dataAtual);
  }
}

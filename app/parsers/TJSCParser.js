const cheerio = require('cheerio');
const moment = require('moment');
const re = require('xregexp');

const { BaseParser, removerAcentos, tradutor } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
const { Andamento } = require('../models/schemas/andamento');

class TJSCParser extends BaseParser {
  constructor() {
    super();
  }

  parse(content) {


    return {
      processo: 'processo',
      andamentos: 'andamentos'
    }
  }
}

module.exports.TJSCParser = TJSCParser;
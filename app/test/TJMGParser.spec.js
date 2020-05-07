const chai = require('chai');
const subset = require('chai-subset');
const fs = require('fs');
const moment = require('moment');

const { TJMGParser } = require('../parsers/TJMGParser');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

describe('TESTE TJMG', () => {
  describe('Teste Parser TJMG: 84570266920028130024', () => {});
});

const chai = require('chai');
const subset = require('chai-subset');
const moment = require('moment');
const fs = require('fs');

const { TJRSParser } = require('../parsers/TJRSParser');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

describe('Robo TJRS', () => {
  describe('Extração de Processos', () => {
    const resultado = require('./testCases/TJRS/50146482620198217000_resultado.json');
    let rawCapa = fs.readFileSync('test/testCases/TJRS/50146482620198217000_capa.html', 'utf-8');
    let rawEnvolvidos = fs.readFileSync('test/testCases/TJRS/50146482620198217000_partes.html', 'utf-8');
    let rawAndamentos = fs.readFileSync('test/testCases/TJRS/50146482620198217000_movimentos.html', 'utf-8');

    const extracao = new TJRSParser().parse(
      rawCapa,
      rawEnvolvidos,
      rawAndamentos
    );

    it('capa', () => {
      const capa = extracao.processo.capa.toJSON();
      chai.expect(resultado.capa).to.eql(capa);
    });
  });
});

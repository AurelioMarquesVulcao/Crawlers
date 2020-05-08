const chai = require('chai');
const subset = require('chai-subset');
const fs = require('fs');
const moment = require('moment');

const { TJMGParser } = require('../parsers/TJMGParser');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

describe('TESTE DO TJMG', () => {
  describe('Teste Parser TJMG: 84570266920028130024', () => {
    const rawResultado = fs.readFileSync(
      'test/testCases/TJMGOab/84570266920028130024_resultado.json',
      'utf8'
    );
    const rawProcesso = fs.readFileSync(
      'test/testCases/TJMGOab/84570266920028130024_capa.html',
      'utf8'
    );
    const rawAndamentos = fs.readFileSync(
      'test/testCases/TJMGOab/84570266920028130024_andamentos.html',
      'utf8'
    );

    let resultado = JSON.parse(rawResultado);

    resultado['dataAtualizacao'] = dataFormatada;
    resultado['dataCriacao'] = dataFormatada;

    resultado.andamentos = resultado.andamentos.map((element) => {
      element['dataInclusao'] = dataFormatada;
      return element;
    });

    const extracao = new TJMGParser().parse(rawProcesso, rawAndamentos);
    it('capa', () => {
      const capa = extracao.processo.capa.toJON();
      chai.expect(resultado.capa).to.eql(capa);
    });
  });
});

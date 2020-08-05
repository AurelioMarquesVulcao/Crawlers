const chai = require('chai');
const subset = require('chai-subset');
const fs = require('fs');
const moment = require('moment');

const { TJSPParser } = require('../parsers/TJSPParser');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

describe('Testes do TJSP', () => {
  describe('Teste 1 do Parser TJSP', () => {
    let resultadoString = fs.readFileSync(
      'test/testCases/TJSP/10005173520208260083_resposta.json',
      'utf8'
    );
    resultadoString = String(resultadoString)
    resultadoString = resultadoString.replace(/dataFormatada/gm, dataFormatada);
    const resultado = JSON.parse(resultadoString);
    let rawdata = fs.readFileSync(
      'test/testCases/TJSP/10005173520208260083.html',
      'utf8'
    );
    // console.log(rawdata);
    // console.log(new TJSPParser().parse(rawdata));

    const extracao = new TJSPParser().parse(rawdata);
    it('capa', () => {
      const capa = extracao.processo.capa.toJSON();
      console.table(capa);
      chai.expect(resultado.capa).to.eql(capa);
    });

    it('detalhes', () => {
      const detalhes = extracao.processo.detalhes.toJSON();
      chai.expect(resultado.detalhes).to.eql(detalhes);
    });

    it('envolvidos', () => {
      const envolvidos = extracao.processo.envolvidos.toObject();
      chai.expect(resultado.envolvidos).to.eql(envolvidos);
    });

    it('oabs', () => {
      const oabs = extracao.processo.oabs.toObject();
      chai.expect(resultado.oabs).to.eql(oabs);
    });

    it('andamentos', () => {
      let andamentos = extracao.andamentos;

      andamentos = andamentos.map((element) => {
        element = JSON.stringify(element);
        return JSON.parse(element);
      });

      chai.expect(resultado.andamentos).to.eql(andamentos);
    });
  });
});

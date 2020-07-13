const chai = require('chai');
const subset = require('chai-subset');
const fs = require('fs');
const moment = require('moment');
const { TJSCParser } = require('../parsers/TJSCParser');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

const teste = (numeroProcesso, instancia) => {
  const codigoHtml = fs.readFileSync(
    `test/testCases/TJSC/${numeroProcesso}.html`
  );
  let respostaString = fs.readFileSync(
    `test/testCases/TJSC/resposta_${numeroProcesso}.json`
  );
  respostaString = String(respostaString);
  respostaString = respostaString.replace(/dataFormatada/gm, dataFormatada);
  const resposta = JSON.parse(respostaString);
  const extracao = new TJSCParser().parse(codigoHtml, instancia);

  it('CAPA', function () {
    const capa = extracao.processo.capa.toJSON();
    chai.expect(resposta.capa).to.eql(capa);
  });

  it('DETALHES', () => {
    const detalhes = extracao.processo.detalhes.toJSON();
    chai.expect(resposta.detalhes).to.eql(detalhes);
  });

  it('ENVOLVIDOS', () => {
    const envolvidos = extracao.processo.envolvidos.toObject();
    chai.expect(resposta.envolvidos).to.eql(envolvidos);
  });

  it('OABS', () => {
    const oabs = extracao.processo.oabs.toObject();
    chai.expect(resposta.oabs).to.eql(oabs);
  });

  it('ANDAMENTOS', () => {
    let andamentos = extracao.andamentos;

    andamentos = andamentos.map((element) => {
      element = JSON.stringify(element);
      return JSON.parse(element);
    });

    chai.expect(resposta.andamentos).to.eql(andamentos);
  });
};

describe('TJSC - Teste de Parser', function () {
  describe('Processo: 03236535520148240023', function () {
    teste('03236535520148240023', 1);
  });
  describe('Processo: 00040096520198240011', function () {
    teste('00040096520198240011', 1);
  });
  describe('Processo: 00468204820128240023', function () {
    teste('00468204820128240023', 2);
  })
});

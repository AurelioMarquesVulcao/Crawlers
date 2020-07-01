const chai = require("chai");
const subset = require("chai-subset");
const fs = require("fs");
const moment = require("moment");
const { TJSCParser } = require("../parsers/TJSCParser");

const dataAtual = moment().format("YYYY-MM-DD");
const dataFormatada = new Date(dataAtual).toISOString();

const teste = (numeroProcesso) => {
  const codigoHtml = fs.readFileSync(
    `test/testCases/TJSC/${numeroProcesso}.html`
  );
  let resposta = fs.readFileSync(
    `test/testCases/TJSC/resposta_${numeroProcesso}.json`
  );
  resposta = JSON.parse(resposta);
  const extracao = new TJSCParser().parse(codigoHtml);

  it("CAPA", function () {
    const capa = extracao.processo.capa.toJSON();
    chai.expect(resposta.capa).to.eql(capa);
  });

  it("DETALHES", () => {
    const detalhes = extracao.processo.detalhes.toJSON();
    chai.expect(resposta.detalhes).to.eql(detalhes);
  });

  it("ENVOLVIDOS", () => {
    const envolvidos = extracao.processo.envolvidos.toObject();
    chai.expect(resposta.envolvidos).to.eql(envolvidos);
  });

  it("ANDAMENTOS", () => {
    let andamentos = extracao.andamentos;

    andamentos = andamentos.map((element) => {
      element = JSON.stringify(element);
      return JSON.parse(element);
    });

    chai.expect(resultado.andamentos).to.eql(andamentos);
  });
};

describe("TJSC - Teste de Parser", function () {
  describe("Processo: 03236535520148240023", function () {
    teste("03236535520148240023");
  });
  describe('Processo: 00040096520198240011', function () {
    teste('00040096520198240011');
  })
});

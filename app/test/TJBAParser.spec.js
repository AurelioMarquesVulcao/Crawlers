const chai = require('chai');
const subset = require('chai-subset');
const fs = require('fs');
const moment = require('moment');
const { TJBAPortalParser } = require('../parsers/TJBAPortalParser');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

describe('Testes do TJBA Portal', () => {
  describe('Teste 1 do Parser TJBA do Portal', () => {
    const processoString = `{"oabs":["54768BA"],"detalhes":{"tipo":"cnj","numeroProcesso":"00037339520198050000","numeroProcessoMascara":"0003733-95.2019.8.05.0000","instancia":2,"ano":95,"orgao":2019,"tribunal":8,"origem":5},"capa":{"classe":"Recurso em Sentido Estrito","assunto":["Roubo"],"uf":"BA","comarca":"Bahia"},"dataAtualizacao":"2020-04-09T18:19:07.604Z","dataCriacao":"2020-04-07T15:29:59.424Z","envolvidos":[{"nome":"Bruno Santos Queiroz","tipo":"Recorrente"},{"nome":"(54768BA) Antonio Flavio Eloi Gomes","tipo":"Advogado"},{"nome":"Ministerio Publico do Estado da Bahia","tipo":"Recorrido"},{"nome":"Eliana Elena Portela Bloizi","tipo":"Advogado"}],"origemExtracao":"OabTJBAPortal","qtdAndamentos":28,"temAndamentosNovos":false,"andamentos":[{"data":"2020-03-19T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00037339520198050000"},{"data":"2020-03-18T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Disponibilizado no Diario da Justica Eletronico","numeroProcesso":"00037339520198050000"},{"data":"2020-03-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do SECOMGE / Expedicao pela Secretaria de Camara","numeroProcesso":"00037339520198050000"},{"data":"2020-03-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido -Origem:SECOMGE /Expedicao Destino Secretaria de Camaras","numeroProcesso":"00037339520198050000"},{"data":"2020-03-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: MP","numeroProcesso":"00037339520198050000"},{"data":"2020-02-12T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Acordao Aprovado para Jurisprudencia","numeroProcesso":"00037339520198050000"},{"data":"2020-02-12T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Nao conhecido o recurso de parte","numeroProcesso":"00037339520198050000"},{"data":"2020-02-11T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Julgado","numeroProcesso":"00037339520198050000"},{"data":"2020-02-05T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00037339520198050000"},{"data":"2020-02-03T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Incluido em pauta","numeroProcesso":"00037339520198050000"},{"data":"2020-01-29T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Pauta)","numeroProcesso":"00037339520198050000"},{"data":"2020-01-29T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Solicitacao de dia de Julgamento - RELATOR","numeroProcesso":"00037339520198050000"},{"data":"2020-01-29T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Revisor","numeroProcesso":"00037339520198050000"},{"data":"2020-01-29T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do Relator pela Secretaria de Camara para Pautar","numeroProcesso":"00037339520198050000"},{"data":"2019-11-04T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Relator","numeroProcesso":"00037339520198050000"},{"data":"2019-11-04T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido pelo Relator da Secretaria de Camara","numeroProcesso":"00037339520198050000"},{"data":"2019-11-01T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido -Origem:SECOMGE /Expedicao Destino Secretaria de Camaras","numeroProcesso":"00037339520198050000"},{"data":"2019-11-01T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do SECOMGE / Expedicao pela Secretaria de Camara","numeroProcesso":"00037339520198050000"},{"data":"2019-10-18T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: MP","numeroProcesso":"00037339520198050000"},{"data":"2019-10-17T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do Relator pela Secretaria de Camara para Cumprir","numeroProcesso":"00037339520198050000"},{"data":"2019-10-17T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Cumprir)","numeroProcesso":"00037339520198050000"},{"data":"2019-10-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Proferido despacho de mero expediente","numeroProcesso":"00037339520198050000"},{"data":"2019-10-08T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00037339520198050000"},{"data":"2019-10-07T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: SECOMGE Destino: Relator","numeroProcesso":"00037339520198050000"},{"data":"2019-10-07T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do SECOMGE","numeroProcesso":"00037339520198050000"},{"data":"2019-10-04T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Distribuicao por Prevencao ao Magistrado","numeroProcesso":"00037339520198050000"},{"data":"2019-10-04T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de Termo","numeroProcesso":"00037339520198050000"},{"data":"2019-10-03T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Processo Cadastrado","numeroProcesso":"00037339520198050000"}]}`;
    const resultado = JSON.parse(processoString);
    let rawdata = fs.readFileSync(
      'test/testCases/TJBAPortal/00037339520198050000.json'
    );
    let conteudoJson = JSON.parse(rawdata);
    it('capa', () => {
      const capa = new TJBAPortalParser().extrairCapa(conteudoJson);

      chai.expect(resultado.capa).to.eql(capa);
    });

    it('envolvidos', () => {
      const envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);

      chai.expect(resultado.envolvidos).to.eql(envolvidos);
    });

    it('andamentos', () => {
      let andamentos = new TJBAPortalParser().extrairAndamentos(
        conteudoJson,
        dataAtual,
        '00037339520198050000'
      );

      andamentos = andamentos.map((element) => {
        element = JSON.stringify(element);
        return JSON.parse(element);
      });

      chai.expect(resultado.andamentos).to.eql(andamentos);
    });

    it('oabs', () => {
      let envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);
      let oabs = new TJBAPortalParser().extrairOabs(envolvidos);

      chai.expect(resultado.oabs).to.eql(oabs);
    });

    it('detalhes', () => {
      let detalhes = new TJBAPortalParser().extrairDetalhes(conteudoJson);

      chai.expect(resultado.detalhes).to.eql(detalhes);
    });
  });

  describe('Teste 2 do Parser TJBA do Portal', () => {
    const processoString =
      `{"oabs":["43925BA","19453BA"],"detalhes":{"tipo":"cnj","numeroProcesso":"00002045520078050205","numeroProcessoMascara":"0000204-55.2007.8.05.0205","instancia":1,"ano":55,"orgao":2007,"tribunal":8,"origem":5},"capa":{"assunto":["Seguro"],"uf":"BA","comarca":"Bahia","classe":"Apelacao"},"dataAtualizacao":"2020-04-13T20:28:53.861Z","dataCriacao":"2020-04-13T20:22:28.267Z","envolvidos":[{"nome":"Fenaseg - Federacao Nacional das Empresas de Seguros Privados e de Capitalizacao","tipo":"Apelante"},{"nome":"Seguradora Lider dos Consorcios Dpvat S/A","tipo":"Apelante"},{"nome":"(43925BA) Rodrigo Ayres Martins de Oliveira","tipo":"Advogado"},{"nome":"Juarez Barros Lopes","tipo":"Apelado"},{"nome":"(19453BA) Antonio Alves de Lima Junior","tipo":"Advogado"}],"origemExtracao":"OabTJBAPortal","qtdAndamentos":57,"temAndamentosNovos":false,"andamentos":[{"data":"2020-02-12T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Relator","numeroProcesso":"00002045520078050205"},{"data":"2020-02-12T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido pelo Relator da Secretaria de Camara","numeroProcesso":"00002045520078050205"},{"data":"2020-02-12T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de Certidao","numeroProcesso":"00002045520078050205"},{"data":"2020-01-17T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Localizacao Fisica do Processo","numeroProcesso":"00002045520078050205"},{"data":"2020-01-17T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de Certidao","numeroProcesso":"00002045520078050205"},{"data":"2020-01-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do Relator pela Secretaria de Camara para Cumprir","numeroProcesso":"00002045520078050205"},{"data":"2020-01-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Cumprir)","numeroProcesso":"00002045520078050205"},{"data":"2020-01-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00002045520078050205"},{"data":"2020-01-14T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Convertido o Julgamento em Diligencia","numeroProcesso":"00002045520078050205"},{"data":"2019-12-19T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido pelo Relator da Secretaria de Camara","numeroProcesso":"00002045520078050205"},{"data":"2019-12-18T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Juntada de Peticao","numeroProcesso":"00002045520078050205"},{"data":"2019-12-18T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Relator","numeroProcesso":"00002045520078050205"},{"data":"2019-12-13T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Localizacao Fisica do Processo","numeroProcesso":"00002045520078050205"},{"data":"2019-12-12T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de Certidao","numeroProcesso":"00002045520078050205"},{"data":"2019-12-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00002045520078050205"},{"data":"2019-12-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do Relator pela Secretaria de Camara para Cumprir","numeroProcesso":"00002045520078050205"},{"data":"2019-12-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Cumprir)","numeroProcesso":"00002045520078050205"},{"data":"2019-12-05T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Convertido o Julgamento em Diligencia","numeroProcesso":"00002045520078050205"},{"data":"2019-08-23T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido pelo Relator da Secretaria de Camara","numeroProcesso":"00002045520078050205"},{"data":"2019-08-22T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Relator","numeroProcesso":"00002045520078050205"},{"data":"2019-08-22T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de Certidao","numeroProcesso":"00002045520078050205"},{"data":"2019-07-19T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Localizacao Fisica do Processo","numeroProcesso":"00002045520078050205"},{"data":"2019-07-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Cumprir)","numeroProcesso":"00002045520078050205"},{"data":"2019-07-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do Relator pela Secretaria de Camara para Cumprir","numeroProcesso":"00002045520078050205"},{"data":"2019-07-11T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido pelo Relator da Secretaria de Camara","numeroProcesso":"00002045520078050205"},{"data":"2019-07-11T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Relator","numeroProcesso":"00002045520078050205"},{"data":"2019-07-11T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Juntada de Peticao","numeroProcesso":"00002045520078050205"},{"data":"2019-06-26T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Localizacao Fisica do Processo","numeroProcesso":"00002045520078050205"},{"data":"2019-05-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do Relator pela Secretaria de Camara para Pautar","numeroProcesso":"00002045520078050205"},{"data":"2019-05-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Pauta)","numeroProcesso":"00002045520078050205"},{"data":"2018-05-11T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido pelo Relator da Secretaria de Camara","numeroProcesso":"00002045520078050205"},{"data":"2018-05-10T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Relator","numeroProcesso":"00002045520078050205"},{"data":"2018-04-18T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Localizacao Fisica do Processo","numeroProcesso":"00002045520078050205"},{"data":"2018-04-16T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Cumprir)","numeroProcesso":"00002045520078050205"},{"data":"2018-04-16T00:00:00.000Z","dataInclusao":"${dataFormatada}",` +
      `"descricao":"Recebido do Relator pela Secretaria de Camara para Cumprir","numeroProcesso":"00002045520078050205"},{"data":"2018-04-09T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Secretaria de Camara Destino: Relator","numeroProcesso":"00002045520078050205"},{"data":"2018-04-09T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido pelo Relator da Secretaria de Camara","numeroProcesso":"00002045520078050205"},{"data":"2018-04-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Juntada de Peticao","numeroProcesso":"00002045520078050205"},{"data":"2018-04-02T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Localizacao Fisica do Processo","numeroProcesso":"00002045520078050205"},{"data":"2018-03-19T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Juntada de Peticao","numeroProcesso":"00002045520078050205"},{"data":"2018-03-08T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Localizacao Fisica do Processo","numeroProcesso":"00002045520078050205"},{"data":"2018-03-07T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00002045520078050205"},{"data":"2018-03-07T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de Certidao","numeroProcesso":"00002045520078050205"},{"data":"2018-02-21T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Acordao Aprovado para Jurisprudencia","numeroProcesso":"00002045520078050205"},{"data":"2018-02-20T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Conhecido o recurso e provido em parte","numeroProcesso":"00002045520078050205"},{"data":"2018-02-20T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Julgado","numeroProcesso":"00002045520078050205"},{"data":"2018-02-06T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00002045520078050205"},{"data":"2018-01-29T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Incluido em pauta","numeroProcesso":"00002045520078050205"},{"data":"2018-01-08T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: Relator Destino: Secretaria de Camara (Pauta)","numeroProcesso":"00002045520078050205"},{"data":"2018-01-08T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do Relator pela Secretaria de Camara para Pautar","numeroProcesso":"00002045520078050205"},{"data":"2017-12-19T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Solicitacao de dia de Julgamento - RELATOR","numeroProcesso":"00002045520078050205"},{"data":"2017-05-30T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"00002045520078050205"},{"data":"2017-05-26T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetido - Origem: SECOMGE Destino: Relator","numeroProcesso":"00002045520078050205"},{"data":"2017-05-26T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Recebido do SECOMGE","numeroProcesso":"00002045520078050205"},{"data":"2017-05-26T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de Termo","numeroProcesso":"00002045520078050205"},{"data":"2017-05-26T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Distribuicao por Sorteio","numeroProcesso":"00002045520078050205"},{"data":"2017-05-22T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Processo Cadastrado","numeroProcesso":"00002045520078050205"}]}`;
    const resultado = JSON.parse(processoString);
    let rawdata = fs.readFileSync(
      'test/testCases/TJBAPortal/00002045520078050205.json'
    );
    let conteudoJson = JSON.parse(rawdata);

    it('capa', () => {
      const capa = new TJBAPortalParser().extrairCapa(conteudoJson);

      chai.expect(resultado.capa).to.eql(capa);
    });

    it('envolvidos', () => {
      const envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);

      chai.expect(resultado.envolvidos).to.eql(envolvidos);
    });

    it('andamentos', () => {
      let andamentos = new TJBAPortalParser().extrairAndamentos(
        conteudoJson,
        dataAtual,
        '00002045520078050205'
      );

      andamentos = andamentos.map((element) => {
        element = JSON.stringify(element);
        return JSON.parse(element);
      });

      chai.expect(resultado.andamentos).to.eql(andamentos);
    });

    it('oabs', () => {
      let envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);
      let oabs = new TJBAPortalParser().extrairOabs(envolvidos);

      chai.expect(resultado.oabs).to.eql(oabs);
    });

    it('detalhes', () => {
      let detalhes = new TJBAPortalParser().extrairDetalhes(conteudoJson);

      chai.expect(resultado.detalhes).to.eql(detalhes);
    });
  });

  describe('Teste 3 do Parser TJBA do Portal', () => {
    const processoString = `{"oabs":["30401BA"],"detalhes":{"tipo":"cnj","numeroProcesso":"05069043420188050001","numeroProcessoMascara":"0506904-34.2018.8.05.0001","instancia":1,"ano":34,"orgao":2018,"tribunal":8,"origem":5},"capa":{"assunto":["Contratos Bancarios"],"uf":"BA","comarca":"Bahia","classe":"Execucao de Titulo Extrajudicial"},"dataAtualizacao":"2020-04-13T20:28:54.190Z","dataCriacao":"2020-04-13T20:22:28.646Z","envolvidos":[{"nome":"Banco do Brasil SA","tipo":"Exequente"},{"nome":"(30401BA) MARIA AUXILIADORA FREITAS TEIXEIRA","tipo":"Advogado"},{"nome":"MILA HIPOLITO CASTRO EPP","tipo":"Executado"},{"nome":"NILZETE DA COSTA CASTRO","tipo":"Executado"},{"nome":"CRISTIANE DA COSTA CASTRO","tipo":"Executado"},{"nome":"RODRIGO HIPOLITO CASTRO","tipo":"Executado"}],"origemExtracao":"OabTJBAPortal","qtdAndamentos":8,"temAndamentosNovos":false,"andamentos":[{"data":"2019-11-19T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Processo redistribuido por sorteio","numeroProcesso":"05069043420188050001"},{"data":"2019-11-19T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Remetidos os autos para distribuicao","numeroProcesso":"05069043420188050001"},{"data":"2018-05-09T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Publicado","numeroProcesso":"05069043420188050001"},{"data":"2018-05-07T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05069043420188050001"},{"data":"2018-05-03T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Declarada incompetencia","numeroProcesso":"05069043420188050001"},{"data":"2018-02-15T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Processo distribuido por sorteio","numeroProcesso":"05069043420188050001"},{"data":"2018-02-15T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Concluso para despacho","numeroProcesso":"05069043420188050001"},{"data":"2018-02-15T00:00:00.000Z","dataInclusao":"${dataFormatada}","descricao":"Expedicao de documento","numeroProcesso":"05069043420188050001"}]}`;
    const resultado = JSON.parse(processoString);
    let rawdata = fs.readFileSync(
      'test/testCases/TJBAPortal/05069043420188050001.json'
    );
    let conteudoJson = JSON.parse(rawdata);

    it('capa', () => {
      const capa = new TJBAPortalParser().extrairCapa(conteudoJson);

      chai.expect(resultado.capa).to.eql(capa);
    });

    it('envolvidos', () => {
      const envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);

      chai.expect(resultado.envolvidos).to.eql(envolvidos);
    });

    it('andamentos', () => {
      let andamentos = new TJBAPortalParser().extrairAndamentos(
        conteudoJson,
        dataAtual,
        '00002045520078050205'
      );

      andamentos = andamentos.map((element) => {
        element = JSON.stringify(element);
        return JSON.parse(element);
      });

      chai.expect(resultado.andamentos).to.eql(andamentos);
    });

    it('oabs', () => {
      let envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);
      let oabs = new TJBAPortalParser().extrairOabs(envolvidos);

      chai.expect(resultado.oabs).to.eql(oabs);
    });

    it('detalhes', () => {
      let detalhes = new TJBAPortalParser().extrairDetalhes(conteudoJson);

      chai.expect(resultado.detalhes).to.eql(detalhes);
    });
  });

  describe('Teste 3 do Parser TJBA do Portal', () => {
    const processoString = `{"oabs":["43154BA","41175BA"],"detalhes":{"tipo":"cnj","numeroProcesso":"05360428020178050001","numeroProcessoMascara":"0536042-80.2017.8.05.0001","instancia":1,"ano":80,"orgao":2017,"tribunal":8,"origem":5},"capa":{"assunto":["Revisao"],"uf":"BA","comarca":"Bahia","classe":"Alimentos - Lei Especial Nº 5.478/68"},"dataAtualizacao":"2020-04-13T20:28:54.474Z","dataCriacao":"2020-04-13T20:22:28.962Z","envolvidos":[{"nome":"GIULIANO BASSINI PEREIRA DOS  SANTOS","tipo":"Requerente"},{"nome":"(43154BA) Larissa Guimaraes Dourado","tipo":"Advogado"},{"nome":"LUCIANA DE LIMA FONTOURA","tipo":"Requerido"},{"nome":"(41175BA) Raisa Schreiber de Souza","tipo":"Advogado"}],"origemExtracao":"OabTJBAPortal","qtdAndamentos":108,"temAndamentosNovos":false,"andamentos":[{"data":"2020-04-10T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2020-04-07T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedicao de documento","numeroProcesso":"05360428020178050001"},{"data":"2020-04-02T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Prazo alterado devido ajuste na tabela de feriados","numeroProcesso":"05360428020178050001"},{"data":"2020-03-06T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2020-04-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedicao de documento","numeroProcesso":"05360428020178050001"},{"data":"2020-04-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2020-03-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2020-03-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2020-03-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2020-02-05T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2020-02-01T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Prazo alterado devido ajuste na tabela de feriados","numeroProcesso":"05360428020178050001"},{"data":"2019-12-07T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de aviso de recebimento (ar) positivo","numeroProcesso":"05360428020178050001"},{"data":"2019-11-30T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de aviso de recebimento (ar) positivo","numeroProcesso":"05360428020178050001"},{"data":"2019-11-27T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedido termo de audiencia","numeroProcesso":"05360428020178050001"},{"data":"2019-11-27T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedida carta","numeroProcesso":"05360428020178050001"},{"data":"2019-11-27T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de documento","numeroProcesso":"05360428020178050001"},{"data":"2019-11-27T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Audiencia designada","numeroProcesso":"05360428020178050001"},{"data":"2019-10-21T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedida carta","numeroProcesso":"05360428020178050001"},{"data":"2019-09-18T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2019-09-16T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2019-09-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2019-09-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Audiencia designada","numeroProcesso":"05360428020178050001"},{"data":"2019-08-06T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de aviso de recebimento (ar) positivo","numeroProcesso":"05360428020178050001"},{"data":"2019-07-22T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedida carta","numeroProcesso":"05360428020178050001"},{"data":"2019-07-04T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Audiencia designada","numeroProcesso":"05360428020178050001"},{"data":"2019-06-08T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2019-06-06T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2019-05-31T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2019-05-20T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2019-05-17T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedicao de Certidao","numeroProcesso":"05360428020178050001"},{"data":"2019-05-12T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2019-05-07T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedicao de Certidao","numeroProcesso":"05360428020178050001"},{"data":"2019-05-06T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2019-05-06T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2019-04-11T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2019-04-05T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2019-04-03T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2019-04-01T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2019-03-25T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2019-03-21T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2019-03-21T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de documento","numeroProcesso":"05360428020178050001"},{"data":"2019-01-15T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de aviso de recebimento (ar) positivo","numeroProcesso":"05360428020178050001"},{"data":"2018-12-26T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de aviso de recebimento (ar) positivo","numeroProcesso":"05360428020178050001"},{"data":"2018-12-18T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedida carta","numeroProcesso":"05360428020178050001"},{"data":"2018-12-11T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedida carta","numeroProcesso":"05360428020178050001"},{"data":"2018-12-06T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2018-12-04T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Audiencia designada","numeroProcesso":"05360428020178050001"},{"data":"2018-12-04T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2018-12-02T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Rejeitada a excecao de incompetencia","numeroProcesso":"05360428020178050001"},{"data":"2018-10-29T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2018-10-26T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2018-09-27T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2018-09-25T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2018-09-18T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2018-09-18T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2018-09-18T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2018-08-24T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2018-08-22T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedido ato ordinatorio","numeroProcesso":"05360428020178050001"},{"data":"2018-08-22T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2018-08-20T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2018-07-30T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedicao de Certidao","numeroProcesso":"05360428020178050001"},{"data":"2018-07-30T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de mandado","numeroProcesso":"05360428020178050001"},{"data":"2018-07-25T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedido mandado","numeroProcesso":"05360428020178050001"},{"data":"2018-05-12T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2018-05-10T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2018-04-23T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2018-04-19T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2018-04-19T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2018-03-25T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2018-03-21T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2018-03-21T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de documento","numeroProcesso":"05360428020178050001"},{"data":"2018-03-05T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Prazo alterado devido ajuste na tabela de feriados","numeroProcesso":"05360428020178050001"},{"data":"2018-02-07T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de aviso de recebimento (ar) positivo","numeroProcesso":"05360428020178050001"},{"data":"2018-01-29T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedicao de Certidao","numeroProcesso":"05360428020178050001"},{"data":"2018-01-24T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2018-01-22T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2018-01-19T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedido mandado","numeroProcesso":"05360428020178050001"},{"data":"2018-01-18T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedida carta","numeroProcesso":"05360428020178050001"},{"data":"2018-01-08T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Audiencia designada","numeroProcesso":"05360428020178050001"},{"data":"2018-01-07T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2017-12-14T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2017-12-14T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de documento","numeroProcesso":"05360428020178050001"},{"data":"2017-12-13T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Prazo alterado devido ajuste na tabela de feriados","numeroProcesso":"05360428020178050001"},{"data":"2017-11-29T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Aviso de Recebimento (AR) negativo","numeroProcesso":"05360428020178050001"},{"data":"2017-11-27T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2017-11-13T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedida carta","numeroProcesso":"05360428020178050001"},{"data":"2017-11-13T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2017-11-13T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Audiencia designada","numeroProcesso":"05360428020178050001"},{"data":"2017-11-12T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2017-10-30T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2017-10-30T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de documento","numeroProcesso":"05360428020178050001"},{"data":"2017-10-10T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2017-09-20T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Audiencia designada","numeroProcesso":"05360428020178050001"},{"data":"2017-08-11T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Publicado","numeroProcesso":"05360428020178050001"},{"data":"2017-08-09T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Despacho/Decisao remetido ao Diario de Justica Eletronico","numeroProcesso":"05360428020178050001"},{"data":"2017-08-08T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2017-08-01T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Prazo alterado devido ajuste na tabela de feriados","numeroProcesso":"05360428020178050001"},{"data":"2017-07-21T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2017-07-14T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2017-06-27T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Juntada de Peticao","numeroProcesso":"05360428020178050001"},{"data":"2017-06-22T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Expedicao de Certidao","numeroProcesso":"05360428020178050001"},{"data":"2017-06-21T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Proferido despacho de mero expediente","numeroProcesso":"05360428020178050001"},{"data":"2017-06-20T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Concluso para despacho","numeroProcesso":"05360428020178050001"},{"data":"2017-06-19T00:00:00.000Z","dataInclusao":"2020-04-13T00:00:00.000Z","descricao":"Processo distribuido por sorteio","numeroProcesso":"05360428020178050001"}]}`;
    const resultado = JSON.parse(processoString);
    let rawdata = fs.readFileSync(
      'test/testCases/TJBAPortal/05360428020178050001.json'
    );
    let conteudoJson = JSON.parse(rawdata);

    it('capa', () => {
      const capa = new TJBAPortalParser().extrairCapa(conteudoJson);

      chai.expect(resultado.capa).to.eql(capa);
    });

    it('envolvidos', () => {
      const envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);

      chai.expect(resultado.envolvidos).to.eql(envolvidos);
    });

    it('andamentos', () => {
      let andamentos = new TJBAPortalParser().extrairAndamentos(
        conteudoJson,
        dataAtual,
        '00002045520078050205'
      );

      andamentos = andamentos.map((element) => {
        element = JSON.stringify(element);
        return JSON.parse(element);
      });

      chai.expect(resultado.andamentos).to.eql(andamentos);
    });

    it('oabs', () => {
      let envolvidos = new TJBAPortalParser().extrairEnvolvidos(conteudoJson);
      let oabs = new TJBAPortalParser().extrairOabs(envolvidos);

      chai.expect(resultado.oabs).to.eql(oabs);
    });

    it('detalhes', () => {
      let detalhes = new TJBAPortalParser().extrairDetalhes(conteudoJson);

      chai.expect(resultado.detalhes).to.eql(detalhes);
    });
  });
});

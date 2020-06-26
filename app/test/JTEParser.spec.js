const chai = require('chai');
const subset = require('chai-subset');
const fs = require('fs');
const moment = require('moment');
const { TJBAPortalParser } = require('../parsers/TJBAPortalParser');
const { TJPRParser } = require('../parsers/TJPRParser');
//const { OabTJPR } = require('../extratores/OabTJPR');
const cheerio = require('cheerio');
const { Processo } = require('../models/schemas/processo');
const { match } = require('assert');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

const ObjectId = require('mongoose').Types.ObjectId;

describe('Testes TJPR', () => {
  describe('Teste 1 do Parser TJPR OAB', () => {
    let rawdata = fs.readFileSync(
      'test/testCases/TJPR/0025622-21.2010.8.16.0031.html', 'utf8'
    );
    rawdata = cheerio.load(rawdata)

    let djResultado = fs.readFileSync(
      'test/testCases/TJPR/0025622-21.2010.8.16.0031DjEletronico.txt', 'utf8'
    );

    let OAB = fs.readFileSync(
      'test/testCases/TJPR/oab_25077.html', 'utf8'
    );
    OAB2 = OAB
    OAB = cheerio.load(OAB)


    it('Capa', () => {
      // estou testando um dos valores possiveis.
      
      const match1 = new TJPRParser().extrairCapa(rawdata).classeProcessual
      const match2 = "49 - Procedimentos Especiais de Jurisdicao Contenciosa - Usucapiao"


      chai.expect(match1).to.eql(match2);
    });
    it('Detalhes', () => {
      const parse = new TJPRParser().extrairCapa(rawdata).numeroUnico;
      const match1 = Processo.identificarDetalhes(parse);
      const match2 = {
        tipo: 'cnj',
        numeroProcesso: '00256222120108160031',
        numeroProcessoMascara: '0025622-21.2010.8.16.0031',
        instancia: 1,
        ano: 2010,
        orgao: 8,
        tribunal: 16,
        origem: 31
      }


      chai.expect(match1).to.eql(match2);
    });
    it('Envolvidos', () => {
      const match1 = new TJPRParser().extraiEnvolvidos(OAB)[6];
      const match2 = [
        { tipo: 'Autor', nome: 'ANTONIO BELL DOS SANTOS' },
        { tipo: 'Reu', nome: 'ELIAS J. CURI IND. E COM. S.A' }
      ];


      chai.expect(match1).to.eql(match2);
    });
    it('oabs', () => {

      const match1 = new TJPRParser().pegaOab(25077)
      const match2 = 25077


      chai.expect(match1).to.eql(match2);
    });
    it('andamentos', async () => {
      let numeroDaOab = '13619'
      let envolvidos = [
        { tipo: 'Autor', nome: 'ANTONIO BELL DOS SANTOS' },
        { tipo: 'Reu', nome: 'ELIAS J. CURI IND. E COM. S.A' }
      ]

      let processo = await new TJPRParser().extrairDadosProcesso(rawdata)
      let extrairProcesso = await new TJPRParser().parse(processo, djResultado, rawdata, envolvidos, numeroDaOab)
      let andamantosTeste = extrairProcesso.andamentos.slice(0, 2)

      // console.log(parte);

      const match2 = [
        {
          _id: '5ef0c009744643497cfc65ae',
          descricao: 'Arquivado Definitivamente',
          numeroProcesso: '00256222120108160031'
        },
        {
          _id: '5ef0c009744643497cfc65af',
          descricao: 'Decorrido prazo de #{nome_da_parte} em #{data}.',
          numeroProcesso: '00256222120108160031'
        },]
      // estou contando quantos elementos são verdadeiros caso existam elementos que não batam
      // a contagem falhar e é indicado uma falha no teste.
      let contagem = 0
      for (let i = 0; i < andamantosTeste.length; i++) {
        let obj = match2.find(x => x.descricao == andamantosTeste[i].descricao &&
          x.numeroProcesso == andamantosTeste[i].numeroProcesso);
        if (!obj == false) contagem++;
      }
      const match1 = contagem

      chai.expect(andamantosTeste.length).to.eql(match1);
    });
  });

  

});

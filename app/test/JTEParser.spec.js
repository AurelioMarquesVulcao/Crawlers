const chai = require('chai');
const subset = require('chai-subset');
const fs = require('fs');
const moment = require('moment');
const {
  JTEParser
} = require('../parsers/JTEParser');
const cheerio = require('cheerio');
const {
  Processo
} = require('../models/schemas/processo');
const {
  match
} = require('assert');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

const ObjectId = require('mongoose').Types.ObjectId;

describe('Testes JTE', () => {
  describe('Teste 1 do Parser JTE Processo', () => {
    let arq01 = fs.readFileSync(
      'test/testCases/JTE/g0000004-63.2019.5.21.0001.html', 'utf8'
    );
    arq01 = cheerio.load(arq01)


    let arq02 = fs.readFileSync(
      'test/testCases/JTE/m0000004-63.2019.5.21.0001.html', 'utf8'
    );
    arq02 = cheerio.load(arq02)


    it('Capa', () => {
      // estou testando um dos valores possiveis.

      const match1 = new JTEParser().parse(arq01, arq02).processo.capa.vara
      const match2 = "1a Vara do Trabalho"


      chai.expect(match1).to.eql(match2);
    });
    it('Detalhes', () => {
      const match1 = new JTEParser().parse(arq01, arq02).processo.detalhes;
      const match2 = {
        tipo: 'cnj',
        numeroProcesso: '00000046320195210001',
        numeroProcessoMascara: '0000004-63.2019.5.21.0001',
        instancia: 1,
        ano: 2019,
        orgao: 5,
        tribunal: 21,
        origem: 1
      }

      let contagem = 0
      //   let obj = match2.find(x => x.tipo == match1[i].tipo && x.numeroProcesso == match1[i].numeroProcesso);
      //   if (!obj == false) contagem++;
      // }
      if (!match2.tipo == match1.tipo == false) contagem++
      if (!match2.numeroProcesso == match1.numeroProcesso == false) contagem++
      if (!match2.numeroProcessoMascara == match1.numeroProcessoMascara == false) contagem++
      if (!match2.instancia == match1.instancia == false) contagem++
      if (!match2.ano == match1.ano == false) contagem++
      if (!match2.orgao == match1.orgao == false) contagem++
      if (!match2.tribunal == match1.tribunal == false) contagem++
      if (!match2.origem == match1.origem == false) contagem++


      chai.expect(contagem).to.eql(8);
    });

    it('Envolvidos', () => {
      const match1 = new JTEParser().parse(arq01, arq02).processo.envolvidos;
      const match2 = [{
          nome: 'RAZON NEVES DOS SANTOS SILVA',
          tipo: 'Polo ativo'
        },
        {
          nome: 'ALLIANCE GESTAO E SEGURANCA PATRIMONIAL LTDA - EPP',
          tipo: 'Polo passivo'
        },
        {
          nome: 'CONDOMINIO VILLE DE MONTPELLIER',
          tipo: 'Polo passivo'
        }
      ];


      // estou contando quantos elementos são verdadeiros caso existam elementos que não batam
      // a contagem falhar e é indicado uma falha no teste.
      let contagem = 0
      for (let i = 0; i < match1.length; i++) {
        let obj = match2.find(x => x.nome == match1[i].nome && x.tipo == match1[i].tipo);
        if (!obj == false) contagem++;
      }



      chai.expect(contagem).to.eql(match2.length);
    });
    it('oabs', () => {

      const match1 = new JTEParser().parse(arq01, arq02).processo.oabs
      const match2 = ['7309-RN', '10587-RN'];


      chai.expect(match1).to.eql(match2);
    });

    it('andamentos', async () => {
      let andamantosTeste = new JTEParser().parse(arq01, arq02).andamentos
      andamantosTeste = andamantosTeste.slice(0, 3)

      const match2 = [{
          _id: '5efcb4f583235537f827a0ff',
          descricao: 'Intimacao | Intimacao',
          data: '2020-04-01T03:00:00.000Z',
          numeroProcesso: '00000046320195210001'
        },
        {
          _id: '5efcb4f583235537f827a100',
          descricao: 'Despacho | Despacho  [ 2b2f5c6 ]',
          data: '2020-04-01T03:00:00.000Z',
          numeroProcesso: '00000046320195210001'
        },
        {
          _id: '5efcb4f583235537f827a101',
          descricao: 'Proferido despacho de mero expediente',
          data: '2020-04-01T03:00:00.000Z',
          numeroProcesso: '00000046320195210001'
        }
      ]
      // estou contando quantos elementos são verdadeiros caso existam elementos que não batam
      // a contagem falhar e é indicado uma falha no teste.
      let contagem = 0
      for (let i = 0; i < andamantosTeste.length; i++) {
        let obj = match2.find(x => x.descricao == andamantosTeste[i].descricao 
          && x.numeroProcesso == andamantosTeste[i].numeroProcesso);
        if (!obj == false) contagem++;
      }
      const match1 = contagem

      chai.expect(andamantosTeste.length).to.eql(match1);
    });
  });



});
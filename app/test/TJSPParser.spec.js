const chai = require("chai");
const subset = require("chai-subset");
const fs = require("fs");
const moment = require("moment");

const { TJSPParser } = require("../parsers/TJSPParser");

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();

describe('Testes do TJSP', () => {
    describe('Teste 1 do Parser TJSP', () => {
        const processoString = {
            "oabs": ["257220SP", "265434SP", "277946SP", "285494SP", "126504SP"],
            "detalhes": {
                "tipo": "cnj",
                "numeroProcesso": "10005173520208260083",
                "numeroProcessoMascara": "1000517-35.2020.8.26.0083",
                "instancia": 1,
                "ano": 2020,
                "orgao": 35,
                "tribunal": 8,
                "origem": 26
            },
            "capa": {
                "classe": "Peticao",
                "assunto": ["Peticao intermediaria"]
            }
        }
    })
})
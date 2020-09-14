//const cheerio = require('cheerio');
//const moment = require('moment');
//const re = require('xregexp');
//const { enums } = require('../configs/enums');


const { BaseParser, removerAcentos } = require('./BaseParser');
const { Processo } = require('../models/schemas/processo');
//const { Andamento } = require('../models/schemas/andamento');
const Extracao = require('../assets/jte/Extracao.json')



class TRTParser extends BaseParser {
    /**
     * JTEParser
     */
    constructor() {
        super();
    }

    parse(extracao) {
        let cnj = "";
        let dadosAndamento;

        let dadosProcesso = new Processo({
            capa: this.capa(),
            oabs: "",
            qtdAndamentos: "",
            origemExtracao: "",
            envolvidos: "",
            detalhes: "",
        })

        return {
            processo: dadosProcesso,
            andamentos: dadosAndamento
        }
    }
    capa() {
        let capa = {
            uf: "",
            comarca: "",
            vara: "",
            fase: "",
            assunto: "",
            classe: "",
            dataDistribuicao: "",
            instancia: "",
        }

        return capa
    }
}
(async () => {
    console.log(
        new TRTParser().parse(Extracao)
    );
    

})()
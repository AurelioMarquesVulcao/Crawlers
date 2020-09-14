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
            capa: this.capa(extracao),
            oabs: "",
            qtdAndamentos: "",
            origemExtracao: "TRT-RJ",
            envolvidos: "",
            detalhes: "",
        })

        return {
            processo: dadosProcesso,
            andamentos: dadosAndamento
        }
    }
    capa(extracao) {
        let regex = this.regexVaraComarca(extracao.orgaoJulgador)
        let capa = {
            uf: "RJ",
            comarca: regex[2],
            vara: regex[1],
            fase: extracao.itensProcesso[0].instancia,
            assunto: [extracao.assuntos[0].descricao],
            classe: extracao.classe,
            dataDistribuicao: extracao.distribuidoEm,
            instancia: extracao.itensProcesso[0].instancia,
            segredoJustica: extracao.segredoJustica,
            justicaGratuita: extracao.justicaGratuita,
            valor: extracao.valorDaCausa
        }

        return capa
    }
    regexVaraComarca(str) {
        let regex = /\s*(.+?D[EO].+?)\s*D[EOA]\s*(.+)\s*/gim;
        let m;
        let resultado = []

        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                resultado.push(`${match}`)
                // console.log(`Found match, group ${groupIndex}: ${match}`);
            });
        }
        //console.log(resultado);
        return resultado
    }
}
// (async () => {
//     console.log(new TRTParser().parse(Extracao));
//     console.log(new TRTParser().parse(Extracao).processo.capa.assunto);
//     // console.log(Extracao.assuntos[0].descricao);

// })()
//const cheerio = require('cheerio');
//const moment = require('moment');
//const re = require('xregexp');
//const { enums } = require('../configs/enums');


const { BaseParser, removerAcentos } = require('./BaseParser');
//const { Processo } = require('../models/schemas/processo');
const { ProcessoTRT } = require('../models/schemas/trt.rj');
//const { Andamento } = require('../models/schemas/andamento');
const Extracao = require('../assets/jte/testes.json')



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

        let dadosProcesso = new ProcessoTRT({
            capa: this.capa(extracao),
            oabs: [],
            qtdAndamentos: extracao.itensProcesso.length,
            origemExtracao: "TRT-RJ",
            envolvidos: [],
            detalhes: ProcessoTRT.identificarDetalhes(extracao.numero),
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
            assunto: this.assunto(extracao),
            classe: extracao.classe,
            dataDistribuicao: extracao.distribuidoEm,
            instancia: extracao.itensProcesso[0].instancia,
            segredoJustica: extracao.segredoJustica,
            justicaGratuita: extracao.justicaGratuita,
            valor: extracao.valorDaCausa
        }

        return capa
    }
    assunto(extracao) {
        let resultado = [];
        let dados;
        let resultadoJoin = [];
        if (extracao.assuntos.length == 0) {
            return [""]
        } else {
            for (let i = 0; i < extracao.assuntos.length; i++) {
                dados = extracao.assuntos[i].descricao;
                resultado.push(dados);
            }
            resultadoJoin = resultado.join(" , ");
            return [resultadoJoin]
        }

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
module.exports.TRTParser = TRTParser;

(async () => {
    await new TRTParser().parse(Extracao)
})()
//const cheerio = require('cheerio');
//const moment = require('moment');
//const re = require('xregexp');
//const { enums } = require('../configs/enums');


const { BaseParser, removerAcentos } = require('./BaseParser');
const { ProcessoTRT } = require('../models/schemas/trt.rj');
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
            origemExtracao: "TRT-PJE",
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
            uf: "",
            comarca: regex.comarca,
            vara: regex.vara,
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
        let resultado;
        let data = [];
        while ((m = regex.exec(str)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                data.push(`${match}`)
                // console.log(`Found match, group ${groupIndex}: ${match}`);
            });
        }

        const regex2 = /(gabinete\sd[aoe])/i;
        if (regex2.test(data[1])) {
            let vara = ""
            let comarca = ""
            resultado = { vara, comarca }
        } else {
            let vara = removerAcentos(data[1])
            let comarca = removerAcentos(data[2])
            resultado = { vara, comarca }
        }

        return resultado
    }
}
module.exports.TRTParser = TRTParser;
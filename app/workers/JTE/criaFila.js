const mongoose = require("mongoose");
const cheerio = require('cheerio');
const re = require('xregexp');
const fs = require('fs');
const sleep = require('await-sleep');

const { enums } = require("../../configs/enums");
const { GerenciadorFila } = require("../../lib/filaHandler");

const { ExtratorBase } = require('../../extratores/extratores');
const { JTEParser } = require('../../parsers/JTEParser');
const { Processo } = require('../../models/schemas/processo');



class CriaFilaJTE {
    enviarMensagem(nome, message) {
        new GerenciadorFila().enviar(nome, message);
    }

    async buscaDb(quantidade, salto) {
        const devDbConection = 'mongodb://admin:admin@bigrj01mon01:19000,bigrj01mon02:19000/crawlersBigdata?authSource=admin&replicaSet=rsBigData&readPreference=primary&appname=MongoDB%20Compass&ssl=false'
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        var Processos = mongoose.model('consultasCadastradas', {
            NumeroProcesso: String,
            DataCadastro: Date,
            AtivoParaAtualizacao: Boolean,
            DataUltimaConsultaTribunal: Date,
            Instancia: String,
            TipoConsulta: String
        }, 'consultasCadastradas');
        return await Processos.find({ "TipoConsulta": "processo" }).limit(quantidade).skip(salto)
    }
    async enviaFila(numeroProcesso) {
        const sleep4 = 50;
        const sleep1 = 250;
        let filtro = numeroProcesso;
        let conta1000 = 0;
        console.log(filtro.length);
        for (let i = 0; i < filtro.length; i++) {
            let tribunal = 0
            tribunal = detalhes(filtro[i].NumeroProcesso).tribunal;
            if (tribunal == 15) {
                await sleep(sleep1)
                const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-SP-15`;
                let message = criaPost(filtro[i].NumeroProcesso)

                await this.enviarMensagem(nomeFila, message)
                await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
                conta1000++
                if (conta1000 == 2000) {
                    await sleep(sleep4)
                    conta1000 = 0
                }
            }
            if (tribunal == 2) {
                await sleep(sleep1)
                const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-SP-2`;
                let message = criaPost(filtro[i].NumeroProcesso)

                await this.enviarMensagem(nomeFila, message)
                await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
                conta1000++
                if (conta1000 == 2000) {
                    await sleep(sleep4)
                    conta1000 = 0
                }
            }
            if (tribunal == 3) {
                await sleep(sleep1)
                const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-MG`;
                let message = criaPost(filtro[i].NumeroProcesso)

                await this.enviarMensagem(nomeFila, message)
                await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
                conta1000++
                if (conta1000 == 2000) {
                    await sleep(sleep4)
                    conta1000 = 0
                }
            }
            if (tribunal == 1) {
                await sleep(sleep1)
                const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-RJ`;
                let message = criaPost(filtro[i].NumeroProcesso)

                await this.enviarMensagem(nomeFila, message)
                await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
                conta1000++
                if (conta1000 == 2000) {
                    await sleep(sleep4)
                    conta1000 = 0
                }
            }
            if (tribunal == 5) {
                await sleep(sleep1)
                const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-BA`;
                let message = criaPost(filtro[i].NumeroProcesso)

                await this.enviarMensagem(nomeFila, message)
                await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
                conta1000++
                if (conta1000 == 2000) {
                    await sleep(sleep4)
                    conta1000 = 0
                }
            }



        }
    }
}


(async () => {
    const fila = new CriaFilaJTE()
   
    let filtro = await fila.buscaDb(10, 145000)
    await fila.enviaFila(filtro)

    await sleep(5000)
    process.exit()
    
    console.log();



})();

// ------------------------------------funcoes complementares--------------------------------------
function criaPost(numero) {
    let post = `{
        "ExecucaoConsultaId" : "${makeid()}",
        "ConsultaCadastradaId" : "${makeid()}",
        "DataEnfileiramento" : "${new Date}",
        "NumeroProcesso" : "${numero}",
        "NumeroOab" : "null",        
        "SeccionalOab" : "SP"
    }`
    return post
}

// gera numero aleatório para preencher os campos os dados
function numeroAleatorio(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
// gera id aleatorio não unico
function makeid() {
    let text = "5ed9";
    let possible = "abcdefghijklmnopqrstuvwxyz0123456789";
    let letra = "abcdefghijklmnopqrstuvwxyz";
    let numero = "0123456789";

    for (var i = 0; i < 20; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function detalhes(numeroProcesso) {
    let numero = mascaraNumero(numeroProcesso)
    let detalhes = Processo.identificarDetalhes(numero)
    return detalhes
}

function mascaraNumero(numeroProcesso) {
    let resultado = '';
    resultado = numeroProcesso.slice(0, 7) + '-' + numeroProcesso.slice(7, 9)
        + '.' + numeroProcesso.slice(9, 13) + '.' + numeroProcesso.slice(13, 14)
        + '.' + numeroProcesso.slice(numeroProcesso.length - 6, numeroProcesso.length - 4)
        + '.' + numeroProcesso.slice(numeroProcesso.length - 4, numeroProcesso.length)
    return resultado
}
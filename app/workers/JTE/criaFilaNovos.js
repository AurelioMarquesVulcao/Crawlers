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



var consultaCadastradas = mongoose.model('consultasCadastradas', {
    NumeroProcesso: String,
    DataCadastro: Date,
    AtivoParaAtualizacao: Boolean,
    DataUltimaConsultaTribunal: Date,
    Instancia: String,
    TipoConsulta: String,
    Detalhes: {
        Orgao: Number,
        Tribunal: Number
    }
}, 'consultasCadastradas');

var insereUltimoProcesso1 = new mongoose.Schema({
    NumeroProcesso: String,
    DataCadastro: String,
})
var insereUltimoProcesso = mongoose.model('insereUltimoProcesso', insereUltimoProcesso1);


class CriaFilaJTE {
    enviarMensagem(nome, message) {
        new GerenciadorFila().enviar(nome, message);
    }

    async buscaDb(quantidade, salto) {
        let devDbConection = 'mongodb://admin:admin@bigrj01mon01:19000,bigrj01mon02:19000/crawlersBigdata?authSource=admin&replicaSet=rsBigData&readPreference=primary&appname=MongoDB%20Compass&ssl=false'
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        // var consultaCadastradas = mongoose.model('consultasCadastradas', {
        //     NumeroProcesso: String,
        //     DataCadastro: Date,
        //     AtivoParaAtualizacao: Boolean,
        //     DataUltimaConsultaTribunal: Date,
        //     Instancia: String,
        //     TipoConsulta: String
        // }, 'consultasCadastradas');
        return await consultaCadastradas.find({ "Detalhes.Tribunal": 15 }).limit(quantidade).skip(salto)
        // return await consultaCadastradas.find({ "TipoConsulta": "processo" }).limit(quantidade).skip(salto)
    }

    async salvaUltimo(ultimo) {
        let devDbConection = 'mongodb+srv://Impacta:dificil1234@vulcaotech-pdii4.mongodb.net/ultimoProcesso-SP-15?retryWrites=true&w=majority'
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        // var consultaCadastradas = mongoose.model('consultasCadastradas', {
        //     NumeroProcesso: String,
        //     DataCadastro: Date,
        //     AtivoParaAtualizacao: Boolean,
        //     DataUltimaConsultaTribunal: Date,
        //     Instancia: String,
        //     TipoConsulta: String
        // }, 'consultasCadastradas');
        return await new insereUltimoProcesso(ultimo).save()
        // return await consultaCadastradas.find({ "TipoConsulta": "processo" }).limit(quantidade).skip(salto)
    }

    async enviaFila(numeroProcesso) {
        const sleep4 = 5;
        const sleep1 = 2;
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
    async filtraTrunal() {
        let recebeNumeros = [];
        let resultado = [];
        let dados = await this.buscaDb(60000, 0);
        console.log(dados[0]);
        //console.log('');
        for (let i = 0; i < dados.length; i++) {
            let numero = dados[i].NumeroProcesso
            let sequencial = numero.slice(0, 7)
            let varaTrabalho = numero.slice(numero.length - 4, numero.length)
            if (recebeNumeros.indexOf(varaTrabalho) < 0) {
                recebeNumeros.push(varaTrabalho,)
                resultado.push([varaTrabalho,sequencial])
            }
        }
        console.log(recebeNumeros.length);
        return resultado.sort()
    }
    async peganumero() {
        let dados = await this.buscaDb(60000, 0)

        for (let i = 0; i < dados.length; i++) {
            let numero = dados[i].NumeroProcesso
            
            let varaTrabalho = numero.slice(numero.length - 4, numero.length)
            if (recebeNumeros.indexOf(varaTrabalho) < 0) {
                
                recebeNumeros.push(varaTrabalho)
            }
        }

    }
}
// ------------------------------------funcoes complementares--------------------------------------------------------------------------------------------------------------------------------

(async () => {
    const fila = new CriaFilaJTE()
    let varaTrabalho = await fila.filtraTrunal()
    for (let i = 0; i < varaTrabalho.length; i++) {
        console.log(varaTrabalho[i]);

    }
    // await console.log(await fila.filtraTrunal());








    //await fila.salvaUltimo({ NumeroProcesso: "0010981-48.2020.5.15.0001", DataCadastro: "2020-07-21T19:45:45.000Z" })






    //await fila.enviaFila()
    await sleep(1000)
    process.exit()

})();

// ------------------------------------funcoes complementares----------------------------------------------------------------------------------------------------------------------------------
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
module.exports.CriaFilaJTE = CriaFilaJTE;
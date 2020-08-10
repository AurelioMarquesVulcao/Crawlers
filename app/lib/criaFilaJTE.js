const mongoose = require("mongoose");
const re = require('xregexp');
const sleep = require('await-sleep');
const { enums } = require("../configs/enums");
const { GerenciadorFila } = require("../lib/filaHandler");

const { ExtratorBase } = require('../extratores/extratores');
const { JTEParser } = require('../parsers/JTEParser');
const { Processo } = require('../models/schemas/processo');
require("dotenv/config");



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

var ultimoProcesso1 = new mongoose.Schema({
    numeroProcesso: String,
    dataCadastro: String,
    origem: Number,
    tribunal: Number,
    data: { dia: Number, mes: Number },
})
var ultimoProcesso = mongoose.model('ultimosProcessos', ultimoProcesso1, 'ultimosProcessos');
var ultimoProcessodb1 = mongoose.model('ultimos-processos', ultimoProcesso1, 'ultimos-processos');
var ultimoProcessodb2 = mongoose.model('ultimosprocessos', ultimoProcesso1, 'ultimosprocessos');


var linkDocumento1 = new mongoose.Schema({
    link: String,
    movimentacao: String,
    data: String,
    numeroProcesso: String,
    tipo: String,
})

var linkDocumento = mongoose.model('salvaDocumentoLink', linkDocumento1, 'salvaDocumentoLink');

class CriaFilaJTE {
    enviarMensagem(nome, message) {
        new GerenciadorFila().enviar(nome, message);
    }

    async buscaDb(quantidade, salto) {
        let devDbConection = process.env.MONGO_CONNECTION_STRING
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        return await consultaCadastradas.find({ "Detalhes.Tribunal": 5 }).limit(quantidade).skip(salto)
        // return await consultaCadastradas.find({ "TipoConsulta": "processo" }).limit(quantidade).skip(salto)
    }

    async salvaUltimo(ultimo) {
        //let devDbConection = process.env.MONGO_DEV_CONECTION
        let devDbConection = process.env.MONGO_CONNECTION_STRING
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        let veirifica = await ultimoProcesso.find({ "numeroProcesso": ultimo.numeroProcesso })


        if (!veirifica[0]) {
            return await new ultimoProcesso(ultimo).save()
        }

    }

    async salvaDocumentoLink(link) {
        //let devDbConection = process.env.MONGO_DEV_CONECTION
        let devDbConection = process.env.MONGO_CONNECTION_STRING
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        let verifica = await linkDocumento.find({ "numeroProcesso": link.numeroProcesso, "movimentacao": link.link })
        console.log(!verifica[0]);
        if (!verifica[0]) {
            return await new linkDocumento(link).save()
        }



    }

    async abreUltimo(parametro) {
        let devDbConection = process.env.MONGO_CONNECTION_STRING
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        let busca = await ultimoProcesso.find(parametro)
        let obj = busca;

        return obj
    }



    async filtraTrunal() {
        let recebeNumeros = [];
        let resultado = [];
        let dados = await this.buscaDb(60000, 0);
        for (let i = 0; i < dados.length; i++) {
            let numero = dados[i].NumeroProcesso
            let sequencial = numero.slice(0, 7)
            let varaTrabalho = numero.slice(numero.length - 4, numero.length)
            if (recebeNumeros.indexOf(varaTrabalho) < 0) {
                recebeNumeros.push(varaTrabalho,)
                resultado.push([varaTrabalho, sequencial])
            }
        }

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
    async procura(sequencial, origem, tentativas, tribunal) {
        let obj = corrigeSequencial(sequencial)
        origem = corrigeOrigem(origem)
        for (let i = 0; i < tentativas; i++) {
            sequencial = parseInt(obj.seq)
            let a = sequencial + 1 + i
            let processo = `${obj.zero}${a}4720205${tribunal}${origem}`

            await this.enviaFila([{
                NumeroProcesso: processo
            }])
            //await this.enviaFila(`00109964720205150001`)
        }
    }
    async procura10(sequencial, origem, tentativas, tribunal) {
        let obj = corrigeSequencial(sequencial)
        origem = corrigeOrigem(origem)
        for (let i = 0; i < tentativas; i++) {
            sequencial = parseInt(obj.seq)
            let a = sequencial + 5 + i
            let processo = `${obj.zero}${a}4720205${tribunal}${origem}`

            await this.enviaFila([{
                NumeroProcesso: processo
            }])
        }
    }
    relogio() {
        let data = new Date();
        // Guarda cada pedaço em uma variável
        let dia = data.getDate();           // 1-31
        let dia_sem = data.getDay();            // 0-6 (zero=domingo)
        let mes = data.getMonth();          // 0-11 (zero=janeiro)
        let ano2 = data.getYear();           // 2 dígitos
        let ano4 = data.getFullYear();       // 4 dígitos
        let hora = data.getHours();          // 0-23
        let min = data.getMinutes();        // 0-59
        let seg = data.getSeconds();        // 0-59
        let mseg = data.getMilliseconds();   // 0-999
        let tz = data.getTimezoneOffset(); // em minutos

        return { dia, mes, hora, min, seg }
    }

    async enviaFila(numeroProcesso) {
        const sleep4 = 5;
        const sleep1 = 2;
        let filtro = numeroProcesso;
        let conta1000 = 0;

        for (let i = 0; i < filtro.length; i++) {
            let tribunal = 0
            tribunal = detalhes(filtro[i].NumeroProcesso).tribunal;
            if (tribunal == 15) {
                await sleep(sleep1)
                const nomeFila = `${enums.tipoConsulta.Processo}.${enums.nomesRobos.JTE}.extracao.novos-SP-15`;
                let message = criaPost(filtro[i].NumeroProcesso)

                await this.enviarMensagem(nomeFila, message)
                //await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
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
                //await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
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
                //await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
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
                //await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
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
                //await console.log('processo : ' + filtro[i].NumeroProcesso + ' adicionado');
                conta1000++
                if (conta1000 == 2000) {
                    await sleep(sleep4)
                    conta1000 = 0
                }
            }



        }
    }
}
// ------------------------------------funcoes complementares--------------------------------------------------------------------------------------------------------------------------------



// ------------------------------------funcoes complementares----------------------------------------------------------------------------------------------------------------------------------
function corrigeSequencial(sequencial) {
    let novoSequencial = sequencial
    let zero = ''
    for (let i = 0; i < sequencial.length; i++) {
        if (sequencial[i] == '0') {
            novoSequencial = novoSequencial.slice(1, novoSequencial.length)
            zero += "0"
        } else {
            break
        };
    }; let seq = novoSequencial;
    return obj = { seq, zero }
}
function corrigeOrigem(origem) {
    let zero = ''
    let n = 4 - origem.length
    for (let i = 0; i < 5; i++) {
        if (n > i) {
            zero += "0"
        } else {
            break
        };
    }
    return zero + origem
}

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
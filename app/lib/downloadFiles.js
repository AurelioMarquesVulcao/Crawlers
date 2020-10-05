'use strict'

const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const { path } = require('dotenv/lib/env-options');
const { LogAWS } = require('../models/schemas/logsEnvioAWS');


class downloadFiles {

    async download(name, link, local) {
        const url = link;
        const path = Path.resolve(__dirname, local, name)
        const response = await Axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        })
        // await console.log(!!Fs.createWriteStream(path));
        response.data.pipe(Fs.createWriteStream(path))
        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve()
            })
            response.data.on('error', err => {
                reject(err)
            })
        })
    }

    async enviarAWS(cnj, lista) {
        let resultado;
        try {
            // console.log(lista);
            //process.exit()
            // console.log(lista.length);
            // lista.length = 1;
            // console.log(lista.length);
            // Helper.pred('----gambisort---');
            let envioAWS = {
                NumeroCNJ: cnj,
                Documentos: []
            }
            for (let i = 0, si = lista.length; i < si; i++) {
                const base64 = Fs.readFileSync(lista[i].path, 'base64');
                envioAWS.Documentos.push({
                    DocumentoBody: base64,
                    UrlOrigem: lista[i].url,
                    NomeOrigem: Path.basename(lista[i].path)
                })
            }
            // console.log(JSON.stringify(envioAWS, null, 2));
            //process.exit()
            // Helper.pred('---enviar---')
            await Axios({
                url: 'http://172.16.16.3:8083/processos/documentos/uploadPeticaoInicial/',
                method: 'post',
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw'
                },
                data: envioAWS
            }).then(res => {
                // console.log(res.data);
                resultado = {
                    "status": res.status,
                    "resposta":res.data
                }
                // console.log(res.status);
            }).catch(err => {
                console.log(err);
                throw err;
            });
            // console.log('enviou')
        } catch (error) {
            console.log(error);
            // console.log('deu erro!\n');
            // Helper.pred(error);
        }
        return resultado
    }

    async covertePDF(nome, local, html) {
        let url = false;
        let path = `${local}/${nome}`
        //var html = ""
        var options = { format: 'A4' };

        pdf.create(html, options).toFile(path, function (err, res) {
            if (err) return console.log(err);
            console.log(res); // { filename: '/app/businesscard.pdf' }
        });
        return { url, path }
    }

    async saveLog(robo, statusCode, conteudo, ) {
        try {
            let envio;
            if (statusCode == 200) {
                envio = true;
            } else {
                envio = false;
            };

            let log = {
                "enfio": envio,
                "dataCriacao": new Date,
                "modulo": robo,
                "statusCode": statusCode,
                "conteudo": conteudo,
                // "url": url,
                // "log": respostaAWS,
                
            }
            await new LogAWS(log).save()
        } catch (e) {
            const error = new Error("Não foi possivél salvar log");
            error.code = "Não foi possívél salvar no BigData";
            throw error;
        }

    }
}

module.exports.downloadFiles = downloadFiles;

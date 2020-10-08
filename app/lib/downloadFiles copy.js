'use strict'

const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const { path } = require('dotenv/lib/env-options');
const { LogAWS } = require('../models/schemas/logsEnvioAWS');
const { Logger } = require('./util');
const { enums } = require('../configs/enums');




const red = '\u001b[31m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';


class downloadFiles {
    /**
     * Baixa os aquivos dos processos
     * @param {string} cnj Nome que será dado ao arquivo baixado
     * @param {string} link Url do aquivo que será baixado
     * @param {string} local local onde será salvo os arquivos ex.: /app/downloads
     */
    async download(cnj, link, local) {
        /** Gera um log de execução para ser salvo em arquivo ou exibido no terminal */
        const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
            nomeRobo: enums.nomesRobos.JTE,
            NumeroDoProcesso: cnj,
        });

        logger.info("Url recebida iniciando o download.");
        const url = link;
        const path = Path.resolve(__dirname, local, cnj)
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
                logger.info("Url foi baixada com sucesso.");
            })
            response.data.on('error', err => {
                reject(err)
                logger.info("Url falhou...");
                const error = new Error('Não foi possivél baixar o documento');
                error.code = "Extração falhou no download de documentos";
                throw error;
            })
        })
    }

    /**
     * Envia todos os arquivos para AWS
     * @param {string} cnj Numero do processo
     * @param {array} lista Lista com todos os arquivos a serem enviados para AWS
     */
    async enviarAWS(cnj, lista) {
        /** Gera um log de execução para ser salvo em arquivo ou exibido no terminal */
        const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
            nomeRobo: enums.nomesRobos.JTE,
            NumeroDoProcesso: cnj,
        });
        logger.info("Url recebida iniciando o download.");
        let resultado;
        try {
            // console.log(lista);
            //process.exit()
            // console.log(lista.length);
            // lista.length = 1;
            // console.log(lista.length);
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
                resultado = {
                    "status": res.status,
                    "resposta": res.data
                }
            }).catch(err => {
                console.log(err);
                throw err;
            });
        } catch (error) {
            console.log(error);
        }
        return resultado
    }


    /**
     * Converte o documento html em documento pdf para envio para aws
     * @param {string} cnj Nome que será dado ao arquivo baixado
     * @param {string} link Url do aquivo que será baixado
     * @param {string} html local onde será salvo os arquivos ex.: /app/downloads 
     */
    async covertePDF(cnj, local, html) {
        let url = false;
        let path = `${local}/${cnj}`
        //var html = ""
        var options = { format: 'A4' };

        pdf.create(html, options).toFile(path, function (err, res) {
            if (err) return console.log(err);
            console.log(res); // { filename: '/app/businesscard.pdf' }
        });
        return { url, path }
    }

    /**
     * Salva log do envio para AWS no banco de dados.
     * @param {string} robo Quem está salvando na AWS os aquivos.
     * @param {string} statusCode Status code inviado pela API de enfia AWS.
     * @param {object} conteudo Arquivos salvos na AWS e numero de Processo.
     */
    async saveLog(robo, statusCode, conteudo,) {
        /** Gera um log de execução para ser salvo em arquivo ou exibido no terminal */
        const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
            nomeRobo: enums.nomesRobos.JTE,
            NumeroDoProcesso: cnj,
        });

        logger.info("Iniciando salvamento do log no banco de dados.");
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
            await new LogAWS(log).save();
            logger.info("Salvamento do log no banco de dados OK.");
        } catch (e) {
            const error = new Error("Não foi possivél salvar log");
            error.code = "Não foi possívél salvar no BigData";
            throw error;
        }

    }
}

module.exports.downloadFiles = downloadFiles;

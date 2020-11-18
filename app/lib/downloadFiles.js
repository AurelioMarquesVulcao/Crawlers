'use strict';

const Axios = require('axios');
const HttpsProxyAgent = require('https-proxy-agent');
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
   * @param {string} name Nome que será dado ao arquivo baixado
   * @param {string} link Url do aquivo que será baixado
   * @param {string} local local onde será salvo os arquivos ex.: /app/downloads
   */
  async download(name, link, local) {
    /** Gera um log de execução para ser salvo em arquivo ou exibido no terminal */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      NumeroDoProcesso: name,
    });
    const proxy = new HttpsProxyAgent(
      'http://proadvproxy:C4fMSSjzKR5v9dzg@proxy-proadv.7lan.net:8182');

    logger.info('Url recebida iniciando o download.');
    try {
      const url = link;
      const path = Path.resolve(__dirname, local, name);
      const response = await Axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        httpsAgent: proxy
      });
      // await console.log(!!Fs.createWriteStream(path));
      response.data.pipe(Fs.createWriteStream(path));
      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve();
          logger.info('Url foi baixada com sucesso.');
        });
        response.data.on('error', (err) => {
          reject(err);
          logger.info('Url falhou...');
          const error = new Error('Não foi possivél baixar o documento');
          error.code = 'Extração falhou no download de documentos';
          throw error;
        });
      });
    } catch (e) {
      console.log('erro no Download');
    }
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
    logger.info('Url recebida iniciando o envio.');
    let resultado;
    try {
      // console.log(lista);
      //process.exit()
      // console.log(lista.length);
      // lista.length = 1;
      // console.log(lista.length);
      let envioAWS = {
        NumeroCNJ: cnj,
        Documentos: [],
      };
      for (let i = 0, si = lista.length; i < si; i++) {
        logger.info(`Iniciando conversão para base64`);
        const base64 = Fs.readFileSync(lista[i].path, 'base64');
        envioAWS.Documentos.push({
          DocumentoBody: base64,
          UrlOrigem: lista[i].url,
          NomeOrigem: Path.basename(lista[i].path),
        });
        logger.info(`Conversão do arquivo numero ${i} foi concluido`);
      }
      await Axios({
        url:
          'http://172.16.16.3:8083/processos/documentos/uploadPeticaoInicial/',
        method: 'post',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
        },
        data: envioAWS,
      })
        .then((res) => {
          resultado = {
            status: res.status,
            resposta: res.data,
          };
          logger.info('Envio para AWS foi concluído com sucesso');
        })
        .catch((err) => {
          console.log(err);
          logger.info('Envio para AWS foi Falhou !!!');
          throw err;
        });
    } catch (error) {
      console.log(error);
    }
    return resultado;
  }

  /**
   * Converte o documento html em documento pdf para envio para aws
   * @param {string} cnj Nome que será dado ao arquivo baixado
   * @param {string} link Url do aquivo que será baixado
   * @param {string} html local onde será salvo os arquivos ex.: /app/downloads
   */
  async covertePDF(cnj, local, html) {
    let url = false;
    let path = `${local}/${cnj}`;
    //var html = ""
    var options = { format: 'A4' };

    pdf.create(html, options).toFile(path, function (err, res) {
      if (err) return console.log(err);
      console.log(res); // { filename: '/app/businesscard.pdf' }
    });
    return { url, path };
  }

  /**
   * Salva log do envio para AWS no banco de dados.
   * @param {string} robo Quem está salvando na AWS os aquivos.
   * @param {string} statusCode Status code inviado pela API de enfia AWS.
   * @param {object} conteudo Arquivos salvos na AWS e numero de Processo.
   */
  async saveLog(robo, statusCode, conteudo) {
    /** Gera um log de execução para ser salvo em arquivo ou exibido no terminal */
    const logger = new Logger('info', 'logs/ProcessoJTE/ProcessoJTEInfo.log', {
      nomeRobo: enums.nomesRobos.JTE,
      // NumeroDoProcesso: cnj,
    });

    logger.info('Iniciando salvamento do log no banco de dados.');
    try {
      let envio;
      if (statusCode == 200) {
        envio = true;
      } else {
        envio = false;
      }

      let log = {
        enfio: envio,
        dataCriacao: new Date(),
        modulo: robo,
        statusCode: statusCode,
        conteudo: conteudo,
        // "url": url,
        // "log": respostaAWS,
      };
      await new LogAWS(log).save();
      logger.info('Salvamento do log no banco de dados OK.');
    } catch (e) {
      const error = new Error('Não foi possivél salvar log');
      error.code = 'Não foi possívél salvar no BigData';
      throw error;
    }
  }
}

module.exports.downloadFiles = downloadFiles;

// (async() => {
//   let local = '/home/aurelio/crawlers-bigdata/downloads';
//   let cnj = "00109702720205150063";
//   let link = "https://jte.trt15.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%27QjI/ylKKnoaDpir3SJ5CXTtT/DhfBGY2iGRUPYv2FK7wDCGkTBrN3gJh90f7HYwcsC1WNRmWj%2BvMZp3kl64s5NMp5jmbgKfyEBp8qzpf4dBKVK81yk6FsNY9cPTSDVBhZl1sY9xFgymXYmoXzs7KduvFwPbxrzI2P0rOfhg9ob7e1a6IrbkJ08XHBmcRApWwd0sYTq0cyJKqFwso%2BACBnFE739uZjugayb/eQEYtKa1pgpKvhsfV3bJ6cw9Va8dPjaHHcECaZYgnJSpyKz92gEYnxC0Kf45HESaX0nBS7/jiDf4cKPvuX60YEv9J0VdOgkV8Qa1sUFo81inMT0ErzShiXIMjQ3ydfr4s974CrW6bZBrxh/ew4FT%2BYFL1L1NNbZ/RMMJgOS5xOZ3u7/uXXh2rdlqQIVK6/aSKrjLffTq0tZBUv7kHa3zytsZfaER67xk2cT6gCGVe9%2BkJWMcKD0NHQrxUF%2B%2B2V3OZbwPGHazykbgv1%2Bn/YleVXEYp3DEasJOqR56NYNf1wCCGqwmmnquvJRflt0yY8t1Ygib84qc5gQnhyvMXj4xDhGGbJLwrczz72aMhQ8QbPlrNjfJQtJb9eQnsPr4iw5eaY450AIVJWTo6RPOFaZX00QpjAJ8/dyl2k5sDd%2BVJCBYY/8XQBaeVAP53iakJWMc8DC4zCsZOllR4IC/uUjeLJdXGZA/ym0cne66nMF8M63O8B4R0cFQ3fiLd/AD9amfXC3dBWXUDblKXq5fCck3x4jI1MBlfpYkBodpliB6SFjNiMs65P6dvGe8RueUtwU51BJR5CpLr48pQMXgBMX5qO4aBAwbGnHHU4J%2Bfz98LMtcMzOVgnuZcbDBh3ey2PL7rr%2BVnU7u90GymxfCuybubK/XHUyxdlFMj0qwODhhEwInBhh7aavBO86JQ/n7r5S2sQ%2BcIww/AxPDVGxxe7Dwjc6VwwZ56pk%2BKwh79G8aSB/qrtNNPiauxwFhQQHX9BaI23yGBUU6IUL9UL3w1iQRwWINIXbNZyX4IsW8rsD7eE48C1YOzzDd2fpkBRyl6ErFUeStCZeagOm8/MWJszQ3aCRTwh72IEwkZ809TukZRy%2BIZqJMDukX8JKkAB5NJ9/yF64ZTYO1a8sNpvy%2BS%2Bw/jPWxMUHPQAzw8aZMW00IgselNaebv837pcj9VXB0WBJ1%2BQIvhVIiPaSBsoWsidytrmrqv2SQwhJ25WcMzYr9QwScYqHwvup6ENeeV3ssXUMwQYmzG1Cytdb7gvD5H9XZqoEWemOTpAofz22TWW/9%2BwDSkxKZo3LSo7ZkWBxNIy7CTZZBhRgYnz9YzyqoiS245zCSFpUuHqfCLf%2BgtuAmtk99avid%2B/lbbRkf7syPVd7lLgkRubiYlylgLSMCTk97ojRbo5QnC3tqrcDwypjP6d4gGHerQ6Yukhqc4h89ixkkJ%2BtKnSFWOAU/gx%2BBLZcPdN5CETv2nYKHsbj9dcBy49rQVVLtTs1Xs2OQS8k1VG3xAA2mAhsOukWUu5ZUlZ8KjML3E/9uxP6dIfL2QGGyyRcGnZhrNdiKtNwFuzdXvCGBXLn8%2Bvm16XIdosI9Udh1b0/Qa0el5KHtlNMF5wrHkLVX/n7WMZmPUuxgonX611AgKtqxoW3%2BBtlgtG6oUAr6kVC1AASzZi51nFxhtchelXsvMBSxiB/PBBbrzxr5KZAivlZkG745NiIwYzHPUlCxXp%2Bg4d%2BzsDL7w2WFJ5ovXhiLJCnAZxhpT/dpQDMjPDkNcn53uWYRraM9XZY6E5G3P1fNqiMT2WuolZcoSsVt7bbmwRveGLlU9pnSx3btwjKBNB0pdUTy4/A/WAl7y/bkLglrqsMaZH8M3ZdcQoh6vhmZ3he5DtelVPfcQxQZNLjHi9XqIraNiRWe/KUVp4WoqwhRQfOCdW18D1CKISJdf5i4cEKIOyTNLBLPM6aH/VJiaCk6mupm93Q3o/2brGDT%2B7IZdEqc2gueYS5YyYMWZwlZhjNShfPbCsqrLfbqBsCwJxVvsOqNhT212Y7SvHPhyDb82KKgC%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINR6t/Ofy1u9jvid/wU618J0f56prdpxpwFaMm6PddKw9thqUI5KoDxO5DRlIDHPsYA==%27%22}&Host=jte.trt15.jus.br"
//   await new downloadFiles().download(cnj, link, local);
// })()
const mongoose = require("mongoose");
//const linkDocumento1 = require("../../lib/criaFilaJTE");
require("dotenv/config");
const { downloadFiles } = require("../../lib/downloadFiles");
const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');


var URL = "https://jte.trt2.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%271MlBvFDarfOdNz4C8qqmmGTGmz%2BU0lDSqjDLuv92HYjJ8iGP8LgoqXWlVOT/28ua5npL3NNxSWQXVDj6W2z9HHPYE7UTUFn%2BnerujbCHJS0oAhb4ce0rlCye8VSGaxo5n3q7wYD2v/b1RFZQeQfay39nGB%2BzCBj/CPnhkxVUSLzxtAQOPKHSMqJ992B4rMin5M3fav5IRSvAaZ4mctLW4LDW23eDgRr1mZc1qq%2B8SmyLHpRI9rrbW1nU1DRfgGM6alpynFAcFYtU4evaZEI0XTnv8oBjblVHp4I4S8ViWJtJbrPJ4JMcXc9icxzKLziOcIjVUpO51Y2ZNlSUp/kPqfyOCURPZBpSGYx48/nvwCp71L6NcX/ID8tdIRcZrlq1m6%2BBn9uXF8im7qJbtWN15yJNhdd9i0EpSR%2BZCDbmIFFvsVo0T/A6k7R/mbsTA3wRtOiW/qRRPRcW6vTDjtuHNxr6BR3CuBjUCcJqtd9R3SR3QcBctFN94NLE1P%2BJIxsVEUUj/MNB2IF8IAyhAgq0XLDe673saB7H/tb61IqluZJNMNC58KOpphoks9SkoeL0480jRxvUGZXhXmIOGp8ZREXcASbLT6yzd7uBf%2BNmfoqbCiZ3Lyv%2BK4uoxAYrWS%2Bw%2BIFNIlYPSzNzha2DgGGQ8%2BWBPsq0LCXTH2Tb7nUKlkWbsLof%2BHPD%2BE9C600GErmJy2ATU4jONcPmAxq/T%2BQ2WN9ZPatHQdYF12pRCkHcl4yl%2BvcJ9CGMVt8Man/VhbGa/3CpCKvrBSNh3KUJASretujIh6vrsSVMA2g4QgtjdwBShYkRjW6yysFkpjkz8Yvcxsi6YPn8tuWuvIH4nDupt4TOUMICD5FgzHAd9AfYXVFJP3rZ0VkVtsE0p41Gah7dxmOhaxyV6JcSZxjjWhMe78JqehNKcdkCwa8KMicEz6LMY//t%2BYWNKjaFDWPN/XFPrurp1H/%2BKwKk5JeCfzPnVvMC/Z2EBCSI6jkS%2B2O22BVpKeVnVdFdBR2PRPZhe6iIKRiTyc%2BDhlHTtE8CaLzpdh/Iz0o0Z78ObOdq1nAmUiYGVdvTe%2BO34L6v2BqI/GEtgh2jo7mFJygIYQF4vNgICE8aa/oRR1kurKblJ3eGhxBgJfugbWvjXw0wT89wah3A/c9SSPWUJt92bR7QhoG9V64mwyRqjdYOkLdABaFsCz83quawEs9hfhEe8Lk/dNcNCbO9eAjYEnTzgBfRfUbZTG7mXdXl5G5A14C7gZ2C5SLdinUtrcrIBeF4D5yFj5OPTK2Cdvn%2B1Zln1aqbt4wn9aNrgExuBHaS4hmB2hbobJxXHdiiyZ94LUY6L/WHbrQ4wbz%2BOwLc2irIU5AXxPHXVA/15Y/3cmKkGRfYHNvmcXJxfzLCKFAGMlRpIH0KXnsETYZko8baKeJKYVpsDjtDKOcLcC8MmqXOMLiBknlRwkQECkVUHhg6p8emY8Xhk4zhlHxwG/lJqulMarCc%2BwMF6vFr1GY4IUlDdhL7%2BqKe%2BVemkCynJH90P4/l2d%2BoaFkmNFGO0US71bLXiLm6Vet4ZQISS4xW5p73S6IUS04Ptd522zWf/rzqfhvM65k%2BY1qMp4Los%2BaAJt2vMvCQyJHZz1Qc5x3lhZHxo32d8unPG8lXdzi2oHj/tFQyJvbYM7CwNOyOw6GlFHNYPSoiv6WPbsiVkslo6i09zsa54iR8eGr759%2BNJ2S5Jj17b6duSmaWTEYkSc53a8K3kCok6N23rO6laYQxN5gmFq4%2BvnGxlr6v0tjAlFd8OYLAJBs9ZPg6vFuJAzuR3ewFYqIol0OZW1psnbcJo7pWxWfSL9xl5w0AN59TdLmOpuRzYozly1bolc/DVk1df8EuCf5WG6aeufOS%2BIbD2Qjrp8eNQ0X4qLQFw8DYYWG9PrqJnSm6YCs9v28YSRUOqPOm9qC%2Bf8jGSQhjG614eKF3Awz8c3drkUKs0NXLxFDQsqL0eqVtj/jpt9mm2NqOwB0wlzaI89DMqpsO8cnqz29TCGF1uGAHh4TCDpbRb4tgW1TIlredGRLKW7neMsYBVth1Okbra0l9gfVuDqka/CvDjAtYGgST8UHo/vTho4eu7BSM6cy7aLSMeXc7Zsv228vtCNQZ2Bz7U0lDMx%2BBdFpWs3CQMy5LC%2BE=%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINcv/RRaYj/nzfn%2Bopwg41ZHZcAtUTFAKS96upNMJPCjRPTJKitIFUK3wF77LfbK3aQ==%27%22}&Host=jte.trt2.jus.br"
var linkDocumento1 = new mongoose.Schema({
    link: String,
    movimentacao: String,
    data: String,
    numeroProcesso: String,
    tipo: String,
});
var linkDocumento = mongoose.model('salvaDocumentoLink', linkDocumento1, 'salvaDocumentoLink');

class Arquivamento {
    async busca() {
        //let devDbConection = process.env.MONGO_DEV_CONECTION
        let devDbConection = process.env.MONGO_CONNECTION_STRING
        mongoose.connect(devDbConection, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        return await linkDocumento.find({ "numeroProcesso": "0020453-31.2020.5.04.0405" }).limit(2).skip(2)
    }

    async download(name, link) {
        const url = link;
        const path = await Path.resolve(__dirname, '../../../downloads', name)

        const response = await Axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        })

        await console.log(!!Fs.createWriteStream(path));
        await response.data.pipe(Fs.createWriteStream(path))

        return new Promise((resolve, reject) => {
            response.data.on('end', () => {
                resolve()
            })
            response.data.on('error', err => {
                reject(err)
            })
        })
    }

    async salvarArquivos(listaArquivos, numeroProcesso) {
            console.log('\nfuncao de salvar arquivos');
            const cnj = numeroProcesso.replace(/[-.]/g,'');
            const directory = `./assets/iniciais/${cnj}`;
            if (!fs.existsSync(directory)){
              fs.mkdirSync(directory);
            }
            let i = 0;
            for (let arquivo of listaArquivos) {
              const nomeArquivo = `${i}.${cnj}`;
              const path = `./assets/iniciais/${cnj}/${nomeArquivo}.pdf`;
              // console.log('antes de gravar o arquivo');
              await axios({
                url: arquivo,
                method: 'get',
                responseType: 'stream'
              }).then((res) => {
                console.log(`gravando ${nomeArquivo}`);
                res.data.pipe(fs.createWriteStream(path));
                console.log(`gravando ${nomeArquivo} - OK`);
              });
              // console.log('despois de gravar o arquivo');
              i++;
            }
          }
}


let go = new Arquivamento();
(async () => {
    let link = await go.busca();
    //console.log(link[0].link);
    let obj = link[0].link;
    let nome = link[0].numeroProcesso + ".pdf"
    //console.log(nome);
    //await go.download(nome, URL);
    // Example call:
    await go.fileToBase64("0020453-31.2020.5.04.0405.pdf", "'../../../downloads/0020453-31.2020.5.04.0405.pdf'").then(result => {
        console.log(result);
    });
    process.exit()
})()

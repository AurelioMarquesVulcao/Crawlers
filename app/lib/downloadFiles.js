'use strict'

const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const { path } = require('dotenv/lib/env-options');


class downloadFiles {

    async download(name, link, local) {

        const url = link;

        const path = Path.resolve(__dirname, local, name)

        const response = await Axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        })

        await console.log(!!Fs.createWriteStream(path));
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
        try {
            console.log(lista);
            //process.exit()
            console.log(lista.length);
            // lista.length = 1;
            console.log(lista.length);
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
                console.log(res.status);
            }).catch(err => {
                console.log(err);
                throw err;
            });
            console.log('enviou')
        } catch (error) {
            console.log(error);
            console.log('deu erro!\n');
            // Helper.pred(error);
        }
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
        return {url, path}
    }
}


// new downloadFiles().download('teste07.pdf', 'https://mob.trt4.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%27ejBZPgeKYh9ObgjLWNmUlwLqnzeSxO6MsOjVzqFkPdbhJpcxyqQ52GwpL7RN1iphefcXDjgCmx4eQcEle4r3B%2BFiAE3NAexCsz5TktIWm3JaFlXNyGoApchsAWjo6I3nNkrL3CoYWqpoS4kclWi%2ByFKx504X5eHrD3sufcAVmRvtMsgPdaVj72CoexzxVchUzB2LEXlPMgNf6jULveXK55kLhegR0nO1vm2sTwgqG96o0Oa3ZD9QVWoEnhefCPzn9NQmyUuU2v2nQzYGeCza6OdbM2CLn2jeqyylsplQN%2BCELXeRj1uZJ5QoY2nZRBnSZ5IY3XeGFaGrEWL4xlNc5Y3%2BtKlYJmebP3qxVmgJ0xEOC5Jv0h5Arvr%2BEHoIRrhGurkjWEYqwXqoj4s4dOzjblShTa6QwppHMUnyft8mKcBx65hjYrp1vWS02uFECjvesU55RpICmBxBhVz4x6O0eKeyBuJ4mN2nwG6L8MkIrWW8M7gEmx2P3KZZiMC7ibmedJlj4BRj%2BP9SoKZK76JWuU%2BXg8seJp8gC7zd8wylyYozIJTjCwccLV58B0rcUuefLuD5tjtkobnXjH2VZzsf3I1nK9FbmoQ46xoIMX4HMbn6jaxWfkfeCme68qL0jsdfOCNDfYoFNXjhtcDk5yCbe5EoheoApqZLi1f88SJdA%2By7dyn5LkT9eFVgho/3/gAOJ%2BlKYSWswdVPufIiWqgWnfgte7Vr9bQPFhtu1bDHBfSmynsxh5nyhjRs2vrn234giF2fNVRTOTAN8ECxlTQR2KIJ84F6r%2Byp//BjHZHOTNM%2BnDdAPYaWvSoEle1I0YHSBSK9txlCtDMS2cCw9MA/PYq5viwIBfjSFX9gAVkhRNHYfL/fzH6dAHxtqrllDu0wEoul3USCAvP8nUnkfp0LNDHGL64UVrkSUCcly4ZE314OwGrFg78UrnGjxUqt8SUfRe3bi/wclTVDYPlFixTP97ePAXDfS1pwg3%2Bem7VuUPJXIr7YtWh0SXhgg61JT2ORJMTIaSNZ2MQ1/WkOgjnG0bXzjQWNEAQxbe/1buTxW6M2uxBaFEIsS2ygR1rPevNkbH34Dgbi07J4MPHkRO3SrP7pt6CajbtgVJkDd%2BMbNMceKVyd8jKP0akWo%2BgVCDLuPIQG07txoObN/FKxbA5GFitbk/Fw3EXXgPmCjW7tCRjpvLO%2BOXXmCDasF2jj0befdPjDYDcDjyNgT2cUV/pbNrWLVACeWcoenEvXlQV402jlJIkT4vN32U%2BliutN9MaZTZISRqbXnIKx0InPXgcfz4cdQ77tvLoTHgxsua0/h2aKaHYQChfqlOHZRMd8ALgogGsQb/u319wvcH0/1xA0Dbs/NdSIfWIYnx7a6K8mbI9L8KUl9SW5kVFU%2BEAXVLu7ChdWtTg19nP9qYmKyC9n9McH7QOWVIFtlMcrFX%2Bz0ULNTViuHlBv%2BF4UpnjDWju7jWjqBlLpO2E4iZlBJrEBkYwq9Q0/P7xkDQ/KYjrQcWjWEWhL30DgHXMOGusDIeZ0Xvuy68Rya5A5ilEPnLMjIvLWLAf9dy9uKOXmN3EH/2zGp0M8BWe1o4Bl6lhMouFgN4RsQH1eDA/h6%2BWPX2SyfqmRPdTT31MAGhDCl42YeWQYOptWBAwbh1c%2B35ISwyGLV4cSkpy52D/Dza5jcUbfFse7Qa5xiXmMTsskycZOU0jKRE70Ee/MgM5qAmr2TboFkr08Ss5dbLWjHwjg7ggH8M0xB8LkAgWKLkz76qoULI1Lt/PFD08siu0EYduktjmZ0Ce%2BgsUZXQcnk1gUSTeX3wFS6yuwQ29iP3Z2G3ZGX4QiFQd3I0nUiQ//m9bPOwYvxtwdkFo4WxMqJ85uW97ahlQcezUEJLBKurO3bRnWcySaV2DAvBCsgwT8mdTPznSogjrEEm7POEGQRVFb9ws4jXqZrZ8RcXWDAEdfhXlcAARI37YhG9D8nMJP68U0ZrZHV7x5uR9z%2B9Y53zds2fS1U2vWKSlyVHhrBD7DWQ6lgAzEsYf/21KEpW0quLMUPWmqe7mRipNYMiGbjJS%2BXY2mxgaTr6Sv7y7TaTzJTV4Y29jHp1xP3YWbQThhUhRZlA8OomcaJi3CQm5rBN80uQVLZvh62SHAchuh0fQEPQzekqE=%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINfQhBrdEDeFtlOZVbLSkUoR5GFHDmrgphpXVtgAq3Omd4/vhR92yhwiRYCGm7wbOIg==%27%22}&Host=mob.trt4.jus.br', '../../downloads')

// new downloadFiles().download('teste04.pdf', 'https://jte.trt15.jus.br/mobileservices/consultaDocumento?json={%22header%22:%22%27QjI/ylKKnoaDpir3SJ5CXTtT/DhfBGY2iGRUPYv2FK7wDCGkTBrN3gJh90f7HYwcsC1WNRmWj%2BvMZp3kl64s5NMp5jmbgKfyEBp8qzpf4dBKVK81yk6FsNY9cPTSDVBhZl1sY9xFgymXYmoXzs7KduvFwPbxrzI2P0rOfhg9ob7erlujU5ffNOIrdZF7J54A8KLZvrCHRM3JaEIiZZyUVD0KC2Hox6A/Lke12agSOgU%2BWLhXvbsEOuDSe4rPCyKSR7Egx0/49F7owtL%2BM1c0EJySqkRol7oABmzvYuUqhfknmsz0yK0Erp8nymxTZxa%2BfYSePZdv37yC8dq9e%2Bi5Ih8vtgn6TyGQ/g9hqLGs6iJhZckvG5v88fujJzKcsqsc7wjurC6ziv5FdJbKfNMo0cPWtTKvZJ7yej6kenMA4GaL3jbteyx6paKBSsan3qj1Wpt%2BU46u1R9AsAmr7M4giDTxG92ZRcoJ6KfTLzxHzQ8e9ExfyqVb2Os8hoKweAPRjgPD7dWtWNGkoBem4rRq2kF/37dvFTqKf3XkhFHxVPcEEp16nz4toCPDniBK4ElmacttxruHiuBDzE2G35TQL323fUJHD6El%2B6DRg1R%2Biro3Zlb6dDHsC0PL%2BqG44u7jGvm8MoZ2FFWQJOU4Y/NNfXg1VRxvZEokCAIwKvH1sbVcW/DoYiQRGJIgW1XI8ETDDIpd/i0dXBkOKLeK0nsU3Y6qfWCQKmSCWIc9FCcNjwH/%2Bo9kE26ZtotSmCRj1MWqYhqLY3Ay7Wja0iy31yYlhL2Tha7QeNwy2nByafPrHRgM%2B2Bq7CfvjIflNcTyht1eN39ejkExfR7Db9TOnclAqvPbNTorHj3eKmLwYAS2i3%2BzNcyMOymlfCNgmhfxS7OAoVy%2BT4INipS3JKocJwygShhVcCTYLoGaF2wRXoL2O2RmpLRJqOKgpt4sApAfihr0Lwb0sG0ih8YwEV30KikG/twGEnWsDmCmTfk/nYzTpwMKT4uwtVOpqIIpY/EijZbb9Fobaark9KXRLzfkU5Mj2LVPB3XzTiuLA/F2SPQFnZvvep0Mq3HsIL/889HHKj%2BpeUhmUqyRESMkE9qTXpXsnkf9E2Yz/smr1TkwlbpNdH2OM/JYi%2BgWbW8WNtkjwduTANV3Qvbd/Jpau6vrdfRD3QlY/JM9brI4xMDUAmNETWaKpL8MlE1C30vS5QspRSCav0jxzYpzZjvrqbaClzgbxA3AnZMj0t6qrCuiRnGjJYVvf9tK/Nudgi3SDPVI1Ulc16oGwqmIAngIw5pSPSA6QB1Kzhyt%2BEb/flcmTzWr9ug9FNfbF3AMNUPNaNvInuKIJ%2BxvrIF9vTXosJtXJfk1CNLdvJLTlsjn5ppTJOcXcJKi5M08STbMHE0qXmZWKzE9gU9FeJPQsaRPhQB%2BAY8odVLjWT/2HLGOtHZGgu9Uhne%2BzS47CXgfNwDV14z58SSMu2epEalXnLuJUWMBUBHWpsZaEHs2nCLljzCQZ01046gyaSQbArdsZqim3r3UegQ7uSH4xBCKKpKR%2BwKJKNRp0U5EZ9Ihi9f0m64Gx%2BHZWsE6Ub//UzGf%2BAOwKFOUdQ80i2S6YZ1eWOrflXaN31Gg80xIqTWpn%2B/UCkEXEnDRXNotRKJENLK4/GyRz/3o6s4e8VdtTjZ7qTnesRBCAspbXyuoJZ02IDuREhivyQu09f/sbnN7egPyoBk43n2OFjWwotADYXKSskwvAYBpHOMdaBhRUV2kYdE39fSruo15lZu/dxwwIcTfQg48YVqZaAr2KV3eKPpG0zomiycl2LrQ%2BFxAcgcOoR2DbCJZp9QZUONx8c7rherOKJWMv7hb9S61hsNqkbIzJhhlD/n8P3HmAMYUN0%2BDwOdneLq3/XSX5pGsV9/Eq6YZISlF/evBynfn%2BeeR8lblVOvs%2BuouFkFDpAKzeBrcvBAWzUht3w1ybBcSgZDR1liTxxWRry/RWWSfIh/0Jv8BWb2ypRsmrpO6SKsIz3iG0gxm3%2BwpI%2B2BHPOXkLPEXzAKryMZlcoUm1cI%27%22,%22body%22:%22%27KlcbPnEQqJpm8IEz2JxINVCRp3A0fNZFDmWdvT5IAfDK1%2BJPzzVYxtzwySZCQC%2BHbbPjKAXM9dtEIAbA1Go8Sg==%27%22}&Host=jte.trt15.jus.br')

//var texto = `<!----><!----><!----><!----><iframe _ngcontent-ujc-c21="" style="width:100%; height:80%" src="https://jte.trt9.jus.br/mobileservices/consultaDocumento?json={&quot;header&quot;:&quot;'5LNzIDAyZUwjQXI7rMjMPs0XtaStFSeic0Ze43ZGhD5QWlI2vt/wP4EzN86UFnz2gV30ql6ivo9eujiuhdmTJwN/96G65NXFFrCIv8eAzo08pS0a0S7uq51Rds/JOZehvaP11BpZ0sSpCiIeLTRRNRowxVFUb%2BW1aterziHIbTKbwrhU1waEBz7UTlIXlvzh8/rulptDkprv4HSVHFXbwM8v5OQ3SkP26OnmKvoYE9HwqGozCdziblg8%2BzlWf7AoaR%2BK5QdYBoFCB6PtdZm0D2DsuDb%2B8gGqH0bSNIYK4%2Ba57/R/EeFoz3K9u%2B0%2BcsOz96jhaQrVFg%2B4o4DelTpWd4Qy/x/PNdJxNu%2BTwJllr4OPpJqCXfZqZc0ZNjwKvoLjN7t2pwfs26bkHD31nR2HlxdmuiHayNz/xpTFreUKdHABGx59Iodg%2BxwXaoR16l/7LsPfcloiFLqFP8kr4OcUVsWbYf7x5RZLtm1uAqRYkq1nltdI1d9%2BOEu8uLvlfqGRe5TF/m8T6DlP32lLc/qsK7fg1/BjMlzKkEry881tvV%2BGMe099v02EgdUZwixyEZde%2BjLubg9AVfhggZ4labOpbtUrvO6m4cYLkDvWlXCFN6i0bAcMhCKLfGYIiUiU3EZOls4r2pcyvzhjR84VXGvQMl0iPa5%2BZr8yUKN704ta%2BZ7JM4I3r81iA1/LUz3XmWBBKZaTuHrcfBE6IArRvBav28HrckLIgCGkBlrlHRzj/Rw2XOqM0SEDcexdKDHnty1peUhTcrxfU8Rx/1nc6ybJhIUSIv0q7JsE/90l80rpMJbyw4TcfZEnTcUWY8cP8ujbfv%2BUYfExaIHWb0R/0xLqpzjH40zkz0nn6/4w2mEFrzWmqkT9blq4vqvSkaiWhe/TvnIhz9Oga0fayhQI6CLDzYBiQrgk6PvIJr8iwClYHFr7Mgb4zCLd7gTnO5%2BIX9Gcg9He3oobakrC%2BRP1OlvKCUChkeDsl0dik2VEd705lHznX7lox%2BfSDnqyLiBOxUTuYB6VwRAd3OkgYpt/nnYCdCQN1PJBn9159Rc3whls/mRAoMu08%2BfwdwCfFV2PDNmOrtOMrIwA9aqeXUqTowfLrZTpmelz1yiAFI3uqN35d%2BocE4aJVXzLGjfcAzz5s4OtnUZfCxRCKQ8IlNjByKtdsw3uMLq9e58LyjbrzyVSLCbQB/XbvVpN7mEztmHLS2w54I0dBFyvN0bycPFzVaoo2WatslqgA%2B6wRuDpPIPk15%2Bdwa/bxU6J2m326YjH4SDHCSHsyghuZTgDIyOzI7xdj7LYrgoz1TzFtQo2Eu3t%2BIHwkT/X19kemyxQq/wo4Yan4GoP0XOvsNmI3euR5exHrxFWRiS9r3rJ6N06OGkxHopIx3lxqPmD%2BaUIuZdFhXKw3l9f2LAQXJX//G%2BtOJVx66WdT5/Zya4abPjhhQ4%2BJHVGwJzSBxHMauSp2J1LiFCJbB79K%2BNGE3MChgLi/EgHBGzYHN2YxUVwLxUrnLTIwLER8XJ1hgQdDo3LF2KYZY/x%2Bx5efiY0vb25tkyeeoewiJO5640f9V1c9U4k2/8YqfkFsqcYNeccqSSAmLYvvzW5b2vFekEP35vBtGcVskngnD3Hf6aJQ3W9SlqaqTvM2GVq1vtSZrz/70qjibx2A/OSFRFOK4AIqaUqNL%2B5GcqFdGokLi6IFVhhZmQka%2B0VyI168SzMeWUOPOSyYKnS%2BWRLnJbcbu/Aou9nUqCiBL1IBE0eFzba3QtQPNf2xz7MnzqmvawsSHof6RkuNRv3G8pusOE4t0DcqDVApThJdx%2B%2BUdKUMTW4Bu%2BUBMvUKXBUIrkbLV2ad7BsRMQjS3fEuEpBWctbeOQDUatN2KHq/8UFq1qZti%2B56spcK4aHSZHazy/Nu1ZQIdAvnIVX8v8EaA/0g/HacMaE8h/XvXS2mibqQ/MlQ%2B3oE%2BeRIgtzvcwbIYRETioxRIwZloDncm1v23I36K/0FbVixwl02kRATaJrhOB9/3TaIShscn/%2Bxc1n2ZTtZvxTxNXiFoV%2BOlYZnbT'&quot;,&quot;body&quot;:&quot;'KlcbPnEQqJpm8IEz2JxINaP7/rQcVLtIZG8sqtRWAd22QvFpQ95syiUJrVcXoIlEePFRJ2A0b51tC0gSk%2BhR3g=='&quot;}&amp;Host=jte.trt9.jus.br" class="ng-star-inserted"></iframe><!----><pdf-viewer _ngcontent-ujc-c21="" hidden="true" id="documentoEmbutido" style="display: block;" _nghost-ujc-c27="" title="certidão | Documento Diverso (RESTRITO)" class="ng-star-inserted"><div _ngcontent-ujc-c27="" class="ng2-pdf-viewer-container"><div _ngcontent-ujc-c27="" class="pdfViewer removePageBorders"></div></div></pdf-viewer><!----><div _ngcontent-ujc-c21="" hidden="true" id="movimentoDescricao" style="width: 1px;height:1px" class="ng-star-inserted"> certidão | Documento Diverso (RESTRITO) </div><!----><div _ngcontent-ujc-c21="" hidden="true" id="movimentoId" class="ng-star-inserted"> 80053745 </div>`
//console.log(texto.match(/https(.*)br/));


module.exports.downloadFiles = downloadFiles;

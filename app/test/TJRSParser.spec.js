const chai = require('chai');
const subset = require('chai-subset');
const axios = require('axios');
const moment = require('moment');
const querystring = require('querystring');

const { TJRSParser } = require('../parsers/TJRSParser');

const dataAtual = moment().format('YYYY-MM-DD');
const dataFormatada = new Date(dataAtual).toISOString();
const mensagem = {
  "ExecucaoConsultaId":"123123",
  "ConsultaCadastradaId":"123123",
  "DataEnfileiramento":"2020-07-06T12:31:01.583Z",
  "NumeroProcesso":"0392552-58.2014.8.21.0001",
  "NumeroOab":"41E246",
  "SeccionalOab":"RS"
};

const acessar = async (url, data, method, encoding) => {
  return axios({
    url,
    data,
    method,
    responseEncoding: encoding
  })
  .then(res => res)
  .catch(err => err);
}

describe('Robo TJRS', () => {

  // describe('Extração de OAB', () => {   

  // });

  describe('Extração de Processos', () => {   

    const cnj = mensagem.NumeroProcesso.replace(/[-.]/g,'');

    console.log(`\nExtracao do processo de cnj: ${cnj}\n`)

    const apiUrl = 'http://localhost:3033/api/mock/arquivo';

    const parser = new TJRSParser(mensagem.NumeroProcesso);

    // it('Extrair da capa',(done) => {

    //   try {
    //     const arquivo1 = { "path": `/home/www/prazo/crawlers-bigdata/app/test/testCases/TJRS/${cnj}.html` };

    //     axios({
    //       url: 'http://localhost:3033/api/mock/arquivo', 
    //       data: arquivo1,
    //       method: "post",
    //       responseEncoding: "latin1"
    //     })
    //     .then(res => {          

    //       const capa = parser.extrairCapa(res.data);
  
    //       if (capa) {
    //         console.log();
    //         console.log(capa);
    //         done();
    //       }

    //     });
    //   } catch (e) {
    //     console.log(e);
    //     Helper.pred('Catch');
    //   }

    // });

    // it('Extrair de partes', (done) => {

    //   try {

    //     const arquivo2 = { "path": "/home/www/prazo/crawlers-bigdata/app/test/testCases/TJRS/p03925525820148210001.html" };

    //     axios({
    //       url: 'http://localhost:3033/api/mock/arquivo', 
    //       data: arquivo2,
    //       method: "post",
    //       responseEncoding: "latin1"
    //     })
    //     .then(res => {          

    //       const envolvidos = parser.extrairPersonagens(res.data);
  
    //       if (envolvidos) {
    //         console.log();
    //         console.log(envolvidos);
    //         done();
    //       }

    //     });
    //   } catch (e) {
    //     console.log(e);
    //     Helper.pred('Catch');
    //   }

    // });

    // it('Extracao de andamentos',(done) => {
    //   try {

    //     const arquivo3 = { "path": "/home/www/prazo/crawlers-bigdata/app/test/testCases/TJRS/m03925525820148210001.html" };

    //     axios({
    //       url: 'http://localhost:3033/api/mock/arquivo', 
    //       data: arquivo3,
    //       method: "post",
    //       responseEncoding: "latin1"
    //     })
    //     .then(res => {          

    //       const andamentos = parser.extrairAndamentos(res.data);
  
    //       if (andamentos && andamentos.length > 0) {
    //         console.log();            
    //         console.log(andamentos);
    //         console.log(andamentos.length);
    //         done();
    //       }

    //     });
    //   } catch (e) {
    //     console.log(e);
    //     Helper.pred('Catch');
    //   }
    // });    

    it('ExtrairProcesso', async () => {

      try {
        const responseCapa = await acessar(apiUrl, { "path": "/home/www/prazo/crawlers-bigdata/app/test/testCases/TJRS/03925525820148210001.html" },"POST", "latin1").then(res => res.data);

        const responsePartes = await acessar(apiUrl, { "path": "/home/www/prazo/crawlers-bigdata/app/test/testCases/TJRS/p03925525820148210001.html" },"POST", "latin1").then(res => res.data);

        const responseAndamentos = await acessar(apiUrl, { "path": "/home/www/prazo/crawlers-bigdata/app/test/testCases/TJRS/m03925525820148210001.html" },"POST", "utf8").then(res => res.data);        

        let capa = {}, partes = [], andamentos = [];

        capa = parser.extrairCapa(responseCapa);
        partes = parser.extrairPersonagens(responsePartes);
        andamentos = parser.extrairAndamentos(responseAndamentos);
        
        console.log(capa);
        console.log(''.padEnd(50, '#'));
        console.log(partes);
        console.log(''.padEnd(50, '#'));
        console.log(andamentos.andamentos);

        andamentos.links.forEach(async (link, i)=> { 

          console.log(querystring.escape(link.url));
          // console.log('https://www.tjrs.jus.br/site_php/consulta/consulta_despacho.php?entrancia=%201&comarca=porto_alegre&Numero_Processo=11403086347&num_movimento=194&nomecomarca=PORTO%20ALEGRE&orgao=Projeto%20Refor%E7o%20-%20A%E7%F5es%20de%20Improb%20Adm%20e%20Penais%20(Crimes%20contra%20a%20Admin)%20-%201%AA%20Vara%20da%20Fazenda%20P%FAblica%20do%20Foro%20Central%20:%201%20/%201&code=1720')
          // let responseTeste = await acessar(link.url, null, "get", "latin1");
          // console.log(responseTeste);

        });

        // const dataAtual = moment().format('YYYY-MM-DD');

        // const capa = this.extrairCapa(content);
        // const detalhes = this.extrairDetalhes(content);
        // const envolvidos = this.extrairEnvolvidos(content);
        // const oabs = this.extrairOabs(envolvidos);
        // const status = this.extrairStatus(content);
        // const andamentos = this.extrairAndamentos(
        //   content,
        //   dataAtual,
        //   detalhes.numeroProcesso
        // );

        // const processo = new Processo({
        //   capa: capa,
        //   detalhes: detalhes,
        //   envolvidos: envolvidos,
        //   oabs: oabs,
        //   qtdAndamentos: andamentos.length,
        //   origemExtracao: 'OabTJSP',
        // });

        // return {
        //   processo: processo,
        //   andamentos: andamentos,
        // };        

        // capa = null;        

        return new Promise((resolve, reject)=>{
          if(!capa || !partes || !andamentos) {
            reject(true);
          } else {
            resolve(true);
          }
        })

  
        // const capa = parser.extrairCapa(responseCapa.data);
  
        // console.log(capa);
  
             
      } catch (e) {
        console.log(e);
        return e;
      }
 
    });
  });

});
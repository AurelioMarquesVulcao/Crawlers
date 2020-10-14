const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const async = require('async');

const { GerenciadorFila } = require("../../lib/filaHandler");
const rabbit = new GerenciadorFila();


const red = '\u001b[31m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';



class Busca {
  // constructor() {
  //   this.url = "http://172.16.16.3:8083/processos/obterUltimosSequenciaisPorUnidade";
  // }
  static async buscaBigdata(tribunal) {
    let url = "http://172.16.16.3:8083/processos/obterUltimosSequenciaisPorUnidade";
    let resultado;
    // try {
    //   await Axios({
    //     url: `${url}/?orgao=5&tribunal=${tribunal}&ano=2020`,
    //     method: 'post',
    //     maxContentLength: Infinity,
    //     maxBodyLength: Infinity,
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
    //     },
    //   })
    //     .then((res) => {
    //       resultado = res;
    //       // console.log(resultado);
    //     })
    //     .catch((err) => {
    //       console.log(err.config);
    //       console.log(err.response.data);
    //       throw err;
    //     });
    // } catch (e) {
    //   console.log(red + "Falhou" + reset);
    // }
    resultado = [
      {
        "Orgao": 5,
        "Tribunal": 1,
        "UnidadeOrigem": 35,
        "UltimoSequencial": 100765
      },
      {
        "Orgao": 5,
        "Tribunal": 1,
        "UnidadeOrigem": 343,
        "UltimoSequencial": 101065
      },
      {
        "Orgao": 5,
        "Tribunal": 1,
        "UnidadeOrigem": 23,
        "UltimoSequencial": 100825
      },
      {
        "Orgao": 5,
        "Tribunal": 1,
        "UnidadeOrigem": 72,
        "UltimoSequencial": 100815
      }]
    return resultado
  }
  static async pegaEstado() {
    let resultados = [];
    let estado;

    for (let i = 0; i < 1; i++) {
      console.log(`Pegando o estado ${i}, aguardado resposta.`);
      estado = await this.buscaBigdata(i);
      resultados.push(estado);
      console.log("Extração concluida!");
    }
    return resultados
  }
  static async criaNumerosCNJ() {
    let resultado;
    let estado;
    const estados = await this.pegaEstado();
    for (let i = 0; i < estados.length; i++) {
      estado = estados[i];
      for (let j = 0; j < estado.length; j++) {
        this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem);
      }
    }
    resultado = "teste01"
    return resultado
  }

  static organizaCNJ(ultimoSequencial, Tribunal, unidadeOrigem) {
    console.log(ultimoSequencial, Tribunal, unidadeOrigem);
    let sequencial; // = ultimoSequencial.toString();
    let tribunal; // = Tribunal.toString();
    let origem; // = unidadeOrigem.toString();
    
    console.log(sequencial, tribunal, origem);
  }

  geraSequencial(sequencial){
    sequencial = sequencial.toString();
    if (sequencial.length < 7) {
      let zero = 7 - sequencial.length
    } else {
      sequencial = ultimoSequencial.toString();
    }
  }

  criaPost(numero) {
    let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true}`;
    return post
  }
  async posta() {
    await rabbit.enfileirarLoteTRT("nomeFila", "mensagens");
  }
  processArray(element) {
    for (let i = 0; i < element.length; i++) {

    }
  }
}
(async () => {
  // await Busca.buscaBigdata(2)
  // console.log(await Busca.buscaBigdata(2));
  console.log(await Busca.criaNumerosCNJ());
})()
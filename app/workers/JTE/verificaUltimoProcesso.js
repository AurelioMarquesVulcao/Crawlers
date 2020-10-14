const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const async = require('async');
const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');

const { GerenciadorFila } = require("../../lib/filaHandler");
const { statusEstadosJTE } = require("../../models/schemas/jte")
const rabbit = new GerenciadorFila();

mongoose.connect(enums.mongo.connString, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on('error', (e) => {
  console.log(e);
});


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
    try {
      await Axios({
        url: `${url}/?orgao=5&tribunal=${tribunal}&ano=2020`,
        method: 'post',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
        },
      })
        .then((res) => {
          resultado = res;
          // console.log(resultado);
        })
        .catch((err) => {
          console.log(err.config);
          console.log(err.response.data);
          throw err;
        });
    } catch (e) {
      console.log(red + "Falhou" + reset);
    }


    // resultado = [
    //   {
    //     "Orgao": 5,
    //     "Tribunal": 1,
    //     "UnidadeOrigem": 35,
    //     "UltimoSequencial": 100765
    //   },
    //   {
    //     "Orgao": 5,
    //     "Tribunal": 1,
    //     "UnidadeOrigem": 343,
    //     "UltimoSequencial": 101065
    //   },
    //   {
    //     "Orgao": 5,
    //     "Tribunal": 1,
    //     "UnidadeOrigem": 23,
    //     "UltimoSequencial": 100825
    //   },
    //   {
    //     "Orgao": 5,
    //     "Tribunal": 15,
    //     "UnidadeOrigem": 1,
    //     "UltimoSequencial": 815
    //   }]
    return resultado
  }
  static async pegaEstado() {
    let resultados = [];
    let estado;

    for (let i = 0; i < 2; i++) {
      console.log(`Pegando o estado ${i}, aguardado resposta.`);
      estado = await this.buscaBigdata(i);
      resultados.push(estado);
      console.log("Extração concluida!");
    }
    return resultados
  }
  static async criaNumerosCNJ() {
    let resultado = [];
    let estado;
    const estados = await this.pegaEstado();
    for (let i = 0; i < estados.length; i++) {
      estado = estados[i];
      for (let j = 0; j < estado.length; j++) {
        // resultado.push(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem));
        // console.log(await this.validaCNJ(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem))); 
        resultado.push(await this.validaCNJ(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem)));
        // console.log(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem));
      }
    }
    // resultado = "teste01"
    return resultado
  }

  static organizaCNJ(ultimoSequencial, Tribunal, unidadeOrigem) {
    // console.log(ultimoSequencial, Tribunal, unidadeOrigem);
    let sequencial = this.completaNumero(ultimoSequencial, "ultimoSequencial");
    let tribunal = this.completaNumero(Tribunal, "Tribunal");
    let origem = this.completaNumero(unidadeOrigem, "unidadeOrigem");
    return `${sequencial}0020205${tribunal}${origem}`
  }

  static completaNumero(numero, tipo) {
    let teste;
    if (tipo == "unidadeOrigem") {
      teste = 4;
    } else if (tipo == "Tribunal") {
      teste = 2;
    } else if (tipo == "ultimoSequencial") {
      teste = 7;
    }

    let resultado = ''
    numero = numero.toString();
    if (numero.length < teste) {
      let zero = teste - numero.length
      // console.log(zero);
      for (let i = 0; i < zero; i++) {
        resultado += "0"
      }
      resultado = resultado + numero
    } else {
      resultado = numero;
    }
    return resultado
  }

  /**
   * Verifica se o numero CNJ obtido é maior que o ultimo rapado pelo robô JTE
   * @param {string} numero Recebe numero CNJ
   */
  static async validaCNJ(numero) {
    const regex = /([0-9]{7})([0-9]{2})([0-9]{4})([0-9]{1})([0-9]{2})([0-9]{4})/;
    let estadoNumero = numero.replace(regex, '$5');
    let comarca = numero.replace(regex, '$6');
    // console.log(estadoNumero);
    // console.log(comarca);
    let busca = await statusEstadosJTE.find({
      "estadoNumero": estadoNumero,
      "comarca": comarca,
    })
    // console.log(busca.numeroUltimoProcecesso);
    let ultimoSequencial = busca[0].numeroUltimoProcecesso;
    let sequencial = numero.slice(0, 7);
    // console.log(ultimoSequencial.slice(0, 7));
    if (sequencial > ultimoSequencial) {
      return numero
    } else {
      return null
    }


  }

  static criaPost(numero) {


    let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true}`;
    return post
  }
  static async posta() {
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
  await mongoose.connection.close()
})()
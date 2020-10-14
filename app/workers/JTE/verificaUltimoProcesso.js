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

  /**
   * Busca no banco no BigdataV2 todos os processos de uma comarca
   * @param {number} tribunal Numero do estado que deseja buscar
   */
  static async buscaBigdata(tribunal) {
    let url = "http://172.16.16.3:8083/processos/obterUltimosSequenciaisPorUnidade";
    let resultado;
    console.log(`${url}/?orgao=5&tribunal=${tribunal}&ano=2020`);
    try {
      await Axios({
        url: `${url}/?orgao=5&tribunal=${tribunal}&ano=2020`,
        method: 'post',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 100000,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'tk3TqbruYqJdFdW5fqctsurkNcZi5UHIVWUfiWfM7Xw',
        },
      })
        .then((res) => {
          resultado = res.data;
          console.log(blue + "Sucesso" + reset);
          console.log(resultado[0]);
          // process.exit()
        })
        .catch((err) => {
          console.log(err.config);
          console.log(err.response.data);
          throw err;
        });
    } catch (e) {
      console.log(red + "Falhou" + reset);
    }

    // console.log(resultado.length);
    return resultado
  }
  /**
   * Busca um estado por vez obtendo um 24 array's, cada array possui todas as comarcas do estado
   */
  static async pegaEstado() {
    let resultados = [];
    let estado;
    let contador = 0;

    for (let i = 1; i < 25; i++) {
      console.log(`Pegando o estado ${i}, aguardado resposta.`);
      try{
        if(contador == 4){
          i++
          contador = 0;
        }
        estado = await this.buscaBigdata(i);
      } catch(e){
        contador ++
        estado = await this.buscaBigdata(i);
      }

      resultados.push(estado);
      console.log("Extração concluida!");
    }
    return resultados
  }

  static async criaNumerosCNJ() {
    let resultado = [];
    let estado;
    let valido;
    const estados = await this.pegaEstado();
    for (let i = 0; i < estados.length; i++) {
      estado = estados[i];
      for (let j = 0; j < estado.length; j++) {
        console.log("Validando estados");
        // resultado.push(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem));
        // console.log(await this.validaCNJ(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem))); 
        valido = await this.validaCNJ(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem))
        if (valido != null) {
          resultado.push(this.criaPost(valido));
          await this.posta(this.criaPost(valido))

        }
        // console.log(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem));
      }
    }
    // resultado = "teste01"
    if(resultado.length<1){
      console.log(blue+"Não obtive processos novos em minha busca"+reset);
    }
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
    // console.log("Buscanco ultimo processo ");
    let busca = await statusEstadosJTE.find({
      "estadoNumero": estadoNumero,
      "comarca": comarca,
    })
    // console.log(busca);
    if (!busca || !busca.length) {
      console.log(numero);
      return numero
      return null
    }

    // console.log("iniciando validação");
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
  static async posta(cnj) {
    // let cnj = await this.criaNumerosCNJ();

    await rabbit.enfileirarLoteTRT("ReprocessamentoJTE", cnj);
  }
  processArray(element) {
    for (let i = 0; i < element.length; i++) {

    }
  }
}
(async () => {
  // await Busca.buscaBigdata(2)
  // console.log(await Busca.buscaBigdata(2));
  await Busca.criaNumerosCNJ();
  // await Busca.posta()
  await mongoose.connection.close()
})()
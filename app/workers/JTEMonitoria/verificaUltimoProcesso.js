const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');
const async = require('async');
const mongoose = require('mongoose');

const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { statusEstadosJTE } = require("../../models/schemas/jte")
const rabbit = new GerenciadorFila();


const red = '\u001b[31m';
const blue = '\u001b[34m';
const reset = '\u001b[0m';

/** Busca */
class Busca {
  /**
   * Envia para o Rabbit todos as comarcas que possuem numero desatualizado.
   */
  static async posta() {
    let cnj = await this.criaNumerosCNJ();
    try {
      await rabbit.enfileirarLoteTRT("ReprocessamentoJTE", cnj);
      // estou enviando 2 vezes para garantir que o processo será processado pelo worker
      await rabbit.enfileirarLoteTRT("ReprocessamentoJTE", cnj);
    } catch (e) {
      console.log(red + "Falhou o envio para a fila reiniciando processo" + reset);
      this.posta()
    }
  }

  /**
   * Recebe o ultimo processo de todas as comarcas
   * @param {array} estados Array de estados, com todos os estados 
   */
  static async criaNumerosCNJ() {
    const estados = await this.pegaEstado();
    let resultado = [];
    let estado;
    let valido;

    // Conecta com o Banco de dados
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (e) => {
      console.log(e);
    });

    // laco com estados
    for (let i = 0; i < estados.length; i++) {
      estado = estados[i];
      // laco com comarcas
      for (let j = 0; j < estado.length; j++) {
        console.log("Validando estados");
        // Array com os numeros CJN ja construidos, prontos para serem consumidos na fila.
        valido = await this.validaCNJ(this.organizaCNJ(estado[j].UltimoSequencial, estado[j].Tribunal, estado[j].UnidadeOrigem))
        // quando o numero sequencial é menor que o numero já extraido pelo robo JTE
        // o retorno é null
        if (valido != null) {
          resultado.push(this.criaPost(valido));
        }
      }
    }
    if (resultado.length < 1) {
      console.log(blue + "Não obtive processos novos em minha busca" + reset);
    }
    // Desconecta do banco de dados
    await mongoose.connection.close();

    return resultado
  }

  /**
   * Cria a mensagem a ser enviada para a fila
   * @param {string} numero 
   */
  static criaPost(numero) {
    let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : false}`;
    return post
  }

  /**
   * Busca um estado por vez obtendo um 24 array's, cada array possui todas as comarcas do estado
   */
  static async pegaEstado() {
    let resultados = [];
    let estado;
    for (let i = 1; i < 25; i++) {
      console.log(`Pegando o estado ${i}, aguardado resposta.`);
      let contador = 0;
      try {
        if (contador == 4) {
          i++
          contador = 0;
        }
        estado = await this.buscaBigdata(i);
        
        if (!estado) {
          throw "Preciso reprocessar"
        }
      } catch (e) {
        contador++
        estado = await this.buscaBigdata(i);
      }
      resultados.push(estado);
      console.log("Extração concluida!");
    }
    return resultados
  }

  /**
   * Busca no banco no BigdataV2 todos os processos de uma comarca
   * @param {number} tribunal Numero do estado que deseja buscar
   */
  static async buscaBigdata(tribunal) {
    let url = "http://172.16.16.3:8083/processos/obterUltimosSequenciaisPorUnidade";
    let resultado;
    console.log(`${url}/?orgao=5&tribunal=${tribunal}&ano=${new Date().getFullYear()}`);
    console.log(" --------- Inicio da extração do estado --------- ");
    try {
      await Axios({
        url: `${url}/?orgao=5&tribunal=${tribunal}&ano=${new Date().getFullYear()}`,
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
          // throw err;
        });

      // verifica se o resultado é valido.
      if (!resultado) {
        throw "Preciso reprocessar"
      }
    } catch (e) {
      console.log(red + "Falhou" + reset);
    }
    return resultado
  }

  // ----------------------------------------------- Funções complementares -------------------------------------------
  /**
   * Cria um numero CNJ para consumo.
   * @param {number} ultimoSequencial Ultimo numero sequencial obtido no BigData V2
   * @param {number} Tribunal Numero que representa o Estado
   * @param {number} unidadeOrigem Numero da comarca
   */
  static organizaCNJ(ultimoSequencial, Tribunal, unidadeOrigem) {
    // console.log(ultimoSequencial, Tribunal, unidadeOrigem);
    let sequencial = this.completaNumero(ultimoSequencial, "ultimoSequencial");
    let tribunal = this.completaNumero(Tribunal, "Tribunal");
    let origem = this.completaNumero(unidadeOrigem, "unidadeOrigem");
    return `${sequencial}00${new Date().getFullYear()}5${tribunal}${origem}`
  }

  /**
   * Ajusta o numero para string e completa com zeros para ficar no padrão do numero CNJ
   * @param {number} numero 
   * @param {string} tipo 
   */
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
   * Verifica se o numero CNJ obtido é maior que o ultimo raspado pelo robô JTE
   * @param {string} numero Recebe numero CNJ
   * @returns retorna: Numero para ser enfileirado ou Null
   */
  static async validaCNJ(numero) {
    const regex = /([0-9]{7})([0-9]{2})([0-9]{4})([0-9]{1})([0-9]{2})([0-9]{4})/;
    let estadoNumero = numero.replace(regex, '$5');
    let comarca = numero.replace(regex, '$6');
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
    let ultimoSequencial = busca[0].numeroUltimoProcecesso;
    let sequencial = numero.slice(0, 7);
    // console.log(ultimoSequencial.slice(0, 7));
    if (sequencial > ultimoSequencial) {
      return numero
    } else {
      return null
    }
  }
}

(async () => {
  for (let i = 0; i < 2; i++) {
    await Busca.posta()
  }
  await mongoose.connection.close()
})()
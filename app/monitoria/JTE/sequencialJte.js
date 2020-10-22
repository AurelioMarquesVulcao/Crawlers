const mongoose = require('mongoose');
const shell = require('shelljs');
const sleep = require('await-sleep');
const axios = require('axios');

const { Processo } = require('../../models/schemas/processo');
const { statusEstadosJTE } = require('../../models/schemas/jte');
const { enums } = require('../../configs/enums');
const { Verificador } = require('../../lib/verificaSequencial');
const { Helper } = require('../../lib/util');

class Sequencial {

  static async geraEmail() {
    let detalhes;
    let email = [];
    const desatualizados = await this.teste();
    for (let i = 0; i < desatualizados.length; i++) {
      detalhes = await this.buscaDetalhes(desatualizados[i].numeroProcesso);
      email.push({
              numero:desatualizados[i].numeroProcesso,
              dataDistribuicao:desatualizados[i].dataDistribuicao,
              estado:detalhes.estado,
              comarca:detalhes.comarca,
              status:detalhes.status,
              dataUltimaVerificacao:detalhes.dataUltimaVerificacao
      })
    }
    return email
  }

  static async buscaDetalhes(numero) {
    try {
      let ano;
      let data;
      const busca = await statusEstadosJTE.findOne({ "numeroUltimoProcecesso": numero });
      // console.log(numero);
      // console.log(busca);
      // console.log(busca.dataBusca);
      // Verifico se existe ano no resultado da buca
      if (busca != null){
        if (("ano" in busca.dataBusca)) {
          ano = busca.dataBusca.ano
        } else {
          ano = 2020
        }
        // data = Helper.data(`12/09/2020 00:00`);
        data = Helper.data(`${busca.dataBusca.dia}/${busca.dataBusca.mes+1}/${ano} 00:00`);
        // console.log(`${busca.dataBusca.dia}/${busca.dataBusca.mes}/${ano} 00:00`);
        return {
          estado: busca.estadoNumero,
          comarca: busca.comarca,
          status: busca.status,
          dataUltimaVerificacao: data
        }
      }
      
    } catch (e) {
      console.log(e);
      console.log(" Erro Busca de Detalhes Falhou");
    }
  }


  /**Busca por ocorrências de comarcas paradas a mais de 7 dias */
  static async teste() {
    let desatualizados = [];
    let processos = [];
    let busca;
    try {
      const comarcas = await this.bucaComarca()
      // console.log(comarcas);
      for (let i = 0; i < comarcas.length; i++) {
        if (parseInt(comarcas[i].processo.slice(0, 7)) > 0) {
          processos.push(await this.buscaProcesso(comarcas[i].processo))
        }
      }
      for (let ii = 0; ii < processos.length; ii++) {
        if (this.verificaData(new Date, processos[ii].dataDistribuicao))
          desatualizados.push(processos[ii]);
      }
      return desatualizados
    } catch (e) {
      console.log("Erro na verificacao");
    }
  }

  /**
   * Compara 2 datas e se a diferenca for maior ou igual a 7 dias retorna true.
   * @param {date} data1 Recebe a data de hoje, ou data de maior valor
   * @param {date} data2 Recebe a data a ser comparada
   */
  static verificaData(data1, data2) {
    const diferenca = data1 - data2;
    const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24));
    // console.log(diferenca);
    // console.log(dias);
    if (dias >= 7) {
      return true
    } else { return false };
  }

  /**
   * Busca todas as comarcas que possuem processos.
   */
  static async bucaComarca() {
    try {
      // tratei na busca para remover as comarcas que possuem data de criação = null
      const comarcas = await statusEstadosJTE.find({ "dataCriaçãoJTE": { $ne: null } }).limit()
      return comarcas.map((res) => {
        return {
          processo: res.numeroUltimoProcecesso,
          comarca: res.comarca,
          estado: res.estadoNumero
        }
      })
    } catch (e) {
      console.log("Erro na busca de comarcas");
    }
  }
  /**
   * Busca no banco pelo prcesso e nos retorna numero de processo e sua data de criação.
   * @param {string} numero Recebe numero de processo no padrão CNJ "limpo"
   */
  static async buscaProcesso(numero) {
    let sequencia = parseInt(numero.slice(0, 7));
    // if (sequencia > 0) {
    try {
      let processo = await Processo.find({
        "detalhes.numeroProcesso": numero,
      });

      return {
        "numeroProcesso": numero,
        "dataDistribuicao": processo[0].capa.dataDistribuicao
      }
    } catch (e) {
      console.log(numero);
      // console.log(e);
      console.log("Erro na busca de processo");
    }
    // }
  }


  /**Conecta ao Banco de dados */
  static onDB() {
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (e) => {
      console.log(e);
    });
  }
  /** Desconcta ao Banco de dados */
  static async offDB() {
    await mongoose.connection.close()
  }



}
module.exports.Sequencial = Sequencial;
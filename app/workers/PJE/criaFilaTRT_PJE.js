const mongoose = require('mongoose');
const sleep = require('await-sleep');
const desligado = require('../../assets/jte/horarioRoboTRTRJ.json');

const { enums } = require('../../configs/enums');
const { Processo } = require('../../models/schemas/processo');
const { GerenciadorFila } = require("../../lib/filaHandler");
const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { getFilas } = require('./get_fila');


class CriaFilaPJE {
  constructor() {
    // this.robo = new Robo();
    this.fila = "processo.PJE.atualizacao.01";
    this.criafila = new CriaFilaJTE();
    this.rabbit = new GerenciadorFila()
    this.mensagens = [];
  };
  async worker() {
    await this.testaFila();

  }
  /**
   * Monta a os blocos de estados a serem enfileirados
   */
  async montaFila() {

    let data = new Date();
    data = new Date()
    data.setDate(data.getDate() - 1)
    console.log(data);
    // process.exit()
    let estado = [];
    console.log("Fila concluída. Iniciando criador de fila.");
    for (let i = 1; i < 25; i++) {
      if (i != 15) {
        await this.atualizaProcessosFila(0, i, data)[0]
        await sleep(3000)
      }
    }
    await this.rabbit.enfileirarLoteTRT(this.fila, this.mensagens)
    // this.mensagens = [];
    await sleep(5000);
    // 
    await this.testaFila();

  }

  /**
   * Verifica se a fila possui menos de 100 mensagens, caso tenha menos de 100 mensagens,
   * enfileira 300 processos de cada estado.
   */
  async testaFila() {
    console.log("Testando Fila");
    this.mensagens = [];
    console.log("Quantidade de Mensagens é.:", this.mensagens.length);
    let statusFila = false
    let rabbit = await getFilas();
    console.log(rabbit);
    if (rabbit.length > 0) {
      for (let i = 0; i < rabbit.length; i++) {
        if (rabbit[i].nome == this.fila) {
          statusFila = true
        }
      }
    }
    if (!statusFila) {
      console.log("A fila ainda não consumiu...");
      await sleep(60 * 1000);
      await this.testaFila();
    } else {
      console.log("A fila consumiu...");
      await this.montaFila()
    }
  }

  /**
   * Busca no banco de dados por processos extraidos do JTE
   * que não possuem a capa atualizada. E os envia para fila.
   * @param {number} pulo salta uma quantidade de processos apartir do inicio.
   * @param {number} tribunal Tribunal/Estado ao qual o processo pertence.
   * @param {date} data Data do dia anterior para a busca de processos
   */
  async atualizaProcessosFila(pulo, tribunal, data) {
    let data2 = new Date();
    data2.setDate(data.getDate() - 10)
    console.log(data2, "tribunal", tribunal);
    let busca;
    // let mensagens = [];
    let agregar = await Processo.aggregate([
      {
        $match: {
          'detalhes.orgao': 5,
          'detalhes.tribunal': tribunal,
          'detalhes.ano': new Date().getFullYear(),
          "origemExtracao": "JTE",
          "capa.dataDistribuicao": {
            '$lt': data,
            '$gt': data2
            // '$gt': new Date('2020-10-01')
          }
        }
      },
      {
        $project: {
          "detalhes.numeroProcesso": 1,
          "capa.dataDistribuicao": 1,
          "_id": 1
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 100 }
    ]).skip(pulo);
    // console.log(agregar);
    // process.exit()
    for (let i = 0; i < agregar.length; i++) {
      busca = `${agregar[i]._id}`;
      this.mensagens.push(this.criaPost(agregar[i].detalhes.numeroProcesso, busca, agregar[i].capa.dataDistribuicao));
    }
  }


  // async enfileirarTRT_RJ(numero, busca) {
  //     let regex = (/([0-9]{7})([0-9]{2})(2020)(5)(01)([0-9]{4})/g.test(numero))
  //     let mensagem = this.criaPost(numero, busca);
  //     await this.criafila.enviarMensagem(this.fila, mensagem);
  //     console.log("Processo enfileirado para Download");
  // }

  /**
  * Cria um post para ser enviado como mensagem para o rabbit
  * @param {string} numero Numero de Processo
  * @param {string} busca Objeto Id para busca no MONGO-DB
  * @return {string} return.: {"NumeroProcesso" : "00004618720205130032","NovosProcessos" : true, "_id" : "5f6cb256f0375ab99a7cf367"}
  */
  criaPost(numero, busca, dataDistribuicao) {
    let busca2 = busca.toString()
    let data = `${dataDistribuicao.getDate()}/${dataDistribuicao.getMonth() + 1}/${dataDistribuicao.getFullYear()}`;
    let post = `{"NumeroProcesso" : "${numero}","NovosProcessos" : true, "_id" : "${busca2}", "dataDistribuicaoP.":"${data}"}`;
    console.log(post);
    return post
  }

};

// embaralhador de array, faz com que a ordem de consumo da fila mude 
// para que não baixe apenas o mesmo estado toda vez que inicie a aplicação.
function embaralha(lista) {
  for (let indice = lista.length; indice; indice--) {
    const indiceAleatorio = Math.floor(Math.random() * indice);
    // guarda de um índice aleatório da lista
    const elemento = lista[indice - 1];
    lista[indice - 1] = lista[indiceAleatorio];
    lista[indiceAleatorio] = elemento;
  }
}
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  mongoose.connection.on('error', (e) => {
    console.log(e);
  });
  new CriaFilaPJE().worker()
  // new CriaFilaPJE().atualizaProcessosFila(0, 2, new Date("2020-12-12")) 

})()
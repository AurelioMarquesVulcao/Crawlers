const mongoose = require('mongoose');
const sleep = require('await-sleep');
const desligado = require('../../assets/jte/horarioRoboTRTRJ.json');

const { CriaFilaJTE } = require('../../lib/criaFilaJTE');
const { enums } = require('../../configs/enums');
const { FluxoController } = require('../../lib/fluxoController');
const { getFilas } = require('./get_fila');
const { GerenciadorFila } = require('../../lib/filaHandler');
const { Processo } = require('../../models/schemas/processo');
const { ExecucaoConsulta } = require('../../models/schemas/execucao_consulta');

class CriaFilaPJE {
  constructor() {
    this.fila = 'processo.PJE.atualizacao.01';
    this.criafila = new CriaFilaJTE();
    this.rabbit = new GerenciadorFila();
    this.mensagens = [];
  }
  async worker() {
    await this.testaFila();
  }
  /**
   * Monta a os blocos de estados a serem enfileirados
   */
  async montaFila() {
    let data = new Date();
    data = new Date();
    data.setDate(data.getDate() - 1);
    console.log(data);
    let estado = [];
    console.log('Fila concluída. Iniciando criador de fila.');

    // Para realizar testes.

    // await ExecucaoConsulta.deleteMany({
    //   NomeRobo: this.fila.toLowerCase(),
    // });

    // for (let i = 1; i < 3; i++) {
    for (let i = 1; i < 25; i++) {
      if (i != 15) {
        await this.atualizaProcessosFila(0, i, data)[0];
        await sleep(3000);
      }
    }
    // await ExecucaoConsulta.deleteMany({
    //   NomeRobo: this.fila.toLowerCase(),
    // });
    // for (let ii = 0; ii < this.mensagens.length; ii++) {
    //   await FluxoController.cadastrarExecucao(
    //     this.fila.toLowerCase(),
    //     this.fila,
    //     this.mensagens[ii]
    //   );
    // }

    
      await FluxoController.cadastrarExecucao(
        this.fila.toLowerCase(),
        this.fila,
        this.mensagens
      );
      await sleep(30000);
      // process.exit()
    // função descontinuada.
    // await this.rabbit.enfileirarLoteTRT(this.fila, this.mensagens);

    this.mensagens = [];
    await sleep(5000);
    // reinicio o ciclo de testar a fila.
    await this.testaFila();
  }

  /**
   * Verifica se a fila possui menos de 100 mensagens, caso tenha menos de 100 mensagens,
   * enfileira 300 processos de cada estado.
   */
  async testaFila() {
    console.log('Testando Fila');
    this.mensagens = [];
    console.log('Quantidade de Mensagens é.:', this.mensagens.length);
    let statusFila = false;
    let rabbit = await getFilas();
    console.log(rabbit);
    if (rabbit.length > 0) {
      for (let i = 0; i < rabbit.length; i++) {
        if (rabbit[i].nome == this.fila) {
          statusFila = true;
        }
      }
    }
    if (!statusFila) {
      console.log('A fila ainda não consumiu...');
      await sleep(60 * 1000);
      await this.testaFila();
    } else {
      console.log('A fila consumiu...');
      await this.montaFila();
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
    // subtrai x dias da data de hoje para a busca de processos
    data2.setDate(data.getDate() - 10);
    console.log(data2, 'tribunal', tribunal);
    let busca;
    // let mensagens = [];
    let agregar = await Processo.aggregate([
      {
        $match: {
          'detalhes.orgao': 5,
          'detalhes.tribunal': tribunal,
          'detalhes.ano': new Date().getFullYear(),
          origemExtracao: 'JTE',
          'capa.dataDistribuicao': {
            $lt: data,
            $gt: data2,
            // '$gt': new Date('2020-10-01')
          },
        },
      },
      {
        $project: {
          'detalhes.instancia': 1,
          'detalhes.numeroProcesso': 1,
          'capa.dataDistribuicao': 1,
          _id: 1,
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 100 },
    ]).skip(pulo);
    // console.log(agregar);
    // process.exit()
    for (let i = 0; i < agregar.length; i++) {
      busca = `${agregar[i]._id}`;
      this.mensagens.push(
        this.criaPost(
          agregar[i].detalhes.numeroProcesso,
          busca,
          agregar[i].capa.dataDistribuicao,
          agregar[i].detalhes.instancia
        )
      );
    }
  }

  /**
   * Cria um post para ser enviado como mensagem para o rabbit
   * @param {string} numero Numero de Processo
   * @param {string} busca Objeto Id para busca no MONGO-DB
   * @param {string} instancia Instância do processo.
   * @return {string} return.: {"NumeroProcesso" : "00004618720205130032","NovosProcessos" : true, "_id" : "5f6cb256f0375ab99a7cf367"}
   */
  criaPost(numero, busca, dataDistribuicao, instancia) {
    let busca2 = busca.toString();
    let data = `${dataDistribuicao.getDate()}/${
      dataDistribuicao.getMonth() + 1
    }/${dataDistribuicao.getFullYear()}`;

    let post = {
      NumeroProcesso: numero,
      NovosProcessos: true,
      _id: busca2,
      dataDistribuicao: data,
      Instancia: instancia,
      NomeRobo: this.fila.toLowerCase(),
      ConsultaCadastradaId: null,
    };
    return post;
  }
}

(async () => {
  try {
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (e) => {
      console.log(e);
    });
  } catch (e) {
    process.exit();
  }
  try {
    new CriaFilaPJE().worker();
    // new CriaFilaPJE().atualizaProcessosFila(0, 2, new Date("2020-12-12"))
  } catch (e) {
    console.log(e);
  }
})();

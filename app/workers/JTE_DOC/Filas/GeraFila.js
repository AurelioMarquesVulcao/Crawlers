const mongoose = require('mongoose');
const sleep = require('await-sleep');

const { enums } = require('../../../configs/enums');
const { GerenciadorFila } = require('../../../lib/filaHandler');
const { Logger, Cnj, Helper } = require('../../../lib/util');
const {
  ExecucaoConsulta,
} = require('../../../models/schemas/execucao_consulta');
const { Log } = require('../../../models/schemas/logsEnvioAWS');
const { Processo } = require('../../../models/schemas/processo');
const { FluxoController } = require('../../../lib/fluxoController');
const { Fila } = require('./getFila');
const { util } = require('chai');

const nomeFila = `peticao.JTE.extracao`;
const nomeFilaPJE = `processo.PJE.atualizacao.01`;

var Processos = [];
(async () => {
  await worker();
})();

async function worker() {
  let contador = (await Fila.getFila(`peticao\\.JTE\\.extracao\.\\d`)).map(
    (x) => {
      x['contador'] = 0;
      return x;
    }
  );
  try {
    // liga ao banco de dados
    mongoose.connect(enums.mongo.connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    mongoose.connection.on('error', (e) => {
      console.log(e);
    });
  } catch (e) {
    console.log(e);
    process.exit();
  }

  // await verificaFilaParada(contador);
  // process.exit();
  try {
    // tudo que está abaixo é acionado para cada consumer na fila.
    await new GerenciadorFila(false, 1).consumir(nomeFila, async (ch, msg) => {
      // Observa se a quantidade de mensagens nas filas de iniciais está dentro dos parâmetros para
      // enifileirar mais processos
      let filasQtd = 3000;
      let linksQtd = 3000;
      while (filasQtd >= 14 || linksQtd > 60) {
        filasQtd = (await Fila.getFila(`peticao\\.JTE\\.extracao\.\\d`))
          .map((x) => x.qtd)
          .reduce((x, y) => x + y);
        linksQtd = (await Fila.getFila(`peticao.jte.extracao.links`))
          .map((x) => x.qtd)
          .reduce((x, y) => x + y);

        console.log('A fila não consumiu, Qtd:', filasQtd);
        console.log('O link não consumiu, Qtd:', linksQtd);

        let verifica = await Fila.getFila(`peticao\\.JTE\\.extracao\.\\d`);
        for (let i = 0; i < contador.length; i++) {
          if (
            verifica[i].qtd != 0 &&
            verifica[i].qtdConsumo == 0 &&
            verifica[i].status == 'Aguardando'
          ) {
            contador[i].contador++;
            // console.log(contador[i]);
          } else {
            contador[i].contador = 0;
            // console.log(contador[i]);
          }
          if (contador[i].contador >= 30) {
            console.log(contador[i].qtd);
            filasQtd = filasQtd - contador[i].qtd;
            console.log('A fila não consumiu, Qtd:', filasQtd);
          }
        }
        console.log(contador.filter((x) => x.contador != 0));
        console.log('A fila não consumiu, Qtd:', filasQtd);
        console.log('O link não consumiu, Qtd:', linksQtd);
        await sleep(10000);
      }
      console.log('a');

      let message = JSON.parse(msg.content.toString());

      message['Instancia'] = message.instancia;
      delete message['instancia'];

      console.table(message);
      // tratamento provisório do numeor de processo.
      let cnj = Cnj.processoSlice(message.NumeroProcesso);
      if (cnj.estado != 15) {
        // Cria Fila PJE
        await PJE(message);
        console.log('ok');
      }
      // Cria Fila JTE
      await JTE(message);

      await sleep(5000);

      // process.exit();
      ch.ack(msg);

      // await sleep(20000);
      // await sleep(1000);
    });
  } catch (e) {
    console.log(e);
    // await sleep(3000);
    process.exit();
    // Não feche a mensagem em caso de erro !
    // ch.ack(msg);
  }
}

async function geraPje(message) {
  let processo = await Processo.findOne({
    'detalhes.numeroProcesso': message.NumeroProcesso,
  });
  let id = processo._id;
  let message2 = {
    NumeroProcesso: message.NumeroProcesso,
    NovosProcessos: true,
    _id: id,
    Instancia: message.Instancia,
    NomeRobo: nomeFilaPJE.toLowerCase(),
  };
  // console.log(message2);
  return message2;
}

async function PJE(message) {
  try {
    let message2 = await geraPje(message);
    let execucao = await FluxoController.cadastrarExecucao(
      nomeFilaPJE.toLowerCase(),
      nomeFilaPJE,
      message2
    );
    if (!execucao) {
      let log = await ExecucaoConsulta.findOne({
        NomeRobo: message2.NomeRobo,
        'Mensagem.Instancia': message2.Instancia,
        'Mensagem.NumeroProcesso': message2.NumeroProcesso,
        DataTermino: null,
      });
      if (Array.isArray(log.Mensagem)) {
        log.Mensagem = log.Mensagem[0];
      }
      console.log('Reenfileirado a força');
      await new GerenciadorFila().enviar(nomeFilaPJE, log.Mensagem);
    }
  } catch (e) {
    console.log(e);
  }
}

async function JTE(message) {
  try {
    let numeroProcesso = message.NumeroProcesso;
    let estadoProcesso = Cnj.processoSlice(numeroProcesso).estado;
    let fila = `peticao.JTE.extracao.${estadoProcesso}`;
    // Incluido dados obrigatórios na mensgem
    // message['Instancia'] = null;
    message['NomeRobo'] = fila.toLowerCase();
    let execucao = await FluxoController.cadastrarExecucao(
      fila.toLowerCase(),
      fila,
      message
    );
    if (!execucao) {
      let log = await ExecucaoConsulta.findOne({
        NomeRobo: message.NomeRobo,
        'Mensagem.Instancia': message.Instancia,
        'Mensagem.NumeroProcesso': message.NumeroProcesso,
        DataTermino: null,
      });
      console.log('Reenfileirado a força');
      await new GerenciadorFila().enviar(nomeFilaPJE, log.Mensagem);
    }
  } catch (e) {
    console.log(e);
  }
}

async function verificaFilaParada(contador) {
  // console.log(contador);
  let verifica = await Fila.getFila(`peticao\\.JTE\\.extracao\.\\d`);
  for (let i = 0; i < contador.length; i++) {
    if (
      verifica[i].qtd != 0 &&
      verifica[i].qtdConsumo == 0 &&
      verifica[i].status == 'Aguardando'
    ) {
      contador[i].contador++;
      console.log(contador[i]);
    } else {
      contador[i].contador = 0;
      console.log(contador[i]);
    }
    if (contador[i].contador >= 10) {
      filasQtd = filasQtd - contador[i].qtd;
    }
  }

  // verifica.map((x) => {
  //   if (x.qtd != 0 && x.qtdConsumo == 0 && x.status == 'Aguardando') {
  //     let obj = x
  //     let filtro = contador.filter((x) => x.nome==obj.nome)
  //     // let posicao = contador.indexOf(filtro.nome)
  //     console.log(filtro);
  //     // console.log(posicao);

  //     process.exit();
  //     // contador.indexOf(x.nome)
  //     // contador[x.nome] =
  //   }
  // });
}

const sleep = require('await-sleep')
const { FluxoController } = require('../lib/fluxoController');
const { enums } = require('../configs/enums');
const { GerenciadorFila } = require('../lib/filaHandler');
const { Cnj } = require('../lib/util');

// modelo da mensagem
// {"NumeroProcesso":"01010463320205010081","instancia":1,"inicial":true}

(async () => {
  const nomeFila = 'peticao.TJ.extracao';

  new GerenciadorFila(null, 5).consumir(nomeFila, async (ch, msg) => {
    let numeroProcesso;
    try {
      /**
       *
       * @type {Object}
       * @property {string} NumeroProcesso Numero do processo com ou sem mascara
       * @property {number} instancia a instancia do processo
       * @property {boolean} inicial .
       */
      let message = JSON.parse(msg.content.toString());

      if(/\D/.test(message.NumeroProcesso)) { // se possui mascara
        numeroProcesso = `0000000${message.NumeroProcesso}`.slice(-25);
      }
      else {
        numeroProcesso = `0000000${message.NumeroProcesso}`.slice(-20);
        numeroProcesso = colocaMascara(numeroProcesso);
      }

      let {tribunal, orgao} = retornaOrgaoTribunal(numeroProcesso);

      let tribunalFila = tribunaisCodigo[`${tribunal}.${orgao}`];

      if (!tribunalFila) throw new Error(`Não foi encontrado o tribunal para o processo ${numeroProcesso}`)

      let fila = `peticao.${tribunalFila}.extracao`;

      let novaMensagem = {
        NumeroProcesso: numeroProcesso,
        instancia: message.instancia,
        inicial: message.inicial
      }

      await FluxoController.cadastrarExecucao(`Peticao${tribunalFila}`, fila, novaMensagem)

      // new GerenciadorFila().enviarMensagem(ch, fila, JSON.stringify(novaMensagem));

      console.log(`${numeroProcesso} => ${fila}`);
    } catch(e) {
      console.log(e);
    } finally {
      ch.ack(msg);
      await sleep(200);
    }
  })
})()


const colocaMascara = (cnj) => {
  let cnjObject = Cnj.processoSlice(cnj)
  return `${cnjObject.sequencial}-${cnjObject.dois}.${cnjObject.ano}.${cnjObject.tipo}.${cnjObject.estado}.${cnjObject.comarca}`
}


const retornaOrgaoTribunal = (cnj) => {
  cnj = Cnj.processoSlice(cnj.replace(/\D/g, ''));
  return {
    tribunal: cnj.tipo,
    orgao: cnj.estado
  }
}


let tribunaisCodigo = {
  '8.05': 'TJBA',
  '8.06': 'TJCE',
  '8.19': 'TJRJ',
  '8.21': 'TJRS',
  '8.24': 'TJSC',
  '8.26': 'TJSP',
}
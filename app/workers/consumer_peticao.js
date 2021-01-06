const { enums } = require('../configs/enums');
const { GerenciadorFila } = require('../lib/filaHandler');

(async () => {
  const nomeFila = 'peticao.TJ.extracao';

  new GerenciadorFila(null, 100).consumir(nomeFila, async (ch, msg) => {
    try {
      let message = JSON.parse(msg.content.toString());


    } catch(e) {

    }
  })
})()
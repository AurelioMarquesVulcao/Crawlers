// workers/TJCE/extracaoComarcas.js
const mongoose = require('mongoose');
const { enums } = require('../../configs/enums');
const { GerenciadorFila } = require('../../lib/filaHandler');
const sleep = require('await-sleep');
const { CnjValidator } = require('../../lib/util');
const { ProcessoTJCE } = require('../../extratores/ProcessoTJCE');
const Comarca = require('../../models/schemas/comarcas');
const moment = require('moment');

(async () => {
  mongoose.connect(enums.mongo.connString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  mongoose.connection.on('error', (e) => {
    console.log(e);
  });

  const nomeFila = 'comarcas.TJCE.extracao';

  new GerenciadorFila().consumir(nomeFila, async (ch, msg) => {
    let message = JSON.parse(msg.content.toString());
    let comarca = new Comarca(message);
    console.table(message);

    if (!/\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/.test(message.UltimoProcesso)) {
      message.UltimoProcesso = ('000000'+message.UltimoProcesso).slice(-20)
      message.UltimoProcesso = message.UltimoProcesso.replace(/(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6');
    }

    await comarca.setStatus(2);

    let ultimo=false;
    let continuar;
    let processados = 0;
    let inicio = moment();
    do {
      continuar = await extrairNumeros(message, ultimo);
      processados += continuar.count;
      ultimo = continuar.ultimo;
      if (!continuar.continuar) break;
      // if (processados > 6) break
    } while (true);
    let fim = moment();

    comarca.TempoDecorrido = moment
      .utc(
        moment(fim, 'DD/MM/YYYY HH:mm:ss').diff(
          moment(inicio, 'DD/MM/YYYY HH:mm:ss')
        )
      )
      .format('HH:mm:ss');
    comarca.ProcessosFeitos = processados;
    comarca.UltimoProcesso = ultimo;

    await comarca.salvar();
    await comarca.setStatus(3);

    ch.ack(msg);
    await sleep(200);
  });
})();

/**
 *
 * @param {Object} message
 * @param message.Status
 * @param message._id
 * @param message.Hash
 * @param message.Comarca
 * @param message.DataAtualizacao
 * @param message.DataCriacao
 * @param message.Estado
 * @param message.Metadados
 * @param message.Nome
 * @param message.Orgao
 * @param message.Tribunal
 * @param message.UltimoProcesso
 * @param {boolean|string} ultimo
 * @returns {Promise<{ultimo: string, count: number, continuar: boolean}>}
 */
async function extrairNumeros(message, ultimo) {
  console.log({ ultimo });
  let ultimoNumero = ultimo ? ultimo : message.UltimoProcesso;
  let anterior = ultimoNumero;
  let count = 1;
  let sequencial;
  let numero;
  let erroEncontrado = false;
  let extracao;

  ultimoNumero = ultimoNumero.split(/\D/g);

  do {
    let extrator = new ProcessoTJCE(
      'https://www.tjrs.jus.br/site_php/consulta/index.php',
      false
    );
    sequencial = `${Number(ultimoNumero[0]) + count}`;

    let mod = CnjValidator.calcula_mod97(
      sequencial,
      ultimoNumero[2],
      `${ultimoNumero[3]}${ultimoNumero[4]}`,
      ultimoNumero[5]
    );
    numero = `${sequencial}-${mod}.${ultimoNumero[2]}.${ultimoNumero[3]}.${ultimoNumero[4]}.${ultimoNumero[5]}`;
    numero = ('000000'+numero).slice(-25)
    extracao = await extrator.extrair(numero, null, 1);

    // console.log({ count, sequencial,ultimoNumero, numero, mod })

    if (erroEncontrado && !extracao.sucesso) {
      return { continuar: false, ultimo: anterior, count: count - 1 };
    }
    if (extracao.sucesso || extracao.detalhes === 'Senha necessaria') {
      erroEncontrado = false;
      anterior = numero;
    }

    // console.log({detalhes: extracao.detalhes});
    // console.log({sucesso: extracao.sucesso});

    if (!extracao.sucesso && (extracao.detalhes !== 'Senha necessaria'))
      erroEncontrado = !extracao.sucesso;

    // console.log({erroEncontrado})
    count++;
  } while (count < 5);

  return { continuar: true, ultimo: numero, count };
}
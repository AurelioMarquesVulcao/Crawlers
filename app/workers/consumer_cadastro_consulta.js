const { modelNames } = require('mongoose');

require('../bootstrap');
const { FluxoController } = require('../lib/fluxoController');
const axios = require('axios').default;
const GerenciadorFila = require('../lib/filaHandler').GerenciadorFila;

const bigDataAddress = require('../configs/enums').enums.bigdataAddress;

async function feedbackCadastroConsulta(mensagemObj) {
  const res = await axios
    .get(
      `${bigDataAddress}/consultaPublica/confirmarCadastro/${mensagemObj.CadastroConsultaId}`
    )
    .then((res) => {
      return {
        data: res.data,
        error: null,
      };
    })
    .catch((err) => {
      return {
        data: null,
        error: err,
      };
    });
  return res;
}

const gerenciadorFila = new GerenciadorFila();

const identificarDetalhes = (cnj) => {
  let tribunal;

  try {
    const cnjMascara = cnj.replace(
      /([0-9]{7})([0-9]{2})([0-9]{4})([0-9])([0-9]{2})([0-9]{4})/,
      '$1-$2.$3.$4.$5.$6'
    );

    const numeroMatch = cnjMascara.match(/\.([0-9]{1}\.[0-9]{2})\./);

    if (numeroMatch) {
      const numeroSplit = numeroMatch[1].split('.');
      tribunal = {
        Orgao: parseInt(numeroSplit[0]),
        Tribunal: parseInt(numeroSplit[1]),
      };
    }
  } catch (e) {
    console.log(e.message);
  }

  return tribunal;
};

gerenciadorFila.consumir('cadastro_consulta', async (ch, mensagem) => {
  let tribunal;
  const mensagemObj = JSON.parse(mensagem.content);

  try {
    let consulta = await FluxoController.cadastrarConsulta(mensagemObj);

    if (!consulta) {
      const res = await feedbackCadastroConsulta(mensagemObj);

      if (res.data) {
        console.log(
          `Cadastro da consulta ${mensagemObj.CadastroConsultaId} no bigdata confirmado com sucesso!`
        );
      } else {
        throw res.err;
      }
    } else {
      console.log('Consulta já cadastrada no crawler.');
    }
  } catch (e) {
    console.log(e);
    console.error(`Consulta não registrada com sucesso: ${e.message}`);
  } finally {
    console.log(
      `Liberando mensagem ${
        mensagemObj.TipoConsulta === 'processo'
          ? mensagemObj.NumeroProcesso
          : mensagemObj.NumeroOab
      }!`
    );
    ch.ack(mensagem);
  }
});

const mongoose = require('mongoose');
const {
  ExecucaoConsulta,
} = require('../../../models/schemas/execucao_consulta');

let teste = new ExecucaoConsulta({
  DataInicio: null,
  DataTermino: null,
  NomeRobo: 'teste',
  Mensagem: {
    Instancia: null,
    NumeroProcesso: '10000659320215020443',
    NovosProcessos: true,
    // ExecucaoConsultaId: '6021b0e509adf717e62251a9',
    // ConsultaCadastradaId: '6021b0e509adf717e62251a9',
    DataEnfileiramento: '2021-02-08T21:45:08.613Z',
    NomeRobo: 'processo.pje.atualizacao.01',
  },
});
console.log(teste);
teste.Mensagem[0]['ExecucaoConsultaId'] = teste._id;
teste.Mensagem[0]['ConsultaCadastradaId'] = null;
teste.Mensagem[0]['DataEnfileiramento'] = teste.DataEnfileiramento;
console.log(teste);
console.log(teste.Mensagem[0]);

const mongoose = require('mongoose');
const {ExecucaoConsulta} = require('../../../models/schemas/execucao_consulta');


console.log(
  new ExecucaoConsulta({
    NomeRobo: "teste"
  })
);
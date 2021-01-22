require('../bootstrap');
const ExecucaoConsulta = require('../models/schemas/execucao_consulta')
  .ExecucaoConsulta;
const GerenciadorFila = require('../lib/filaHandler').GerenciadorFila;
const enums = require('../configs/enums').enums;
const cron = require('node-cron');
const { FluxoController } = require('../lib/fluxoController');

class Enfileirador {
  /**
   * Realiza a query das consultas pendentes de execução.
   */
  static async executar() {
    await FluxoController.enfileirarPendentes();
  }
}

console.log('Realizando execução ao iniciar o container.');
Enfileirador.executar();

cron.schedule('0 * * * *', () => {
  console.log('Executando enfileirador.');
  Enfileirador.executar();
});

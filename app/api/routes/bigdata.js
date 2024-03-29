const router = require('express').Router();
const feedback = require('./feedback');
const { ProcessoController } = require('../controller/processoController');

// router.get('/', ProcessoController.contarDocumentos);
router.get('/processo/:numeroProcesso', ProcessoController.obterProcessoSolr);
router.get(
  '/processo/:numeroProcesso/andamentos',
  ProcessoController.obterAndamentos
);
router.get('/processos', ProcessoController.obterProcessos);
router.get(
  '/processo-solr/:numeroProcesso',
  ProcessoController.obterProcessoSolr
);
router.get(
  '/andamentos-solr/:numeroProcesso',
  ProcessoController.obterAndamentosSolar
);
router.get(
  '/andamentos/:numeroProcesso',
  ProcessoController.obterAndamentosSolar
);
router.post('/enfileirar-iniciais', ProcessoController.enfileirarDocumentos);

module.exports = router;

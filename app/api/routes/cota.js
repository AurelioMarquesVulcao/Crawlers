const router = require('express').Router();
const { CotaController } = require('../controller/cotaController');

router.get('/', (req, res) => {
  res.send('Não há rota padrao para /api/cota');
});

router.post('/cadastrar', CotaController.cadastrar);
router.post('/setValor', CotaController.setValor);
router.get('/getCota', CotaController.getCota);

module.exports = router;

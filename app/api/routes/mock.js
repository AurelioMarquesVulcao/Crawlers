const router = require("express").Router();
const { MockController } = require("../controller/mockController");

router.get('/', (req, res) => { res.send('Não há rota padrao para /api/feedback'); });
router.post('/arquivo', MockController.lerArquivo);

module.exports = router;

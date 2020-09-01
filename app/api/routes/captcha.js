const router = require("express").Router();
const { CaptchaController } = require("../controller/captchaController");

router.get('/', (req, res) => {
    res.send('Não há rota padrao para /api/captcha');
});

router.get('/consumo/contar', CaptchaController.contarQtdConsumo);
router.get('/consumo/buscar', CaptchaController.buscarConsumo);
router.post('/consumo', CaptchaController.salvarConsumo);

module.exports = router;
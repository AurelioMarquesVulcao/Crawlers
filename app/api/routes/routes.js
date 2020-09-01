const router = require("express").Router();
const bigdataRoutes = require("./bigdata");
const feedbackRoutes = require("./feedback");
const mockRoutes = require("./mock");
const captchaRoutes = require("./captcha");
const { ProcessoController } = require("../controller/processoController");

router.get('/', ProcessoController.contarDocumentos);
router.use('/bigdata', bigdataRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/mock', mockRoutes);
router.use('/captcha', captchaRoutes);

module.exports = router;
const router = require('express').Router();
const bigdataRoutes = require('./bigdata');
const feedbackRoutes = require('./feedback');
const mockRoutes = require('./mock');
const captchaRoutes = require('./captcha');
const cotaRoutes = require('./cota')
const { ProcessoController } = require('../controller/processoController');
const middlewares = require('../middlewares');

router.get('/', ProcessoController.contarDocumentos);
router.use('/bigdata', bigdataRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/mock', mockRoutes);
router.use('/captcha', captchaRoutes);
router.use('/healthcheck', require('./healthcheck'));

router.use('/cliente', middlewares.requerClienteApiKey);
router.use('/cliente', require('./cliente'));

router.use('/consulta', middlewares.requerClienteApiKey);
router.use('/consulta', require('./consulta'));

router.use('/cota', cotaRoutes);

module.exports = router;

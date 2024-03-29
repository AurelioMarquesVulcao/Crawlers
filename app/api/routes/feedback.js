const router = require("express").Router();
const feedback = require("./feedback");
const { FeedbackController } = require("../controller/feedbackController");

router.get('/', (req, res) => { res.send('Não há rota padrao para /api/feedback'); });
router.post('/receber', FeedbackController.receber);
router.post('/marcar-atualizado', FeedbackController.marcarAtualizado);
router.post('/feedbackAntiCaptcha', FeedbackController.anticaptcha);

module.exports = router;

const router = require("express").Router();
const feedbackRoutes = require("./feedback");
const mockRoutes = require("./mock");
const { LogCaptcha } = require("../../models/schemas/logCaptcha");

router.get('/', (req, res) => {
    res.send('Não há rota padrao para /api');
});

router.post('/feedbackAntiCaptcha', (req, res) => {
    let log = {}
    log.Servico = "AntiCaptcha";
    log.Tipo = req.body.Tipo;
    log.Website = req.body.Tipo;
    log.WebsiteKey = req.body.WebsiteKey;
    log.Robo = req.body.Robo;
    log.NumeroProcesso = req.body.NumeroProcesso;
    log.NumeroOab = req.body.NumeroOab;
    log.Data = req.body.Data;
    log.CaptchaBody = req.body.CaptchaBody;

    new LogCaptcha(log).save().then(() => {
        res.send({sucesso: true})
    }).catch(e => res.send({sucesso: false, erro: e.message}));

    res.send('Salvo');
})

router.use("/feedback", feedbackRoutes);
router.use("/mock", mockRoutes);

module.exports = router;

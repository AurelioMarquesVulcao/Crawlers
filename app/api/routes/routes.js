const router = require("express").Router();
const feedbackRoutes = require("./feedback");

router.get('/', (req, res) => {
    res.send('Não há rota padrao para /api');
});

router.use("/feedback", feedbackRoutes);

module.exports = router;

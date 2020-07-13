const router = require("express").Router();
const feedbackRoutes = require("./feedback");
const mockRoutes = require("./mock");

router.get('/', (req, res) => {
    res.send('Não há rota padrao para /api');
});

router.use("/feedback", feedbackRoutes);
router.use("/mock", mockRoutes);

module.exports = router;

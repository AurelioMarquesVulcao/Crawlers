const router = require('express').Router();

router.get('/', (req, res, next) => {
  res.json({ healthy: true });
});

module.exports = router;

const express       = require('express');
const router        = express.Router();
const MysteryPrize  = require('../models/MysteryPrize');
const WheelPrize    = require('../models/WheelPrize');
const { getIndex, submitCode } = require('../controllers/indexController');

router.get('/demo', (req, res) => res.render('demo'));

router.get('/mystery-demo', async (req, res) => {
  try {
    let docs = await MysteryPrize.find().sort({ order: 1, createdAt: 1 });
    if (docs.length === 0) docs = await WheelPrize.find().sort({ order: 1, createdAt: 1 });
    const prizes = docs.map(p => p.name);
    res.render('mystery_demo', { prizes });
  } catch (err) {
    console.error(err);
    res.render('mystery_demo', { prizes: [] });
  }
});

router.get('/',  getIndex);
router.post('/', submitCode);

module.exports = router;

const express = require('express');
const router = express.Router();
const { getIndex, submitCode } = require('../controllers/indexController');

const WheelPrize = require('../models/WheelPrize');
router.get('/demo', async (req, res) => {
  try {
    const prizes = await WheelPrize.find().sort({ order: 1, createdAt: 1 });
    const prizeNames = prizes.map(p => p.name);
    res.render('demo', { prizes: prizeNames.length ? prizeNames : [
      'Keychain 🔑','Sticker Pack 🎨','Pen 🖊️','Notebook 📓',
      'Water Bottle 💧','Chocolate 🍫','Tshirt 👕','Gift Hamper 🎁',
      'Lucky Draw 🍀'
    ] });
  } catch(e) {
    res.render('demo', { prizes: ['Awesome Prizes 🎁'] });
  }
});
router.get('/', getIndex);
router.post('/', submitCode);

module.exports = router;

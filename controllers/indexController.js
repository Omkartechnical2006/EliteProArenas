const Player = require('../models/Player');

// GET /  - Landing page
exports.getIndex = (req, res) => {
  res.render('index', { error: null });
};

// POST / - Code entry
exports.submitCode = async (req, res) => {
  try {
    const { code } = req.body;
    const player = await Player.findOne({ uniqueCode: code.trim() });

    if (!player) {
      return res.render('index', { error: '❌ Invalid code. Please check and try again.' });
    }

    if (player.hasSpun) {
      return res.render('index', { error: '⚠️ This code has already been used!' });
    }

    res.redirect(`/game/wheel/${player.uniqueCode}`);
  } catch (err) {
    console.error(err);
    res.render('index', { error: 'Server error. Please try again.' });
  }
};

const Player      = require('../models/Player');
const OfflineGame = require('../models/OfflineGame');
const Feedback    = require('../models/Feedback');
const WheelPrize  = require('../models/WheelPrize');

// ─── GET /game/wheel/:code ────────────────────────────────────────────────────
exports.getWheel = async (req, res) => {
  try {
    const player = await Player.findOne({ uniqueCode: req.params.code });
    if (!player) return res.redirect('/');
    if (player.hasSpun) return res.redirect(`/feedback/${player.uniqueCode}`);

    // Load prizes from DB
    const prizesDocs  = await WheelPrize.find().sort({ order: 1, createdAt: 1 });
    const wheelPrizes = prizesDocs.map(p => p.name);

    // Fallback if DB is empty somehow
    const prizeList = wheelPrizes.length > 0 ? wheelPrizes : ['Better Luck Next Time 😅'];

    res.render('wheel', {
      player,
      wheelPrizes: JSON.stringify(prizeList),
      assignedPrize: player.assignedPrize
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// ─── POST /game/mark-spun (AJAX) ──────────────────────────────────────────────
exports.markSpun = async (req, res) => {
  try {
    const { uniqueCode } = req.body;
    await Player.findOneAndUpdate({ uniqueCode }, { hasSpun: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

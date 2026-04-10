const Player        = require('../models/Player');
const WheelPrize    = require('../models/WheelPrize');
const MysteryPrize  = require('../models/MysteryPrize');

// ─── GET /game/wheel/:code ────────────────────────────────────────────────────
exports.getWheel = async (req, res) => {
  try {
    const player = await Player.findOne({ uniqueCode: req.params.code });
    if (!player) return res.redirect('/');
    if (player.hasSpun) return res.redirect(`/feedback/${player.uniqueCode}`);
    if (player.gameType === 'mystery') return res.redirect(`/game/mystery/${player.uniqueCode}`);

    const prizesDocs  = await WheelPrize.find().sort({ order: 1, createdAt: 1 });
    const wheelPrizes = prizesDocs.map(p => p.name);
    const prizeList   = wheelPrizes.length > 0 ? wheelPrizes : ['Better Luck Next Time 😅'];

    res.render('wheel', { player, wheelPrizes: JSON.stringify(prizeList), assignedPrize: player.assignedPrize });
  } catch (err) { console.error(err); res.redirect('/'); }
};

// ─── GET /game/mystery/:code ──────────────────────────────────────────────────
exports.getMystery = async (req, res) => {
  try {
    const player = await Player.findOne({ uniqueCode: req.params.code });
    if (!player) return res.redirect('/');
    if (player.hasSpun) return res.redirect(`/feedback/${player.uniqueCode}`);
    if (player.gameType === 'wheel') return res.redirect(`/game/wheel/${player.uniqueCode}`);

    // Use MysteryPrize list; fall back to WheelPrize if empty
    let prizesDocs = await MysteryPrize.find().sort({ order: 1, createdAt: 1 });
    if (prizesDocs.length === 0) prizesDocs = await WheelPrize.find().sort({ order: 1, createdAt: 1 });
    const allPrizes = prizesDocs.map(p => p.name);
    const prizeList = allPrizes.length > 0 ? allPrizes : ['Better Luck Next Time 😅'];

    // Box count = total prizes available (min 6, max 9)
    const boxCount = Math.min(9, Math.max(6, prizeList.length));

    res.render('mystery', {
      player,
      allPrizes:     JSON.stringify(prizeList),
      assignedPrize: player.assignedPrize,
      boxCount
    });
  } catch (err) { console.error(err); res.redirect('/'); }
};

// ─── POST /game/mark-spun (AJAX) ──────────────────────────────────────────────
exports.markSpun = async (req, res) => {
  try {
    const { uniqueCode } = req.body;
    await Player.findOneAndUpdate({ uniqueCode }, { hasSpun: true });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

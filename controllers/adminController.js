const Player        = require('../models/Player');
const OfflineGame   = require('../models/OfflineGame');
const Faculty       = require('../models/Faculty');
const Feedback      = require('../models/Feedback');
const WheelPrize    = require('../models/WheelPrize');
const MysteryPrize  = require('../models/MysteryPrize');
const GameSettings  = require('../models/GameSettings');

const DEFAULT_WHEEL_PRIZES = [
  'Keychain 🔑','Sticker Pack 🎨','Pen 🖊️','Notebook 📓',
  'Water Bottle 💧','Chocolate 🍫','Tshirt 👕','Gift Hamper 🎁',
  'Better Luck Next Time 😅'
];
const DEFAULT_MYSTERY_PRIZES = [
  'Candy 🍬','Keychain 🔑','Sticker Pack 🎨','Pen 🖊️',
  'Notebook 📓','Chocolate 🍫','Water Bottle 💧','Tshirt 👕',
  'Gift Hamper 🎁','Lucky Draw 🍀','Better Luck Next Time 😅'
];

async function seedPrizesIfEmpty() {
  const [wCount, mCount] = await Promise.all([
    WheelPrize.countDocuments(),
    MysteryPrize.countDocuments()
  ]);
  if (wCount === 0)
    await WheelPrize.insertMany(DEFAULT_WHEEL_PRIZES.map((name, i) => ({ name, order: i })));
  if (mCount === 0)
    await MysteryPrize.insertMany(DEFAULT_MYSTERY_PRIZES.map((name, i) => ({ name, order: i })));
}

async function getOrCreateSettings() {
  let s = await GameSettings.findOne({ key: 'main' });
  if (!s) s = await GameSettings.create({ key: 'main' });
  return s;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) return next();
  // For AJAX / API calls (DELETE, PATCH, POST) return JSON 401 so the
  // frontend can handle session expiry gracefully instead of getting HTML.
  if (req.method !== 'GET') {
    return res.status(401).json({ success: false, error: 'Session expired. Please login again.', redirect: '/admin/login' });
  }
  res.redirect('/admin/login');
};

exports.getLogin = (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('adminLogin', { error: null });
};

exports.postLogin = (req, res) => {
  if (req.body.password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('adminLogin', { error: 'Incorrect password. Try again.' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

// ─── Common data loader ───────────────────────────────────────────────────────
async function loadAdminData() {
  await seedPrizesIfEmpty();
  const [games, players, faculties, feedbacks, prizes, mysteryPrizes, settings] = await Promise.all([
    OfflineGame.find().sort({ createdAt: -1 }),
    Player.find().sort({ createdAt: -1 }).limit(50),
    Faculty.find().sort({ facultyName: 1 }),
    Feedback.find()
      .populate('userId', 'name type course uniqueCode assignedPrize gameType ticketPrice')
      .sort({ createdAt: -1 }),
    WheelPrize.find().sort({ order: 1, createdAt: 1 }),
    MysteryPrize.find().sort({ order: 1, createdAt: 1 }),
    getOrCreateSettings()
  ]);

  // Revenue analytics — group all players by date
  const allPlayers = await Player.find().sort({ createdAt: -1 });
  const revenueByDate = {};
  allPlayers.forEach(p => {
    const d   = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    if (!revenueByDate[key]) revenueByDate[key] = { players: [], total: 0, wheelTotal: 0, mysteryTotal: 0 };
    revenueByDate[key].players.push(p);
    revenueByDate[key].total += (p.ticketPrice || 0);
    if (p.gameType === 'mystery') revenueByDate[key].mysteryTotal += (p.ticketPrice || 0);
    else revenueByDate[key].wheelTotal += (p.ticketPrice || 0);
  });

  const sortedDates  = Object.keys(revenueByDate).sort((a, b) => b.localeCompare(a));
  const totalRevenue = allPlayers.reduce((s, p) => s + (p.ticketPrice || 0), 0);
  const totalFeedbacks = feedbacks.length;
  const avgStall = totalFeedbacks
    ? (feedbacks.reduce((s, f) => s + f.stallRating, 0) / totalFeedbacks).toFixed(1) : 'N/A';

  return { games, players, faculties, feedbacks, prizes, mysteryPrizes, settings,
           revenueByDate, sortedDates, totalRevenue, totalFeedbacks, avgStall };
}

// ─── GET /admin ───────────────────────────────────────────────────────────────
exports.getAdminPanel = async (req, res) => {
  try {
    const data  = await loadAdminData();
    const flash = req.session.generatedFlash || null;
    if (req.session.generatedFlash) delete req.session.generatedFlash;
    res.render('admin', { ...data, generatedCode: flash?.code || null, newPlayer: flash?.player || null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error: ' + err.message);
  }
};

// ─── POST /admin/generate-code ────────────────────────────────────────────────
exports.generateCode = async (req, res) => {
  try {
    const rawName = req.body.name;
    const name = Array.isArray(rawName)
      ? rawName.find(n => n && n.trim()) || '' : rawName;
    const { type, course, assignedPrize, gameType } = req.body;

    const settings    = await getOrCreateSettings();
    const ticketPrice = gameType === 'mystery' ? settings.mysteryPrice : settings.wheelPrice;

    let uniqueCode, exists = true;
    while (exists) {
      uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
      if (!await Player.findOne({ uniqueCode })) exists = false;
    }

    const player = new Player({ name, type, course, uniqueCode, assignedPrize,
                                gameType: gameType || 'wheel', ticketPrice });
    await player.save();

    req.session.generatedFlash = { code: uniqueCode, player };
    req.session.save(() => res.redirect('/admin'));
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error: ' + err.message);
  }
};

// ─── Games ────────────────────────────────────────────────────────────────────
exports.addGame = async (req, res) => {
  try { await OfflineGame.create({ gameName: req.body.gameName }); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
exports.deleteGame = async (req, res) => {
  try { await OfflineGame.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
exports.toggleGame = async (req, res) => {
  try {
    const game = await OfflineGame.findById(req.params.id);
    if (!game) return res.status(404).json({ success: false });
    game.isActive = !game.isActive; await game.save(); res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Faculty ──────────────────────────────────────────────────────────────────
exports.addFaculty = async (req, res) => {
  try {
    await Faculty.create({ facultyName: req.body.facultyName, department: req.body.department });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
exports.deleteFaculty = async (req, res) => {
  try { await Faculty.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Players ──────────────────────────────────────────────────────────────────
exports.deletePlayer = async (req, res) => {
  try { await Player.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Feedback ─────────────────────────────────────────────────────────────────
exports.deleteFeedback = async (req, res) => {
  try { await Feedback.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Wheel Prizes ─────────────────────────────────────────────────────────────
exports.addPrize = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.json({ success: false, error: 'Name required' });
    const count = await WheelPrize.countDocuments();
    await WheelPrize.create({ name: name.trim(), order: count });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
exports.deletePrize = async (req, res) => {
  try { await WheelPrize.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
exports.resetPrizes = async (req, res) => {
  try {
    await WheelPrize.deleteMany({});
    await WheelPrize.insertMany(DEFAULT_WHEEL_PRIZES.map((name, i) => ({ name, order: i })));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Mystery Prizes ───────────────────────────────────────────────────────────
exports.addMysteryPrize = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.json({ success: false, error: 'Name required' });
    const count = await MysteryPrize.countDocuments();
    await MysteryPrize.create({ name: name.trim(), order: count });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
exports.deleteMysteryPrize = async (req, res) => {
  try { await MysteryPrize.findByIdAndDelete(req.params.id); res.json({ success: true }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
exports.resetMysteryPrizes = async (req, res) => {
  try {
    await MysteryPrize.deleteMany({});
    await MysteryPrize.insertMany(DEFAULT_MYSTERY_PRIZES.map((name, i) => ({ name, order: i })));
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

// ─── Settings ─────────────────────────────────────────────────────────────────
exports.saveSettings = async (req, res) => {
  try {
    const { wheelPrice, mysteryPrice } = req.body;
    await GameSettings.findOneAndUpdate(
      { key: 'main' },
      { wheelPrice: parseFloat(wheelPrice) || 0, mysteryPrice: parseFloat(mysteryPrice) || 0 },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

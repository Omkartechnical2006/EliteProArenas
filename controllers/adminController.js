const Player      = require('../models/Player');
const OfflineGame = require('../models/OfflineGame');
const Faculty     = require('../models/Faculty');
const Feedback    = require('../models/Feedback');
const WheelPrize  = require('../models/WheelPrize');

const DEFAULT_PRIZES = [
  'Keychain 🔑', 'Sticker Pack 🎨', 'Pen 🖊️', 'Notebook 📓',
  'Water Bottle 💧', 'Chocolate 🍫', 'Tshirt 👕', 'Gift Hamper 🎁',
  'Better Luck Next Time 😅'
];

// ─── Seed default prizes if none exist ───────────────────────────────────────
async function seedPrizesIfEmpty() {
  const count = await WheelPrize.countDocuments();
  if (count === 0) {
    await WheelPrize.insertMany(
      DEFAULT_PRIZES.map((name, i) => ({ name, order: i }))
    );
  }
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) return next();
  // For AJAX / API calls (DELETE, PATCH, POST with JSON accept) return 401 JSON
  // so the frontend can handle it gracefully instead of getting a redirect HTML page
  if (req.method !== 'GET') {
    return res.status(401).json({ success: false, error: 'Session expired. Please login again.', redirect: '/admin/login' });
  }
  res.redirect('/admin/login');
};

// ─── GET /admin/login ─────────────────────────────────────────────────────────
exports.getLogin = (req, res) => {
  if (req.session && req.session.isAdmin) return res.redirect('/admin');
  res.render('adminLogin', { error: null });
};

// ─── POST /admin/login ────────────────────────────────────────────────────────
exports.postLogin = (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.render('adminLogin', { error: 'Incorrect password. Try again.' });
  }
};

// ─── GET /admin/logout ────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  req.session.destroy(() => res.redirect('/admin/login'));
};

// ─── Helper: load all common data ────────────────────────────────────────────
async function loadAdminData() {
  await seedPrizesIfEmpty();
  const [games, players, faculties, feedbacks, prizes] = await Promise.all([
    OfflineGame.find().sort({ createdAt: -1 }),
    Player.find().sort({ createdAt: -1 }).limit(50),
    Faculty.find().sort({ facultyName: 1 }),
    Feedback.find()
      .populate('userId', 'name type course uniqueCode assignedPrize')
      .sort({ createdAt: -1 }),
    WheelPrize.find().sort({ order: 1, createdAt: 1 })
  ]);
  const totalFeedbacks = feedbacks.length;
  const avgStall = totalFeedbacks
    ? (feedbacks.reduce((s, f) => s + f.stallRating, 0) / totalFeedbacks).toFixed(1)
    : 'N/A';
  return { games, players, faculties, feedbacks, prizes, totalFeedbacks, avgStall };
}

// ─── GET /admin ───────────────────────────────────────────────────────────────
exports.getAdminPanel = async (req, res) => {
  try {
    // Read & clear flash data set by generateCode (PRG pattern)
    const flash = req.session.flash || {};
    delete req.session.flash;

    const data = await loadAdminData();
    res.render('admin', {
      ...data,
      generatedCode: flash.generatedCode || null,
      newPlayer:     flash.newPlayer     || null,
    });
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
      ? rawName.find(n => n && n.trim()) || ''
      : rawName;
    const { type, course, assignedPrize } = req.body;

    // Unique 4-digit code
    let uniqueCode, exists = true;
    while (exists) {
      uniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
      const found = await Player.findOne({ uniqueCode });
      if (!found) exists = false;
    }

    const player = new Player({ name, type, course, uniqueCode, assignedPrize });
    await player.save();

    // PRG pattern: store result in session flash and redirect to GET /admin
    // This prevents duplicate player creation when the user refreshes the page.
    req.session.flash = {
      generatedCode: uniqueCode,
      newPlayer: { name: player.name, assignedPrize: player.assignedPrize },
    };
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error: ' + err.message);
  }
};

// ─── POST /admin/games/add ────────────────────────────────────────────────────
exports.addGame = async (req, res) => {
  try {
    await OfflineGame.create({ gameName: req.body.gameName });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /admin/games/:id ──────────────────────────────────────────────────
exports.deleteGame = async (req, res) => {
  try {
    await OfflineGame.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── PATCH /admin/games/:id ───────────────────────────────────────────────────
exports.toggleGame = async (req, res) => {
  try {
    const game = await OfflineGame.findById(req.params.id);
    if (!game) return res.status(404).json({ success: false, error: 'Not found' });
    game.isActive = !game.isActive;
    await game.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /admin/faculty/add ──────────────────────────────────────────────────
exports.addFaculty = async (req, res) => {
  try {
    await Faculty.create({ facultyName: req.body.facultyName, department: req.body.department });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /admin/faculty/:id ────────────────────────────────────────────────
exports.deleteFaculty = async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /admin/players/:id ────────────────────────────────────────────────
exports.deletePlayer = async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /admin/feedback/:id ───────────────────────────────────────────────
exports.deleteFeedback = async (req, res) => {
  try {
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /admin/prizes/add ───────────────────────────────────────────────────
exports.addPrize = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.json({ success: false, error: 'Name required' });
    const count = await WheelPrize.countDocuments();
    await WheelPrize.create({ name: name.trim(), order: count });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── DELETE /admin/prizes/:id ─────────────────────────────────────────────────
exports.deletePrize = async (req, res) => {
  try {
    await WheelPrize.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ─── POST /admin/prizes/reset ─────────────────────────────────────────────────
exports.resetPrizes = async (req, res) => {
  try {
    await WheelPrize.deleteMany({});
    await WheelPrize.insertMany(
      DEFAULT_PRIZES.map((name, i) => ({ name, order: i }))
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

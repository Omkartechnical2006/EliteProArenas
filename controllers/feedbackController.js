const Player      = require('../models/Player');
const OfflineGame = require('../models/OfflineGame');
const Feedback    = require('../models/Feedback');

// ─── GET /feedback/:code ──────────────────────────────────────────────────────
exports.getFeedback = async (req, res) => {
  try {
    const player = await Player.findOne({ uniqueCode: req.params.code });
    if (!player) return res.redirect('/');

    const activeGames = await OfflineGame.find({ isActive: true });
    res.render('feedback', { player, activeGames, submitted: false, message: '' });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// ─── POST /feedback/:code ─────────────────────────────────────────────────────
exports.submitFeedback = async (req, res) => {
  try {
    const player = await Player.findOne({ uniqueCode: req.params.code });
    if (!player) return res.redirect('/');

    const { stallRating, comments } = req.body;
    const activeGames = await OfflineGame.find({ isActive: true });

    // Build gamesRating array
    const gamesRating = [];
    for (const game of activeGames) {
      const ratingKey = `game_${game._id}`;
      if (req.body[ratingKey]) {
        gamesRating.push({ gameName: game.gameName, rating: parseInt(req.body[ratingKey]) });
      }
    }

    // Prevent duplicate submission
    const existing = await Feedback.findOne({ userId: player._id });
    if (existing) {
      return res.render('feedback', {
        player, activeGames, submitted: true,
        message: 'You have already submitted feedback!'
      });
    }

    await Feedback.create({
      userId: player._id,
      stallRating: parseInt(stallRating),
      gamesRating,
      comments,
      isGuest: false
    });

    res.render('feedback', {
      player, activeGames, submitted: true,
      message: 'Thank you for your feedback!'
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// ─── GET /feedback/general ────────────────────────────────────────────────────
exports.getGeneralFeedback = async (req, res) => {
  try {
    const activeGames = await OfflineGame.find({ isActive: true });
    res.render('feedback_general', { activeGames, submitted: false, message: '' });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

// ─── POST /feedback/general ───────────────────────────────────────────────────
exports.submitGeneralFeedback = async (req, res) => {
  try {
    const { guestName, guestDept, stallRating, comments } = req.body;
    const activeGames = await OfflineGame.find({ isActive: true });

    const gamesRating = [];
    for (const game of activeGames) {
      const ratingKey = `game_${game._id}`;
      if (req.body[ratingKey]) {
        gamesRating.push({ gameName: game.gameName, rating: parseInt(req.body[ratingKey]) });
      }
    }

    await Feedback.create({
      userId: null,
      guestName: guestName ? guestName.trim() : 'Anonymous',
      guestDept: guestDept ? guestDept.trim() : '',
      stallRating: parseInt(stallRating),
      gamesRating,
      comments,
      isGuest: true
    });

    res.render('feedback_general', {
      activeGames, submitted: true,
      message: 'Thank you for your feedback!'
    });
  } catch (err) {
    console.error(err);
    res.redirect('/');
  }
};

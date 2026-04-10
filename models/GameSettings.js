const mongoose = require('mongoose');

// Singleton settings document (key = 'main')
const gameSettingsSchema = new mongoose.Schema({
  key:          { type: String, default: 'main', unique: true },
  wheelPrice:   { type: Number, default: 0 },
  mysteryPrice: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('GameSettings', gameSettingsSchema);

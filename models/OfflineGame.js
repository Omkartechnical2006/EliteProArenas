const mongoose = require('mongoose');

const offlineGameSchema = new mongoose.Schema({
  gameName: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('OfflineGame', offlineGameSchema);

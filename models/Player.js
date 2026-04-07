const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Student', 'Faculty'], required: true },
  course: { type: String, trim: true },
  uniqueCode: { type: String, required: true, unique: true },
  assignedPrize: { type: String, required: true },
  hasSpun: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);

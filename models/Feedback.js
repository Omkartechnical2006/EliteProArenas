const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  guestName:   { type: String, trim: true },
  guestDept:   { type: String, trim: true },
  stallRating: { type: Number, min: 1, max: 5, required: true },
  gamesRating: [
    {
      gameName: { type: String },
      rating:   { type: Number, min: 1, max: 5 }
    }
  ],
  comments:    { type: String, trim: true },
  isGuest:     { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);

const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
  facultyName: { type: String, required: true, trim: true },
  department: { type: String, required: true, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Faculty', facultySchema);

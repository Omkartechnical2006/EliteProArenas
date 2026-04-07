const express = require('express');
const router = express.Router();
const Faculty = require('../models/Faculty');

// GET /api/faculty/search?q=searchTerm
router.get('/faculty/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const faculties = await Faculty.find({
      facultyName: { $regex: q, $options: 'i' }
    }).limit(10);
    res.json(faculties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

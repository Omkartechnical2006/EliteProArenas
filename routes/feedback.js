const express = require('express');
const router  = express.Router();
const {
  getGeneralFeedback, submitGeneralFeedback,
  getFeedback,        submitFeedback
} = require('../controllers/feedbackController');

// IMPORTANT: /general must be defined BEFORE /:code to avoid conflict
router.get('/general',  getGeneralFeedback);
router.post('/general', submitGeneralFeedback);

router.get('/:code',    getFeedback);
router.post('/:code',   submitFeedback);

module.exports = router;

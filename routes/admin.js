const express = require('express');
const router  = express.Router();
const {
  isAuthenticated,
  getLogin, postLogin, logout,
  getAdminPanel, generateCode,
  addGame, deleteGame, toggleGame,
  addFaculty, deleteFaculty,
  deletePlayer,
  deleteFeedback,
  addPrize, deletePrize, resetPrizes
} = require('../controllers/adminController');

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.get('/login',  getLogin);
router.post('/login', postLogin);
router.get('/logout', logout);

// ─── Protected Routes (must be logged in) ─────────────────────────────────────
router.get('/',                     isAuthenticated, getAdminPanel);
router.post('/generate-code',       isAuthenticated, generateCode);

router.post('/games/add',           isAuthenticated, addGame);
router.delete('/games/:id',         isAuthenticated, deleteGame);
router.patch('/games/:id',          isAuthenticated, toggleGame);

router.post('/faculty/add',         isAuthenticated, addFaculty);
router.delete('/faculty/:id',       isAuthenticated, deleteFaculty);

router.delete('/players/:id',       isAuthenticated, deletePlayer);

router.delete('/feedback/:id',      isAuthenticated, deleteFeedback);

router.post('/prizes/add',          isAuthenticated, addPrize);
router.delete('/prizes/:id',        isAuthenticated, deletePrize);
router.post('/prizes/reset',        isAuthenticated, resetPrizes);

module.exports = router;

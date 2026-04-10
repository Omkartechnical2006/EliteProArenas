const express = require('express');
const router  = express.Router();
const {
  isAuthenticated, getLogin, postLogin, logout,
  getAdminPanel, generateCode,
  addGame, deleteGame, toggleGame,
  addFaculty, deleteFaculty,
  deletePlayer, deleteFeedback,
  addPrize, deletePrize, resetPrizes,
  addMysteryPrize, deleteMysteryPrize, resetMysteryPrizes,
  saveSettings
} = require('../controllers/adminController');

router.get('/login',                    getLogin);
router.post('/login',                   postLogin);
router.get('/logout',                   logout);

router.get('/',                         isAuthenticated, getAdminPanel);
router.post('/generate-code',           isAuthenticated, generateCode);

router.post('/games/add',               isAuthenticated, addGame);
router.delete('/games/:id',             isAuthenticated, deleteGame);
router.patch('/games/:id',              isAuthenticated, toggleGame);

router.post('/faculty/add',             isAuthenticated, addFaculty);
router.delete('/faculty/:id',           isAuthenticated, deleteFaculty);

router.delete('/players/:id',           isAuthenticated, deletePlayer);
router.delete('/feedback/:id',          isAuthenticated, deleteFeedback);

// Wheel prizes
router.post('/prizes/add',              isAuthenticated, addPrize);
router.delete('/prizes/:id',            isAuthenticated, deletePrize);
router.post('/prizes/reset',            isAuthenticated, resetPrizes);

// Mystery box prizes
router.post('/mystery-prizes/add',      isAuthenticated, addMysteryPrize);
router.delete('/mystery-prizes/:id',    isAuthenticated, deleteMysteryPrize);
router.post('/mystery-prizes/reset',    isAuthenticated, resetMysteryPrizes);

router.post('/settings',                isAuthenticated, saveSettings);

module.exports = router;

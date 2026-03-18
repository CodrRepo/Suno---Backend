const express = require('express');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');
const adminController = require('../controllers/admin.controller');

const router = express.Router();

router.get('/users', verifyToken, requireAdmin, adminController.listUsers);
router.delete('/users/:userId', verifyToken, requireAdmin, adminController.deleteUserAdmin);

router.get('/songs', verifyToken, requireAdmin, adminController.listSongs);
router.delete('/songs/:songId', verifyToken, requireAdmin, adminController.deleteSongAdmin);

module.exports = router;

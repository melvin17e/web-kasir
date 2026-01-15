const express = require('express');
const router = express.Router();
const { login, register, me, logout } = require('../controllers/authController');
const { auth, adminOnly } = require('../middlewares/auth');

// Public routes
router.post('/login', login);

// Protected routes
router.get('/me', auth, me);
router.post('/logout', auth, logout);
router.post('/register', auth, adminOnly, register);

module.exports = router;

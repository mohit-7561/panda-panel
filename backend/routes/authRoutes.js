const express = require('express');
const router = express.Router();
const { register, login, getUserProfile, createOwner } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimit');

// Routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/create-owner', createOwner);
router.get('/profile', protect, getUserProfile);

module.exports = router; 
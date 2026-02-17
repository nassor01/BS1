const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { signupValidation, loginValidation } = require('../middleware/validation');
const { authLimiter } = require('../middleware/rateLimiter');

// Public routes with rate limiting and validation
router.post('/signup', authLimiter, signupValidation, authController.signup);
router.post('/login', authLimiter, loginValidation, authController.login);
router.post('/refresh-token', authLimiter, authController.refreshToken);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router;

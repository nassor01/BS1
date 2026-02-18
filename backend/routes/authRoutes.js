const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
    signupValidation: validateSignup,
    loginValidation: validateLogin,
    handleValidationErrors
} = require('../middleware/validation');
const { body } = require('express-validator');

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /signup - Register new user
router.post('/signup',
    authLimiter,
    validateSignup,
    handleValidationErrors,
    authController.signup
);

// POST /login - Login
router.post('/login',
    authLimiter,
    validateLogin,
    handleValidationErrors,
    authController.login
);

// POST /refresh-token - Refresh access token
router.post('/refresh-token', authController.refreshToken);

// GET /me - Get current user (protected)
router.get('/me', authenticate, authController.getCurrentUser);

// ============================================================
// EMAIL VERIFICATION
// ============================================================

// POST /auth/verify-email - Verify email with token
router.post('/auth/verify-email',
    [body('token').notEmpty().withMessage('Verification token is required')],
    handleValidationErrors,
    authController.verifyEmail
);

// POST /auth/resend-verification - Resend verification email
router.post('/auth/resend-verification',
    authLimiter,
    [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
    handleValidationErrors,
    authController.resendVerification
);

// ============================================================
// PASSWORD RESET
// ============================================================

// POST /auth/forgot-password - Request password reset
router.post('/auth/forgot-password',
    authLimiter,
    [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
    handleValidationErrors,
    authController.forgotPassword
);

// POST /auth/reset-password - Reset password with token
router.post('/auth/reset-password',
    authLimiter,
    [
        body('token').notEmpty().withMessage('Reset token is required'),
        body('newPassword')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],
    handleValidationErrors,
    authController.resetPassword
);

module.exports = router;

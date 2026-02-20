const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const twoFactorController = require('../controllers/twoFactorController');
const sessionManager = require('../services/sessionManager');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const {
    signupValidation: validateSignup,
    loginValidation: validateLogin,
    userIdParamValidation,
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

// POST /logout - Logout and remove session
router.post('/logout', authenticate, async (req, res) => {
    try {
        sessionManager.removeSession(req.user.id);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});

// GET /active-users - Get all active users (admin only)
router.get('/active-users', authenticate, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const activeUsers = sessionManager.getActiveSessions();
        res.json({ activeUsers });
    } catch (error) {
        console.error('Get active users error:', error);
        res.status(500).json({ error: 'Failed to fetch active users' });
    }
});

// POST /disconnect-user/:userId - Disconnect a specific user session (admin only)
router.post('/disconnect-user/:userId', authenticate, userIdParamValidation, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const userIdToDisconnect = parseInt(req.params.userId);
        
        // Cannot disconnect yourself
        if (userIdToDisconnect === req.user.id) {
            return res.status(400).json({ error: 'Cannot disconnect your own session' });
        }
        
        sessionManager.removeSession(userIdToDisconnect);
        res.json({ message: 'User disconnected successfully' });
    } catch (error) {
        console.error('Disconnect user error:', error);
        res.status(500).json({ error: 'Failed to disconnect user' });
    }
});

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

// POST /forgot-password - Request password reset PIN
router.post('/forgot-password',
    authLimiter,
    [body('email').isEmail().normalizeEmail().withMessage('Valid email is required')],
    handleValidationErrors,
    authController.forgotPassword
);

// POST /reset-password-pin - Reset password with PIN
router.post('/reset-password-pin',
    authLimiter,
    [
        body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be 6 digits'),
        body('newPassword')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],
    handleValidationErrors,
    authController.resetPasswordWithPin
);

// POST /reset-password - Reset password with token (legacy)
router.post('/reset-password',
    authLimiter,
    [
        body('token').notEmpty().withMessage('Reset token is required'),
        body('newPassword')
            .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    ],
    handleValidationErrors,
    authController.resetPassword
);

// GET /generate-password - Generate a strong password suggestion
router.get('/generate-password', authController.generatePassword);

module.exports = router;

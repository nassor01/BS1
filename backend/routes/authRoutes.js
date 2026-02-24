const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const twoFactorController = require('../controllers/twoFactorController');
const sessionManager = require('../services/sessionManager');
const { authenticate } = require('../middleware/auth');
const { authLimiter, adminAuthLimiter } = require('../middleware/rateLimiter');
const verifyRecaptcha = require('../middleware/verifyRecaptcha');
const {
    signupValidation,
    loginValidation,
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
    signupValidation,
    handleValidationErrors,
    authController.signup
);

// POST /login - Login
router.post('/login',
    authLimiter,
    loginValidation,
    handleValidationErrors,
    authController.login
);

// POST /admin/login - Admin login (reCAPTCHA optional for now)
router.post('/admin/login',
    adminAuthLimiter,
    authController.adminLogin
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
        const userRole = req.user.role;
        
        // Only admin and super_admin can access this
        if (userRole !== 'admin' && userRole !== 'super_admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        let activeUsers = sessionManager.getActiveSessions();
        
        // If admin (not super_admin), filter out super admins and other admins from the list
        if (userRole === 'admin') {
            activeUsers = activeUsers.filter(user => user.role === 'user');
        }
        
        res.json({ activeUsers });
    } catch (error) {
        console.error('Get active users error:', error);
        res.status(500).json({ error: 'Failed to fetch active users' });
    }
});

// POST /disconnect-user/:userId - Disconnect a specific user session (admin only)
router.post('/disconnect-user/:userId', authenticate, userIdParamValidation, async (req, res) => {
    try {
        const adminRole = req.user.role;
        
        // Only admin and super_admin can disconnect users
        if (adminRole !== 'admin' && adminRole !== 'super_admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }
        
        const userIdToDisconnect = parseInt(req.params.userId);
        
        // Get the target user's role from database
        const [users] = await require('../config/db').dbPromise.query(
            'SELECT id, email, role FROM users WHERE id = ?',
            [userIdToDisconnect]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const targetUser = users[0];
        
        // Admin cannot disconnect super_admin
        if (adminRole === 'admin' && targetUser.role === 'super_admin') {
            return res.status(403).json({ error: 'Cannot disconnect super admin' });
        }
        
        // Admin cannot disconnect other admins
        if (adminRole === 'admin' && targetUser.role === 'admin') {
            return res.status(403).json({ error: 'Cannot disconnect other admin' });
        }
        
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

// POST /verify-password-reset-otp - Verify OTP after password reset
router.post('/verify-password-reset-otp',
    authLimiter,
    [
        body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
        body('tempToken').notEmpty().withMessage('Temp token is required')
    ],
    handleValidationErrors,
    authController.verifyPasswordResetOtp
);

// POST /resend-password-reset-otp - Resend OTP after password reset
router.post('/resend-password-reset-otp',
    authLimiter,
    [
        body('tempToken').notEmpty().withMessage('Temp token is required')
    ],
    handleValidationErrors,
    authController.resendPasswordResetOtp
);

// GET /generate-password - Generate a strong password suggestion
router.get('/generate-password', authController.generatePassword);

module.exports = router;

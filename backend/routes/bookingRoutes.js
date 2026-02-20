const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const analyticsController = require('../controllers/analyticsController');
const AuditLogger = require('../middleware/auditLogger');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { bookingValidation, bookingStatusValidation, idParamValidation, userIdParamValidation, handleValidationErrors } = require('../middleware/validation');
const { bookingLimiter } = require('../middleware/rateLimiter');
const { body } = require('express-validator');

// ============================================================
// BOOKING ROUTES
// ============================================================

// POST /book - Create a booking (with notes and category support)
router.post('/book',
    authenticate,
    bookingLimiter,
    bookingValidation,
    [
        body('notes').optional().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
        body('category').optional().isIn(['meeting', 'event', 'training', 'co-working', 'other']).withMessage('Invalid category')
    ],
    handleValidationErrors,
    AuditLogger.middleware('BOOKING_CREATED', 'booking'),
    bookingController.createBooking
);

// GET /bookings/user/:userId - Get user's bookings
router.get('/bookings/user/:userId', authenticate, userIdParamValidation, bookingController.getUserBookings);

// ============================================================
// ADMIN BOOKING ROUTES
// ============================================================

// PUT /bookings/:id/status - Update booking status (admin only)
router.put('/bookings/:id/status',
    authenticate,
    authorizeAdmin,
    bookingStatusValidation,
    handleValidationErrors,
    AuditLogger.middleware('BOOKING_STATUS_UPDATED', 'booking'),
    bookingController.updateBookingStatus
);

// GET /admin/bookings - Get all bookings (admin only)
router.get('/admin/bookings', authenticate, authorizeAdmin, bookingController.getAdminBookings);

// ============================================================
// ANALYTICS ROUTES (admin only)
// ============================================================

// GET /admin/analytics - Comprehensive booking analytics
router.get('/admin/analytics', authenticate, authorizeAdmin, analyticsController.getAnalytics);

// GET /admin/analytics/users - User activity stats
router.get('/admin/analytics/users', authenticate, authorizeAdmin, analyticsController.getUserStats);

module.exports = router;

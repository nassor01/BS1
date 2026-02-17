const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { bookingValidation, bookingStatusValidation, idParamValidation } = require('../middleware/validation');
const { bookingLimiter } = require('../middleware/rateLimiter');

// Protected routes - require authentication
router.post('/book', authenticate, bookingLimiter, bookingValidation, bookingController.createBooking);
router.get('/bookings/user/:userId', authenticate, idParamValidation, bookingController.getUserBookings);

// Admin only routes
router.put('/bookings/:id/status', authenticate, authorizeAdmin, bookingStatusValidation, bookingController.updateBookingStatus);
router.get('/admin/bookings', authenticate, authorizeAdmin, bookingController.getAdminBookings);

module.exports = router;

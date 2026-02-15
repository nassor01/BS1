const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

router.post('/book', bookingController.createBooking);
router.put('/bookings/:id/status', bookingController.updateBookingStatus);
router.get('/admin/bookings', bookingController.getAdminBookings);
router.get('/bookings/user/:userId', bookingController.getUserBookings);

module.exports = router;

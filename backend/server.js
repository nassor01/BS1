require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { dbPromise } = require('./config/db');
const startReminderCron = require('./cron/reminderCron');

// Import routes
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
    origin: true, // Allow all origins for dev
    credentials: true
}));

// ============================================
// ROUTES
// ============================================

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        await dbPromise.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        res.status(500).json({ status: 'error', database: 'disconnected' });
    }
});

// Auth routes (POST /signup, POST /login)
app.use('/', authRoutes);

// Room routes (GET/POST /rooms, GET/DELETE /rooms/:id)
app.use('/rooms', roomRoutes);

// Booking routes (POST /book, PUT /bookings/:id/status, GET /admin/bookings, GET /bookings/user/:userId)
app.use('/', bookingRoutes);

// Start cron jobs
startReminderCron();

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

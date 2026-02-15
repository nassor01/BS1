const { dbPromise } = require('../config/db');

const BookingModel = {
    async findConflicting(roomId, date, startTime, endTime) {
        const [rows] = await dbPromise.query(
            `SELECT * FROM bookings 
             WHERE room_id = ? 
             AND booking_date = ? 
             AND status IN ('pending', 'confirmed')
             AND (
                 (start_time <= ? AND end_time > ?) OR
                 (start_time < ? AND end_time >= ?) OR
                 (start_time >= ? AND end_time <= ?)
             )`,
            [roomId, date, startTime, startTime, endTime, endTime, startTime, endTime]
        );
        return rows;
    },

    async create(userId, roomId, date, startTime, endTime, type) {
        const [result] = await dbPromise.query(
            'INSERT INTO bookings (user_id, room_id, booking_date, start_time, end_time, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, roomId, date, startTime, endTime, type, 'pending']
        );
        return result;
    },

    async findByIdWithDetails(id) {
        const [rows] = await dbPromise.query(
            `SELECT b.*, u.full_name, u.email, r.name as room_name 
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN rooms r ON b.room_id = r.id
             WHERE b.id = ?`,
            [id]
        );
        return rows;
    },

    async updateStatus(id, status) {
        await dbPromise.query('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    },

    async findAll() {
        const [rows] = await dbPromise.query(
            `SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.type,
                b.status,
                b.created_at,
                r.name as room_name,
                r.space,
                u.full_name as user_name,
                u.email as user_email
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            JOIN users u ON b.user_id = u.id
            ORDER BY b.booking_date DESC, b.start_time DESC`
        );
        return rows;
    },

    async findByUserId(userId) {
        const [rows] = await dbPromise.query(
            `SELECT 
                b.id,
                b.booking_date,
                b.start_time,
                b.end_time,
                b.type,
                b.status,
                b.created_at,
                r.name as room_name,
                r.space,
                r.capacity
            FROM bookings b
            JOIN rooms r ON b.room_id = r.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time DESC`,
            [userId]
        );
        return rows;
    },

    async findUpcomingConfirmed(dateStr, timeStr, futureTimeStr) {
        const [rows] = await dbPromise.query(
            `SELECT b.*, u.full_name, u.email, r.name as room_name 
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             JOIN rooms r ON b.room_id = r.id
             WHERE b.booking_date = ? 
             AND b.start_time > ? 
             AND b.start_time <= ?
             AND b.status = 'confirmed'`,
            [dateStr, timeStr, futureTimeStr]
        );
        return rows;
    }
};

module.exports = BookingModel;

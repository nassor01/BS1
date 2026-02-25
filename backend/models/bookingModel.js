const { dbPromise } = require('../config/db');

const BookingModel = {
    async findConflicting(roomId, date, startTime, endTime) {
        try {
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
        } catch (error) {
            console.error('Error in findConflicting:', error);
            throw error;
        }
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

    async updateStatusWithReason(id, status, reason) {
        await dbPromise.query('UPDATE bookings SET status = ?, cancellation_reason = ? WHERE id = ?', [status, reason, id]);
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
            LEFT JOIN rooms r ON b.room_id = r.id
            LEFT JOIN users u ON b.user_id = u.id
            ORDER BY b.booking_date DESC, b.start_time DESC`
        );
        return rows;
    },

    async findByUserId(userId) {
        try {
            const [rows] = await dbPromise.query(
                `SELECT 
                    b.id,
                    b.booking_date,
                    b.start_time,
                    b.end_time,
                    b.type,
                    b.status,
                    b.cancellation_reason,
                    b.created_at,
                    r.name as room_name,
                    r.space,
                    r.capacity
                FROM bookings b
                LEFT JOIN rooms r ON b.room_id = r.id
                WHERE b.user_id = ?
                ORDER BY b.booking_date DESC, b.start_time DESC`,
                [userId]
            );
            return rows;
        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
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
    },

    async getQueuePosition(roomId, date, startTime, endTime) {
        const [rows] = await dbPromise.query(
            `SELECT id, user_id FROM bookings 
             WHERE room_id = ? 
             AND booking_date = ? 
             AND status = 'pending'
             AND (
                 (start_time <= ? AND end_time > ?) OR
                 (start_time < ? AND end_time >= ?) OR
                 (start_time >= ? AND end_time <= ?)
             )
             ORDER BY created_at ASC`,
            [roomId, date, startTime, startTime, endTime, endTime, startTime, endTime]
        );
        return rows;
    },

    async findPendingByRoomDate(roomId, date) {
        const [rows] = await dbPromise.query(
            `SELECT b.*, u.full_name, u.email 
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             WHERE b.room_id = ? 
             AND b.booking_date = ? 
             AND b.status = 'pending'
             ORDER BY b.created_at ASC`,
            [roomId, date]
        );
        return rows;
    },

    async createMany(bookings) {
        const connection = await dbPromise.getConnection();
        try {
            await connection.beginTransaction();
            const results = [];
            for (const booking of bookings) {
                const [result] = await connection.query(
                    'INSERT INTO bookings (user_id, room_id, booking_date, start_time, end_time, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [booking.userId, booking.roomId, booking.date, booking.startTime, booking.endTime, booking.type, 'pending']
                );
                results.push({ ...booking, id: result.insertId });
            }
            await connection.commit();
            return results;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
};

module.exports = BookingModel;

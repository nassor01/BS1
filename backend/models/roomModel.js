const { dbPromise } = require('../config/db');

const RoomModel = {
    async findAll(date) {
        const query = `
            SELECT 
                r.*,
                (SELECT b.type FROM bookings b 
                 WHERE b.room_id = r.id 
                 AND b.booking_date = ? 
                 AND b.status IN ('pending', 'confirmed')
                 LIMIT 1) as current_booking_type
            FROM rooms r
            ORDER BY r.name
        `;
        const [rows] = await dbPromise.query(query, [date]);
        return rows;
    },

    async findById(id) {
        const [rows] = await dbPromise.query(
            'SELECT * FROM rooms WHERE id = ?',
            [id]
        );
        return rows;
    },

    async create(name, space, capacity, amenities) {
        const [result] = await dbPromise.query(
            'INSERT INTO rooms (name, space, capacity, amenities, status) VALUES (?, ?, ?, ?, ?)',
            [name, space, capacity, JSON.stringify(amenities || []), 'Available']
        );
        return result;
    },

    async deleteById(id) {
        // First delete related bookings to maintain integrity
        await dbPromise.query('DELETE FROM bookings WHERE room_id = ?', [id]);
        const [result] = await dbPromise.query('DELETE FROM rooms WHERE id = ?', [id]);
        return result;
    },

    async updateById(id, name, space, capacity, amenities) {
        const [result] = await dbPromise.query(
            'UPDATE rooms SET name = ?, space = ?, capacity = ?, amenities = ? WHERE id = ?',
            [name, space, capacity, JSON.stringify(amenities || []), id]
        );
        return result;
    }
};

module.exports = RoomModel;

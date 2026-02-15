const RoomModel = require('../models/roomModel');

const roomController = {
    // GET ALL ROOMS (with dynamic status for a specific date)
    async getRooms(req, res) {
        const today = new Date().toLocaleDateString('en-CA');
        const date = req.query.date || today;

        try {
            const rooms = await RoomModel.findAll(date);

            // Parse JSON amenities and determine status
            const processedRooms = rooms.map(room => {
                let status = 'Available';
                if (room.current_booking_type) {
                    status = room.current_booking_type === 'reservation' ? 'Reserved' : 'Booked';
                }

                return {
                    ...room,
                    status: status,
                    amenities: JSON.parse(room.amenities || '[]')
                };
            });

            res.json(processedRooms);
        } catch (error) {
            console.error('Get rooms error:', error);
            res.status(500).json({ error: 'Failed to fetch rooms' });
        }
    },

    // GET SINGLE ROOM
    async getRoomById(req, res) {
        const { id } = req.params;

        try {
            const rooms = await RoomModel.findById(id);

            if (rooms.length === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }

            const room = {
                ...rooms[0],
                amenities: JSON.parse(rooms[0].amenities || '[]')
            };

            res.json(room);
        } catch (error) {
            console.error('Get room error:', error);
            res.status(500).json({ error: 'Failed to fetch room' });
        }
    },

    // ADD NEW ROOM (Admin only)
    async createRoom(req, res) {
        const { name, space, capacity, amenities } = req.body;

        try {
            const result = await RoomModel.create(name, space, capacity, amenities);

            res.status(201).json({
                id: result.insertId,
                name,
                space,
                capacity,
                amenities,
                status: 'Available'
            });
        } catch (error) {
            console.error('Add room error:', error);
            res.status(500).json({ error: 'Failed to add room' });
        }
    },

    // DELETE ROOM (Admin only)
    async deleteRoom(req, res) {
        const { id } = req.params;

        try {
            const result = await RoomModel.deleteById(id);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }

            res.json({ message: 'Room deleted successfully' });
        } catch (error) {
            console.error('Delete room error:', error);
            res.status(500).json({ error: 'Failed to delete room' });
        }
    }
};

module.exports = roomController;

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

            const newRoom = {
                id: result.insertId,
                name,
                space,
                capacity,
                amenities,
                status: 'Available',
                createdBy: req.user.email,
                createdByRole: req.user.role,
                createdAt: new Date().toISOString()
            };

            if (req.io) {
                req.io.emit('room-created', newRoom);
            }

            res.status(201).json(newRoom);
        } catch (error) {
            console.error('Add room error:', error);
            res.status(500).json({ error: 'Failed to add room' });
        }
    },

    // DELETE ROOM (Admin only)
    async deleteRoom(req, res) {
        const { id } = req.params;

        try {
            // Get room details before deleting
            const rooms = await RoomModel.findById(id);
            if (rooms.length === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }
            const deletedRoom = rooms[0];

            const result = await RoomModel.deleteById(id);

            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Room not found' });
            }

            const deletedRoomInfo = {
                id: parseInt(id),
                name: deletedRoom.name,
                deletedBy: req.user.email,
                deletedByRole: req.user.role,
                deletedAt: new Date().toISOString()
            };

            if (req.io) {
                req.io.emit('room-deleted', deletedRoomInfo);
            }

            res.json({ message: 'Room deleted successfully', deletedRoom: deletedRoomInfo });
        } catch (error) {
            console.error('Delete room error:', error);
            res.status(500).json({ error: 'Failed to delete room' });
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

            if (req.io) {
                req.io.emit('room-deleted', { id: parseInt(id) });
            }

            res.json({ message: 'Room deleted successfully' });
        } catch (error) {
            console.error('Delete room error:', error);
            res.status(500).json({ error: 'Failed to delete room' });
        }
    }
};

module.exports = roomController;

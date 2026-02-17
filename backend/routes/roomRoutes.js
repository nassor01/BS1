const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { roomValidation, idParamValidation } = require('../middleware/validation');

// Public routes - anyone can view rooms
router.get('/', roomController.getRooms);
router.get('/:id', idParamValidation, roomController.getRoomById);

// Admin only routes - room management
router.post('/', authenticate, authorizeAdmin, roomValidation, roomController.createRoom);
router.delete('/:id', authenticate, authorizeAdmin, idParamValidation, roomController.deleteRoom);

module.exports = router;

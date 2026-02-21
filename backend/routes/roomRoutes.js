const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const AuditLogger = require('../middleware/auditLogger');
const { roomValidation, idParamValidation } = require('../middleware/validation');

// Public routes - anyone can view rooms
router.get('/', roomController.getRooms);
router.get('/:id', idParamValidation, roomController.getRoomById);

// Admin only routes - room management
router.post('/', 
    authenticate, 
    authorizeAdmin, 
    roomValidation, 
    AuditLogger.middleware('ROOM_CREATED', 'room'),
    roomController.createRoom
);

router.delete('/:id', 
    authenticate, 
    authorizeAdmin, 
    idParamValidation,
    AuditLogger.middleware('ROOM_DELETED', 'room'),
    roomController.deleteRoom
);

module.exports = router;

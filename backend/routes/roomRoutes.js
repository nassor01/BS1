const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');

router.get('/', roomController.getRooms);
router.get('/:id', roomController.getRoomById);
router.post('/', roomController.createRoom);
router.delete('/:id', roomController.deleteRoom);

module.exports = router;

const express = require('express');
const router = express.Router();
const lokasiController = require('../controllers/lokasiController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All routes require authentication
router.use(authenticate);

router.get('/', lokasiController.getLokasi);
router.get('/:id', lokasiController.getLokasiById);

// Only Admin and Manager can modify lokasi
router.post('/', authorize('Administrator', 'Manager', 'Supervisor', 'Teknisi'), lokasiController.createLokasi);
router.put('/:id', authorize('Manager'), lokasiController.updateLokasi);
router.delete('/:id', authorize('Manager'), lokasiController.deleteLokasi);

module.exports = router;

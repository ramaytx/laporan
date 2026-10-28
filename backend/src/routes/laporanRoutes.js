const express = require('express');
const router = express.Router();
const laporanController = require('../controllers/laporanController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', laporanController.getLaporan);
router.post('/', laporanController.createLaporan);
router.put('/:id/status', authorize('Administrator', 'Manager'), laporanController.updateLaporanStatus);
router.patch('/:id', laporanController.updateLaporan);
router.delete('/:id', laporanController.deleteLaporan);

module.exports = router;

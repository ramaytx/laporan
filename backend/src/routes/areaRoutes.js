const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All area routes require authentication
router.use(authenticate);

router.get('/', areaController.getAreas);
router.get('/:id', areaController.getAreaById);

// Only Admin and Manager can modify areas
router.post('/', authorize('Manager'), areaController.createArea);
router.put('/:id', authorize('Manager'), areaController.updateArea);
router.delete('/:id', authorize('Manager'), areaController.deleteArea);

module.exports = router;

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(authenticate);

router.get('/', userController.getUsers);
router.post('/', authorize('Administrator'), userController.createUser);
router.put('/:id', authorize('Administrator'), userController.updateUser);
router.delete('/:id', authorize('Administrator'), userController.deleteUser);

module.exports = router;

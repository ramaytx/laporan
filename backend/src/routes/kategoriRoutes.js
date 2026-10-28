const express = require('express');
const router = express.Router();
const kategoriController = require('../controllers/kategoriController');
const { authenticate } = require('../middleware/authMiddleware');

// Require authentication
router.use(authenticate);

router.get('/', kategoriController.getKategori);

module.exports = router;

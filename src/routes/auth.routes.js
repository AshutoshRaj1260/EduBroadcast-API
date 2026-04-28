const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// Test routes to quickly populate users as there's no UI for creation
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;

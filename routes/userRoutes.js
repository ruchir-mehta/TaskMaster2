const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated } = require('../middleware/auth');
const { validateProfileUpdate } = require('../middleware/validation');

// All user routes require authentication
router.use(isAuthenticated);

router.get('/profile', userController.getProfile);
router.put('/profile', validateProfileUpdate, userController.updateProfile);

module.exports = router;


const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');

// POST route to register a new user
router.post('/register', usersController.registerUser);

// GET route to verify user registration via email
router.get('/verify/:verificationToken', usersController.verifyUser);


router.post('/forgot-password', usersController.forgotPassword);
router.post('/reset-password/:resetToken', usersController.resetPassword);

module.exports = router;

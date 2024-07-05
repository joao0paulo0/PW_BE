const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");

router.post("/register", usersController.registerUser);

router.get("/verify/:verificationToken", usersController.verifyUser);

router.post("/forgot-password", usersController.forgotPassword);

router.post("/reset-password/:resetToken", usersController.resetPassword);

router.post("/login", usersController.loginUser);

module.exports = router;

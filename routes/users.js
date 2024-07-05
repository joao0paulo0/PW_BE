const express = require("express");
const router = express.Router();
const usersController = require("../controllers/usersController");
const authMiddleware = require("../middlwares/authMiddleware");

router.post("/register", usersController.registerUser);

router.get("/verify/:verificationToken", usersController.verifyUser);

router.post("/forgot-password", usersController.forgotPassword);

router.post("/reset-password/:resetToken", usersController.resetPassword);

router.post("/login", usersController.loginUser);

router.get("/", authMiddleware, usersController.getUsers);

router.get("/:id", authMiddleware, usersController.getUserById);

router.put("/:id/block", authMiddleware, usersController.blockUser);

module.exports = router;

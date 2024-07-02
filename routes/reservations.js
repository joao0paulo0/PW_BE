// routes/reservations.js

const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");

// POST /reservations - Create a new reservation
router.post("/create", reservationController.createReservation);

// GET /reservations - Get all reservations
router.get("/", reservationController.getAllReservations);

// GET /reservations/user/:userId - Get reservations by user ID
router.get("/user/:userId", reservationController.getReservationsByUserId);

// PUT /reservations/:id - Update reservation status by ID
router.put("/:id", reservationController.updateReservationStatus);

// DELETE /reservations/:id - Delete reservation by ID
router.delete("/:id", reservationController.deleteReservation);

module.exports = router;

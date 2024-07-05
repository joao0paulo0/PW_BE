// routes/reservations.js

const express = require("express");
const router = express.Router();
const reservationController = require("../controllers/reservationController");
const authMiddleware = require("../middlwares/authMiddleware");

// POST /reservations - Create a new reservation
router.post("/create", authMiddleware, reservationController.createReservation);

// GET /reservations - Get all reservations
router.get("/", authMiddleware, reservationController.getAllReservations);

// GET /reservations/user/:userId - Get reservations by user ID
router.get(
  "/user/:userId",
  authMiddleware,
  reservationController.getReservationsByUserId
);

// PUT /reservations/:id - Update reservation status by ID
router.put(
  "/:id",
  authMiddleware,
  reservationController.updateReservationStatus
);

// DELETE /reservations/:id - Delete reservation by ID
router.delete("/:id", authMiddleware, reservationController.deleteReservation);

router.post(
  "/:reservationId/alert",
  authMiddleware,
  reservationController.alertUserReservation
);

module.exports = router;

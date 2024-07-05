const Reservation = require("../models/reservation");
const Book = require("../models/book");
const nodemailer = require("nodemailer");

exports.createReservation = async (req, res) => {
  const { userId, bookId } = req.body;

  try {
    // Check if user has reached the maximum limit of 3 reservations (including reserved books)
    const userReservationsCount = await Reservation.countDocuments({
      userId,
      status: "reserved",
    });

    if (userReservationsCount >= 3) {
      return res.status(400).json({
        message: "You have reached the maximum limit of 3 reservations.",
      });
    }

    // Check if the book is already reserved
    const existingReservation = await Reservation.findOne({
      bookId,
      userId,
      status: "reserved",
    });
    if (existingReservation) {
      return res
        .status(400)
        .json({ message: "This book is already reserved by you." });
    }

    // Fetch the book and check if it's available
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ message: "Book not found." });
    }
    if (book.availableCopies <= 0) {
      return res
        .status(400)
        .json({ message: "No available copies of this book." });
    }

    // Calculate return by date (15 days from now)
    const reservationDate = new Date();
    const returnByDate = new Date(reservationDate);
    returnByDate.setDate(returnByDate.getDate() + 15); // 15 days after reservationDate

    // Create new reservation with returnByDate
    const reservation = new Reservation({
      userId,
      bookId,
      bookTitle: book.title,
      reservationDate,
      returnByDate,
    });

    // Decrease available copies of the book
    book.availableCopies -= 1;
    await book.save();

    const newReservation = await reservation.save();

    res.status(201).json(newReservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get all reservations
// @route   GET /reservations
// @access  Public
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find();
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get reservations by user ID
// @route   GET /reservations/user/:userId
// @access  Public
exports.getReservationsByUserId = async (req, res) => {
  const { userId } = req.params;

  try {
    const reservations = await Reservation.find({ userId });
    res.json(reservations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update reservation status by ID
// @route   PUT /reservations/:id
// @access  Public
exports.updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updatedReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // If status is "returned", increase available copies of the book
    if (status === "returned") {
      const reservation = await Reservation.findById(id);
      if (reservation) {
        const book = await Book.findById(reservation.bookId);
        if (book) {
          book.availableCopies += 1;
          await book.save();
        }
      }
    }

    res.json(updatedReservation);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete reservation by ID
// @route   DELETE /reservations/:id
// @access  Public
exports.deleteReservation = async (req, res) => {
  const { id } = req.params;

  try {
    const reservation = await Reservation.findById(id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    // Increase available copies of the book
    const book = await Book.findById(reservation.bookId);
    if (book) {
      book.availableCopies += 1;
      await book.save();
    }

    const deletedReservation = await Reservation.findByIdAndDelete(id);
    if (!deletedReservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    res.json({ message: "Reservation deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.alertUserReservation = async (req, res) => {
  const { reservationId } = req.params;

  try {
    const reservation = await Reservation.findById(reservationId).populate(
      "userId"
    ); // Populate using 'userId' instead of 'user'
    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    const user = reservation.userId; // Access user from populated 'userId' field
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a transporter object with SMTP server details
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL, // Your email
        pass: process.env.PASSWORD, // Your email password
      },
    });

    // Email options
    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Return Book Reminder",
      text: `Dear ${user.email},\n\nThis is a reminder to return the book "${reservation.bookTitle}".\n\nThank you!`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.json({ message: "Alert email sent successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error sending alert email", error });
  }
};

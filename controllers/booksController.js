const Book = require("../models/book");
const Reservation = require("../models/reservation");

exports.getAllBooks = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort, search } = req.query;
    const query = {};

    // Handle search across title, author, and category
    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { category: searchRegex },
      ];
    }

    // Fetch total count of books that match the query
    const totalItems = await Book.countDocuments(query);

    // Fetch books with pagination, sorting, and search filters
    const books = await Book.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const totalBooks = await Book.find();
    // Calculate total book stock (sum of totalCopies of all books)
    const bookStock = totalBooks.reduce(
      (total, book) => total + book.totalCopies,
      0
    );

    res.json({
      books,
      totalItems,
      bookStock,
      limitBookStock: parseInt(process.env.MAX_BOOK_STOCK),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get a single book by ID
// @route   GET /books/:id
// @access  Public
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a new book
// @route   POST /books
// @access  Public
exports.createBook = async (req, res) => {
  const { title, author, category, totalCopies, availableCopies, description } =
    req.body;

  try {
    // Validate required fields
    if (
      !title ||
      !author ||
      !category ||
      !totalCopies ||
      !availableCopies ||
      !description
    ) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Validate field types and values
    if (
      typeof title === "" ||
      typeof author === "" ||
      typeof category === "" ||
      typeof description === "" ||
      totalCopies <= 0 ||
      availableCopies < 0
    ) {
      return res
        .status(400)
        .json({ message: "Invalid field types or values." });
    }

    // Check if adding this new book will exceed the maximum stock limit
    const books = await Book.find({});
    const currentTotalStock = books.reduce(
      (total, book) => total + book.totalCopies,
      0
    );

    const newTotalStock = Number(currentTotalStock) + Number(totalCopies);

    if (newTotalStock > process.env.MAX_BOOK_STOCK) {
      return res.status(400).json({
        message: `Total stock of books cannot exceed ${process.env.MAX_BOOK_STOCK} copies.`,
      });
    }

    // Create new book instance
    const book = new Book({
      title,
      author,
      category,
      totalCopies,
      availableCopies,
      description,
    });

    // Save new book
    const newBook = await book.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateBook = async (req, res) => {
  const { totalCopies, availableCopies, ...otherUpdates } = req.body;
  const { id } = req.params;

  try {
    // Fetch current book details
    const currentBook = await Book.findById(id);
    if (!currentBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    // Fetch all books excluding the current book being edited
    const allBooksExceptCurrent = await Book.find({ _id: { $ne: id } });

    // Calculate current total stock excluding the current book
    const currentTotalStockExceptCurrent = allBooksExceptCurrent.reduce(
      (total, book) => total + book.totalCopies,
      0
    );

    // Calculate new total stock including the edited book
    const newTotalStockIncludingEdit =
      parseInt(currentTotalStockExceptCurrent) + parseInt(totalCopies);

    // Check if new totalCopies exceeds MAX_BOOK_STOCK
    if (newTotalStockIncludingEdit > process.env.MAX_BOOK_STOCK) {
      return res.status(400).json({
        message: `Total stock of books cannot exceed ${process.env.MAX_BOOK_STOCK} copies.`,
      });
    }

    // Fetch reservations for the current book
    const reservations = await Reservation.find({
      bookId: id,
    }).countDocuments();
    const reservedCopies = reservations || 0;

    // Check if new totalCopies is less than reservedCopies
    if (totalCopies < reservedCopies) {
      return res.status(400).json({
        message: `Total copies cannot be less than the reserved copies (${reservedCopies}).`,
      });
    }

    // Calculate new availableCopies considering reservations
    const newAvailableCopies = totalCopies - reservedCopies;

    // Update the book
    const updatedBook = await Book.findByIdAndUpdate(
      id,
      {
        totalCopies,
        availableCopies: newAvailableCopies,
        ...otherUpdates, // Include other updates to the book
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a book by ID
// @route   DELETE /books/:id
// @access  Public
exports.deleteBook = async (req, res) => {
  try {
    // Check for reservations with status "reserved"
    const reservedReservationsCount = await Reservation.countDocuments({
      bookId: req.params.id,
      status: "reserved",
    });

    if (reservedReservationsCount > 0) {
      return res.status(400).json({
        message: "Cannot delete book with active reservations.",
      });
    }

    // Proceed to delete the book if no active reservations
    const deletedBook = await Book.findByIdAndDelete(req.params.id);

    if (!deletedBook) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get available books (books with at least one available copy)
// @route   GET /books/available
// @access  Public
exports.getAvailableBooks = async (req, res) => {
  try {
    const availableBooks = await Book.find({ availableCopies: { $gt: 0 } });
    res.json(availableBooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST route for bulk book creation
exports.createBooksInBulk = async (req, res) => {
  try {
    const books = req.body; // Array of books to create

    // Using insertMany to create multiple documents
    const createdBooks = await Book.insertMany(books);

    res.status(201).json(createdBooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Return a book (increase availableCopies by 1)
// @route   PUT /books/:id/return
// @access  Public
exports.returnBook = async (req, res) => {
  const { id } = req.params;

  try {
    const book = await Book.findById(id);
    if (!book) {
      return res.status(404).json({ message: "Book not found" });
    }

    book.availableCopies += 1;
    await book.save();

    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

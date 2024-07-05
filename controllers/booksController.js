const Book = require("../models/book");
const Reservation = require("../models/reservation");

// @desc    Get all books with pagination, sorting, and search
// @route   GET /books
// @access  Public
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

    const books = await Book.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json({ books, totalItems });
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
    const newTotalStock = currentTotalStock + totalCopies;

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

    // Fetch reservations for the current book
    const reservations = await Reservation.find({ bookId: id });
    const reservedCopies = reservations.reduce(
      (total, reservation) => total + reservation.quantity,
      0
    );

    // Calculate new availableCopies considering reservations
    const newAvailableCopies = totalCopies - reservedCopies;

    // Check if new total stock exceeds MAX_BOOK_STOCK
    if (totalCopies > process.env.MAX_BOOK_STOCK) {
      return res.status(400).json({
        message: `Total stock of books cannot exceed ${process.env.MAX_BOOK_STOCK} copies.`,
      });
    }

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
    const deletedBook = await Book.findByIdAndDelete(req.params.id);
    if (!deletedBook)
      return res.status(404).json({ message: "Book not found" });
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

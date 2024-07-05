const Book = require("../models/book");

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

    const books = await Book.find(query)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.json(books);
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
    const book = new Book({
      title,
      author,
      category,
      totalCopies,
      availableCopies,
      description,
    });

    const newBook = await book.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a book by ID
// @route   PUT /books/:id
// @access  Public
exports.updateBook = async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updatedBook)
      return res.status(404).json({ message: "Book not found" });
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

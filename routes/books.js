const express = require("express");
const router = express.Router();
const booksController = require("../controllers/booksController");
const authMiddleware = require("../middlwares/authMiddleware");

// Get all books
router.get("/", authMiddleware, booksController.getAllBooks);

// Get one book by ID
router.get("/:id", authMiddleware, booksController.getBookById);

// Create a new book
router.post("/", authMiddleware, booksController.createBook);

router.post("/bulk", booksController.createBooksInBulk);

// Update a book by ID
router.put("/:id", authMiddleware, booksController.updateBook);

// Delete a book by ID
router.delete("/:id", authMiddleware, booksController.deleteBook);

module.exports = router;

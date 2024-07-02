const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');

// Get all books
router.get('/', booksController.getAllBooks);

// Get one book by ID
router.get('/:id', booksController.getBookById);

// Create a new book
router.post('/', booksController.createBook);

// Update a book by ID
router.put('/:id', booksController.updateBook);

// Delete a book by ID
router.delete('/:id', booksController.deleteBook);

module.exports = router;

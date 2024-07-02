require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const connectDB = require("./config/db");
const app = express();
const cors = require("cors");
const port = 3000;

// Connect to MongoDB
connectDB();

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Routes
app.use("/books", require("./routes/books"));
app.use("/users", require("./routes/users"));
app.use("/reservations", require("./routes/reservations"));

// Root route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Start the server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

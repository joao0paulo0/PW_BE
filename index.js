const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3000;

const mongoURI = 'mongodb://localhost:27017/pw_library';

// Conectando ao MongoDB com Mongoose
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error MongoDB', err);
  });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

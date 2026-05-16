require('dotenv').config();
const express = require('express');
const mcqRoutes = require('./routes/mcqRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'MCQ Generator API Running',
  });
});

app.use('/api', mcqRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
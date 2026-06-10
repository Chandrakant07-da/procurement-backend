require('dotenv').config();
const express = require('express');
const path = require('path');
require('./src/config/db'); 
const routes = require('./src/routes');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.use(express.json());

// Expose the uploads folder statically so images can be viewed via URL
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// API Routes
const apiBaseUrl = process.env.BASE_URL || '/api/v1/procurement';
app.use(apiBaseUrl, routes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
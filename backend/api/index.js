const app = require('../app');
const connectDB = require('../config/db');

// Connect to the database
connectDB();

module.exports = app;

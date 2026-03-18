// server.js — Entry point
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅  RenewX API running on http://localhost:${PORT}`);
  });
});

// config/db.js — MongoDB connection via Mongoose
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState >= 1) {
            return; // Already connected
        }
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        // Do NOT use process.exit(1) in a serverless environment! It will crash the Lambda container and cause FUNCTION_INVOCATION_FAILED.
        throw error; 
    }
};

module.exports = connectDB;

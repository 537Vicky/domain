const app = require('../app');
const connectDB = require('../config/db');

// Wrap the Express app in a serverless function that awaits database connection
module.exports = async (req, res) => {
    try {
        await connectDB();
        return app(req, res);
    } catch (error) {
        // If DB fails to connect (e.g. wrong IP whitelist or bad password), this will gracefully return a 500 error instead of completely tearing down the Lambda container and giving a FUNCTION_INVOCATION_FAILED error.
        console.error("Database connection failed during request:", error);
        res.status(500).json({ error: true, message: "Database connection failed", details: error.message });
    }
};

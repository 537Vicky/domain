const app = require('../app');
const connectDB = require('../config/db');

// Wrap the Express app in a serverless function that awaits database connection
module.exports = async (req, res) => {
    try {
        await connectDB();
        return app(req, res);
    } catch (error) {
        // Force CORS headers in the crash condition so that the browser can render the actual 500 error payload instead of masking it with a CORS block.
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        console.error("Database connection failed during request:", error);
        res.status(500).json({ error: true, message: "Database connection failed", details: error.message });
    }
};

const app = require('../app');
const connectDB = require('../config/db');

// Wrap the Express app in a serverless function that awaits database connection
module.exports = async (req, res) => {
    try {
        await connectDB();
        return app(req, res);
    } catch (error) {
        // Force CORS headers on crash conditions so the browser allows rendering errors.
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        // Browsers FAIL CORS check if Preflight (OPTIONS) responds with 500 error. 
        // We must return 200 OK for OPTIONS preflights to bypass the mask.
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }

        console.error("Database connection failed during request:", error);
        res.status(500).json({ error: true, message: "Database connection failed", details: error.message });
    }
};

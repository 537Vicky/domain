// app.js — Express application: middleware, routes, error handling
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const budgetRoutes = require('./routes/budget');

const app = express();

/* ── CORS ───────────────────────────────────────────────────────
   Read allowed origins from .env so both Vite dev server and
   any production domain can be whitelisted without code changes.
───────────────────────────────────────────────────────────────── */
const allowedOrigins =
    (
        process.env.ALLOWED_ORIGINS ||
        'http://localhost:8080,http://localhost:8081,http://localhost:8082,http://localhost:5173'
    )
        .split(',')
        .map((o) => o.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow Postman / curl (no origin) + whitelisted origins
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error(`CORS blocked for origin: ${origin}`));
            }
        },
        credentials: true,
    })
);

/* ── Body Parsing ───────────────────────────────────────────── */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/* ── HTTP Request Logger (dev only) ────────────────────────── */
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

/* ── Health Check ───────────────────────────────────────────── */
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        app: 'RenewX API',
        time: new Date().toISOString(),
    });
});

/* ── API Routes ─────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/budget', budgetRoutes);

/* ── 404 for any unmatched route ────────────────────────────── */
app.use((req, res) => {
    res.status(404).json({
        error: true,
        message: `Route ${req.originalUrl} not found`,
        code: 'NOT_FOUND',
    });
});

/* ── Global Error Handler (must be last middleware) ─────────── */
app.use(errorHandler);

module.exports = app;

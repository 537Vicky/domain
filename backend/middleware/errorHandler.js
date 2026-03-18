// middleware/errorHandler.js — Global Express error handler
const errorHandler = (err, req, res, next) => {
    console.error('❌  Error:', err.message);

    // Mongoose: duplicate unique key (e.g., email already taken)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            error: true,
            message: `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`,
            code: 'CONFLICT',
        });
    }

    // Mongoose: schema validation failed
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            error: true,
            message: messages.join(', '),
            code: 'VALIDATION_ERROR',
        });
    }

    // Mongoose: bad ObjectId format
    if (err.name === 'CastError') {
        return res.status(404).json({
            error: true,
            message: 'Resource not found',
            code: 'NOT_FOUND',
        });
    }

    // JWT: invalid or malformed token
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: true,
            message: 'Invalid token',
            code: 'UNAUTHORIZED',
        });
    }

    // JWT: expired token
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: true,
            message: 'Token has expired — please log in again',
            code: 'UNAUTHORIZED',
        });
    }

    // Default fallback
    res.status(err.statusCode || 500).json({
        error: true,
        message: err.message || 'Internal Server Error',
        code: err.code || 'SERVER_ERROR',
    });
};

module.exports = errorHandler;

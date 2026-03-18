// middleware/auth.js — JWT Bearer token verification
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({
            error: true,
            message: 'Not authorized — no token provided',
            code: 'UNAUTHORIZED',
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({
                error: true,
                message: 'The user belonging to this token no longer exists',
                code: 'UNAUTHORIZED',
            });
        }

        next();
    } catch (err) {
        return res.status(401).json({
            error: true,
            message: 'Token is invalid or has expired',
            code: 'UNAUTHORIZED',
        });
    }
};

module.exports = { protect };

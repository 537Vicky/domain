// routes/auth.js — Authentication + OTP email-verification routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

/* ── Helpers ─────────────────────────────────────────────────────── */

const generateToken = (userId) =>
    jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

const sendValidationError = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: true,
            message: errors.array()[0].msg,
            code: 'VALIDATION_ERROR',
        });
        return true;
    }
    return false;
};



/* ── POST /api/auth/register ─────────────────────────────────────────
   Body: { name, email, password }
   Creates a user and returns a token immediately.
   Returns: { token, user }
────────────────────────────────────────────────────────────────────── */
router.post(
    '/register',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('password')
            .isLength({ min: 6 })
            .withMessage('Password must be at least 6 characters'),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const { name, email, password } = req.body;

            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(409).json({
                    error: true,
                    message: 'Email is already registered',
                    code: 'CONFLICT',
                });
            }

            const user = new User({ name, email, password });
            await user.save();

            const token = generateToken(user._id);
            res.status(200).json({ token, user: user.toJSON() });
        } catch (err) {
            next(err);
        }
    }
);



/* ── POST /api/auth/login ─────────────────────────────────────────────
   Body: { email, password }
   Returns: { token, user }
────────────────────────────────────────────────────────────────────── */
router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email }).select('+password');

            if (!user || !(await user.matchPassword(password))) {
                return res.status(401).json({
                    error: true,
                    message: 'Invalid email or password',
                    code: 'UNAUTHORIZED',
                });
            }

            const token = generateToken(user._id);
            res.status(200).json({ token, user: user.toJSON() });
        } catch (err) {
            next(err);
        }
    }
);

/* ── GET /api/auth/me ─────────────────────────────────────────────────
   Headers: Authorization: Bearer <token>
   Returns: user profile
────────────────────────────────────────────────────────────────────── */
router.get('/me', protect, (req, res) => {
    res.status(200).json(req.user.toJSON());
});

/* ── GET /api/auth/users ──────────────────────────────────────────────
   Headers: Authorization: Bearer <token>
   Returns: All registered users
────────────────────────────────────────────────────────────────────── */
router.get('/users', protect, async (req, res, next) => {
    try {
        const users = await User.find().select('name email');
        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
});

module.exports = router;


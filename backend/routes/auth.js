// routes/auth.js — Authentication + OTP email-verification routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendOtpEmail } = require('../utils/mailer');

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

/** Generate a 6-digit OTP, hash it, set a 3-minute expiry on the user doc. */
const attachOtp = async (user) => {
    const otp = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
    const salt = await bcrypt.genSalt(10);
    user.otpCode = await bcrypt.hash(otp, salt);
    user.otpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
    await user.save({ validateBeforeSave: false });
    return otp;
};

/* ── POST /api/auth/register ─────────────────────────────────────────
   Body: { name, email, password }
   Creates an unverified user, sends a 6-digit OTP to their email.
   Returns: { message, email }
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

            // Check if email is already verified (fully registered)
            const existing = await User.findOne({ email });
            if (existing && existing.isVerified) {
                return res.status(409).json({
                    error: true,
                    message: 'Email is already registered',
                    code: 'CONFLICT',
                });
            }

            let user;
            if (existing && !existing.isVerified) {
                // Re-send OTP for an unverified account (update name/password)
                existing.name = name;
                existing.password = password; // pre-save hook will re-hash
                user = existing;
            } else {
                // Brand-new user — create as unverified
                user = new User({ name, email, password, isVerified: false });
                await user.save();
            }

            // Generate & email OTP
            const otp = await attachOtp(user);
            await sendOtpEmail(email, otp);

            res.status(200).json({
                message: 'OTP sent to your email. Please verify within 3 minutes.',
                email,
            });
        } catch (err) {
            next(err);
        }
    }
);

/* ── POST /api/auth/verify-otp ───────────────────────────────────────
   Body: { email, otp }
   Verifies the OTP, marks user as verified, returns JWT + user.
────────────────────────────────────────────────────────────────────── */
router.post(
    '/verify-otp',
    [
        body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
        body('otp')
            .trim()
            .isLength({ min: 6, max: 6 })
            .withMessage('OTP must be 6 digits'),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const { email, otp } = req.body;

            const user = await User.findOne({ email }).select('+otpCode +otpExpires');

            if (!user) {
                return res.status(404).json({
                    error: true,
                    message: 'No account found for this email',
                    code: 'NOT_FOUND',
                });
            }

            // Check expiry
            if (!user.otpExpires || user.otpExpires < new Date()) {
                return res.status(400).json({
                    error: true,
                    message: 'OTP has expired. Please register again to get a new code.',
                    code: 'OTP_EXPIRED',
                });
            }

            // Check OTP match
            const isMatch = await bcrypt.compare(otp, user.otpCode);
            if (!isMatch) {
                return res.status(400).json({
                    error: true,
                    message: 'Invalid OTP. Please check your email and try again.',
                    code: 'OTP_INVALID',
                });
            }

            // Mark verified & clear OTP fields
            user.isVerified = true;
            user.otpCode = undefined;
            user.otpExpires = undefined;
            await user.save({ validateBeforeSave: false });

            const token = generateToken(user._id);
            res.status(200).json({ token, user: user.toJSON() });
        } catch (err) {
            next(err);
        }
    }
);

/* ── POST /api/auth/resend-otp ───────────────────────────────────────
   Body: { email }
   Resends a fresh OTP (useful if user's timer ran out on the page).
────────────────────────────────────────────────────────────────────── */
router.post(
    '/resend-otp',
    [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user || user.isVerified) {
                return res.status(400).json({
                    error: true,
                    message: user?.isVerified
                        ? 'This email is already verified.'
                        : 'No pending registration found for this email.',
                    code: 'BAD_REQUEST',
                });
            }

            const otp = await attachOtp(user);
            await sendOtpEmail(email, otp);

            res.status(200).json({ message: 'A new OTP has been sent to your email.' });
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

            // Block login for unverified accounts
            if (!user.isVerified) {
                return res.status(403).json({
                    error: true,
                    message: 'Please verify your email before logging in.',
                    code: 'EMAIL_NOT_VERIFIED',
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
        const users = await User.find({ isVerified: true }).select('name email');
        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
});

module.exports = router;


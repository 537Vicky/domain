// routes/items.js — Full CRUD + renew for BillingItems (no plan/subscriptionStatus/autoRenew)
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');

// Every item route requires a valid JWT
router.use(protect);

/* ── Allowed enum values ─────────────────────────────────── */
const VALID_TYPES = ['license', 'domain', 'subscription'];
const VALID_PERIODS = ['1-month', '3-months', '6-months', '1-year'];
const VALID_CURRENCIES = ['USD', 'INR'];

/* ── Helper ─────────────────────────────────────────────── */
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

/* ── GET /api/items ──────────────────────────────────────────
   Returns all items belonging to the authenticated user,
   sorted soonest-expiring first.
─────────────────────────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
    try {
        const items = await Item.find({
            $or: [
                { user: req.user._id },
                { assignedUsers: req.user.name }
            ]
        }).sort({ expiryDate: 1 });
        res.status(200).json(items.map((i) => {
            const json = i.toJSON();
            json.isOwner = i.user.toString() === req.user._id.toString();
            return json;
        }));
    } catch (err) {
        next(err);
    }
});

/* ── GET /api/items/expiring-soon ────────────────────────────
   Items expiring within the next 30 days.
─────────────────────────────────────────────────────────────── */
router.get('/expiring-soon', async (req, res, next) => {
    try {
        const now = new Date();
        const in30Days = new Date(now);
        in30Days.setDate(in30Days.getDate() + 30);

        const items = await Item.find({
            $or: [
                { user: req.user._id },
                { assignedUsers: req.user.name }
            ],
            expiryDate: { $lte: in30Days },
        }).sort({ expiryDate: 1 });

        res.status(200).json(items.map((i) => {
            const json = i.toJSON();
            json.isOwner = i.user.toString() === req.user._id.toString();
            return json;
        }));
    } catch (err) {
        next(err);
    }
});

/* ── POST /api/items ─────────────────────────────────────────
   Body: { name, type, renewalPeriod, expiryDate, cost? }
   Returns: created item
─────────────────────────────────────────────────────────────── */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Item name is required'),
        body('type')
            .isIn(VALID_TYPES)
            .withMessage('type must be license, domain, or subscription'),
        body('renewalPeriod')
            .isIn(VALID_PERIODS)
            .withMessage('renewalPeriod must be 1-month, 3-months, 6-months, or 1-year'),
        body('expiryDate')
            .isISO8601()
            .withMessage('expiryDate must be a valid ISO 8601 date string'),
        body('cost')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('cost must be a non-negative number'),
        body('currency')
            .optional()
            .isIn(VALID_CURRENCIES)
            .withMessage('currency must be USD or INR'),
        body('assignedUsers')
            .optional()
            .isArray()
            .withMessage('assignedUsers must be an array'),
        body('vendorDetails')
            .optional()
            .trim(),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const {
                name,
                type,
                renewalPeriod,
                expiryDate,
                cost = 0,
                currency = 'USD',
                assignedUsers = [],
                vendorDetails = '',
            } = req.body;

            const item = await Item.create({
                user: req.user._id,
                name,
                type,
                renewalPeriod,
                expiryDate: new Date(expiryDate),
                cost: parseFloat(cost),
                currency,
                assignedUsers,
                vendorDetails,
            });

            const json = item.toJSON();
            json.isOwner = true; // Newly created item is always owned by the creator
            res.status(201).json(json);
        } catch (err) {
            next(err);
        }
    }
);

/* ── PUT /api/items/:id ──────────────────────────────────────
   Editable fields: name, type, renewalPeriod, cost
─────────────────────────────────────────────────────────────── */
router.put(
    '/:id',
    [
        body('name')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Name cannot be empty'),
        body('type')
            .optional()
            .isIn(VALID_TYPES)
            .withMessage('type must be license, domain, or subscription'),
        body('renewalPeriod')
            .optional()
            .isIn(VALID_PERIODS)
            .withMessage('renewalPeriod must be 1-month, 3-months, 6-months, or 1-year'),
        body('cost')
            .optional()
            .isFloat({ min: 0 })
            .withMessage('cost must be a non-negative number'),
        body('currency')
            .optional()
            .isIn(VALID_CURRENCIES)
            .withMessage('currency must be USD or INR'),
        body('assignedUsers')
            .optional()
            .isArray()
            .withMessage('assignedUsers must be an array'),
        body('vendorDetails')
            .optional()
            .trim(),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const item = await Item.findById(req.params.id);

            if (!item) {
                return res.status(404).json({
                    error: true,
                    message: 'Item not found',
                    code: 'NOT_FOUND',
                });
            }

            // Ownership check
            if (item.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: true,
                    message: 'You do not have permission to edit this item',
                    code: 'FORBIDDEN',
                });
            }

            // Apply only the fields that were sent
            const allowedUpdates = ['name', 'type', 'renewalPeriod', 'cost', 'currency', 'assignedUsers', 'vendorDetails'];
            allowedUpdates.forEach((field) => {
                if (req.body[field] !== undefined) {
                    item[field] = req.body[field];
                }
            });

            await item.save();
            res.status(200).json(item.toJSON());
        } catch (err) {
            next(err);
        }
    }
);

/* ── DELETE /api/items/:id ───────────────────────────────────
   Permanently removes an item.
─────────────────────────────────────────────────────────────── */
router.delete('/:id', async (req, res, next) => {
    try {
        const item = await Item.findById(req.params.id);

        if (!item) {
            return res.status(404).json({
                error: true,
                message: 'Item not found',
                code: 'NOT_FOUND',
            });
        }

        if (item.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: true,
                message: 'You do not have permission to delete this item',
                code: 'FORBIDDEN',
            });
        }

        await item.deleteOne();
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (err) {
        next(err);
    }
});

/* ── POST /api/items/:id/renew ───────────────────────────────
   Body: { period: "1-month" | "3-months" | "6-months" | "1-year" }
   new expiryDate = current expiryDate + renewalDays[period]
─────────────────────────────────────────────────────────────── */
router.post(
    '/:id/renew',
    [
        body('period')
            .isIn(VALID_PERIODS)
            .withMessage('period must be 1-month, 3-months, 6-months, or 1-year'),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const item = await Item.findById(req.params.id);

            if (!item) {
                return res.status(404).json({
                    error: true,
                    message: 'Item not found',
                    code: 'NOT_FOUND',
                });
            }

            if (item.user.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    error: true,
                    message: 'You do not have permission to renew this item',
                    code: 'FORBIDDEN',
                });
            }

            const { period } = req.body;
            const daysToAdd = Item.getRenewalDays(period);

            // Extend from CURRENT expiryDate (not today)
            const newExpiry = new Date(item.expiryDate);
            newExpiry.setDate(newExpiry.getDate() + daysToAdd);

            item.expiryDate = newExpiry;
            item.renewalPeriod = period;

            await item.save();

            res.status(200).json({
                id: item._id.toString(),
                expiryDate: item.expiryDate,
                renewalPeriod: item.renewalPeriod,
                message: 'Renewal successful',
            });
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;

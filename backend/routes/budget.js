// routes/budget.js — CRUD for user's yearly budget
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Budget = require('../models/Budget');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');

// Every budget route requires a valid JWT
router.use(protect);

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

/* ── GET /api/budget ────────────────────────────────────────
   Returns the authenticated user's budget for the current year,
   along with total spending computed from their items.
─────────────────────────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
    try {
        const currentYear = new Date().getFullYear();
        const budget = await Budget.findOne({ user: req.user._id, year: currentYear });

        if (!budget) {
            return res.status(200).json({
                hasBudget: false,
                budget: null,
                spending: await computeSpending(req.user._id),
            });
        }

        const spending = await computeSpending(req.user._id);

        res.status(200).json({
            hasBudget: true,
            budget: budget.toJSON(),
            spending,
        });
    } catch (err) {
        next(err);
    }
});

/* ── POST /api/budget ───────────────────────────────────────
   Create or update the user's budget for the current year.
   Body: { yearlyBudget, currency? }
─────────────────────────────────────────────────────────────── */
router.post(
    '/',
    [
        body('yearlyBudget')
            .isFloat({ min: 0 })
            .withMessage('yearlyBudget must be a non-negative number'),
        body('currency')
            .optional()
            .isIn(['USD', 'INR'])
            .withMessage('currency must be USD or INR'),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const currentYear = new Date().getFullYear();
            const { yearlyBudget, currency = 'USD' } = req.body;

            let budget = await Budget.findOne({ user: req.user._id, year: currentYear });

            if (budget) {
                // Update existing budget
                budget.yearlyBudget = parseFloat(yearlyBudget);
                budget.currency = currency;
                await budget.save();
            } else {
                // Create new budget
                budget = await Budget.create({
                    user: req.user._id,
                    yearlyBudget: parseFloat(yearlyBudget),
                    currency,
                    year: currentYear,
                });
            }

            const spending = await computeSpending(req.user._id);

            res.status(budget ? 200 : 201).json({
                hasBudget: true,
                budget: budget.toJSON(),
                spending,
            });
        } catch (err) {
            next(err);
        }
    }
);

/* ── PUT /api/budget ────────────────────────────────────────
   Update the user's budget for the current year.
   Body: { yearlyBudget, currency? }
─────────────────────────────────────────────────────────────── */
router.put(
    '/',
    [
        body('yearlyBudget')
            .isFloat({ min: 0 })
            .withMessage('yearlyBudget must be a non-negative number'),
        body('currency')
            .optional()
            .isIn(['USD', 'INR'])
            .withMessage('currency must be USD or INR'),
    ],
    async (req, res, next) => {
        if (sendValidationError(req, res)) return;

        try {
            const currentYear = new Date().getFullYear();
            const { yearlyBudget, currency } = req.body;

            const budget = await Budget.findOne({ user: req.user._id, year: currentYear });

            if (!budget) {
                return res.status(404).json({
                    error: true,
                    message: 'No budget found for the current year. Create one first.',
                    code: 'NOT_FOUND',
                });
            }

            budget.yearlyBudget = parseFloat(yearlyBudget);
            if (currency) budget.currency = currency;
            await budget.save();

            const spending = await computeSpending(req.user._id);

            res.status(200).json({
                hasBudget: true,
                budget: budget.toJSON(),
                spending,
            });
        } catch (err) {
            next(err);
        }
    }
);

/* ── DELETE /api/budget ─────────────────────────────────────
   Delete the user's budget for the current year.
─────────────────────────────────────────────────────────────── */
router.delete('/', async (req, res, next) => {
    try {
        const currentYear = new Date().getFullYear();
        const budget = await Budget.findOneAndDelete({ user: req.user._id, year: currentYear });

        if (!budget) {
            return res.status(404).json({
                error: true,
                message: 'No budget found to delete',
                code: 'NOT_FOUND',
            });
        }

        res.status(200).json({ message: 'Budget deleted successfully' });
    } catch (err) {
        next(err);
    }
});

/* ── Helper: Compute total spending from items ──────────────
   Calculates annualized cost from all user-owned items.
   Converts all costs to USD equivalent for comparison.
─────────────────────────────────────────────────────────────── */
async function computeSpending(userId) {
    const items = await Item.find({ user: userId });

    // Multiplier to annualize different renewal periods
    const annualizeMultiplier = {
        '1-month': 12,
        '3-months': 4,
        '6-months': 2,
        '1-year': 1,
    };

    let totalUSD = 0;
    let totalINR = 0;
    const breakdown = {
        license: { usd: 0, inr: 0, count: 0 },
        domain: { usd: 0, inr: 0, count: 0 },
        subscription: { usd: 0, inr: 0, count: 0 },
    };

    items.forEach((item) => {
        const multiplier = annualizeMultiplier[item.renewalPeriod] || 1;
        const annualCost = item.cost * multiplier;

        if (item.currency === 'INR') {
            totalINR += annualCost;
            if (breakdown[item.type]) {
                breakdown[item.type].inr += annualCost;
                breakdown[item.type].count += 1;
            }
        } else {
            totalUSD += annualCost;
            if (breakdown[item.type]) {
                breakdown[item.type].usd += annualCost;
                breakdown[item.type].count += 1;
            }
        }
    });

    // Convert INR to USD at approximate rate for comparison
    const INR_TO_USD = 1 / 84;
    const totalUSDEquivalent = totalUSD + totalINR * INR_TO_USD;

    return {
        totalUSD,
        totalINR,
        totalUSDEquivalent: parseFloat(totalUSDEquivalent.toFixed(2)),
        itemCount: items.length,
        breakdown,
    };
}

module.exports = router;

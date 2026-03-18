// models/Item.js — mirrors the frontend BillingItem interface (no plan/subscriptionStatus/autoRenew)
const mongoose = require('mongoose');

const ITEM_TYPES = ['license', 'domain', 'subscription'];
const RENEWAL_PERIODS = ['1-month', '3-months', '6-months', '1-year'];

// Days added per renewal period — matches frontend renewalPeriodDays
const RENEWAL_DAYS = {
    '1-month': 30,
    '3-months': 90,
    '6-months': 180,
    '1-year': 365,
};

const itemSchema = new mongoose.Schema(
    {
        // Owner reference
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        // ── Core fields ─────────────────────────────────────────────
        name: {
            type: String,
            required: [true, 'Item name is required'],
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: { values: ITEM_TYPES, message: 'type must be license, domain, or subscription' },
        },
        renewalPeriod: {
            type: String,
            required: true,
            enum: { values: RENEWAL_PERIODS, message: 'renewalPeriod must be 1-month, 3-months, 6-months, or 1-year' },
        },
        expiryDate: {
            type: Date,
            required: [true, 'expiryDate is required'],
        },
        cost: {
            type: Number,
            default: 0,
            min: [0, 'Cost cannot be negative'],
        },
        currency: {
            type: String,
            required: true,
            enum: ['USD', 'INR'],
            default: 'USD',
        },
        assignedUsers: {
            type: [String],
            default: [],
        },
        vendorDetails: {
            type: String,
            trim: true,
        },
    },
    { timestamps: true } // createdAt + updatedAt added automatically
);

// Transform _id → id, strip __v and user from JSON responses
itemSchema.set('toJSON', {
    transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.user; // don't expose userId to client
    },
});

// Static helper — returns number of days for a given period key
itemSchema.statics.getRenewalDays = function (period) {
    return RENEWAL_DAYS[period] || 0;
};

module.exports = mongoose.model('Item', itemSchema);

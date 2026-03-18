// models/Budget.js — Stores the user's yearly budget
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true, // One budget per user
        },
        yearlyBudget: {
            type: Number,
            required: [true, 'Yearly budget amount is required'],
            min: [0, 'Budget cannot be negative'],
        },
        currency: {
            type: String,
            required: true,
            enum: ['USD', 'INR'],
            default: 'USD',
        },
        year: {
            type: Number,
            required: true,
            default: () => new Date().getFullYear(),
        },
    },
    { timestamps: true }
);

// Transform _id → id, strip __v and user from JSON responses
budgetSchema.set('toJSON', {
    transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.user;
    },
});

module.exports = mongoose.model('Budget', budgetSchema);

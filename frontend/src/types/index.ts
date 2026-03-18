// Core item types
export type ItemType = "license" | "domain" | "subscription";
export type RenewalPeriod = "1-month" | "3-months" | "6-months" | "1-year";
export type Currency = "USD" | "INR";

// The main data object — kept lean (no plan / subscriptionStatus / autoRenew)
export interface BillingItem {
  id: string;
  name: string;
  type: ItemType;
  renewalPeriod: RenewalPeriod;
  expiryDate: Date;
  createdAt: Date;
  cost: number;
  currency: Currency;
  assignedUsers?: string[];
  vendorDetails?: string;
  isOwner?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export type UrgencyLevel = "critical" | "warning" | "caution" | "safe";

// ── Renewal period helpers ────────────────────────────────────────
export const renewalPeriodLabels: Record<RenewalPeriod, string> = {
  "1-month": "Monthly",
  "3-months": "3 Months",
  "6-months": "6 Months",
  "1-year": "Yearly",
};

export const renewalPeriodDays: Record<RenewalPeriod, number> = {
  "1-month": 30,
  "3-months": 90,
  "6-months": 180,
  "1-year": 365,
};

export const currencySymbols: Record<Currency, string> = {
  USD: "$",
  INR: "₹",
};

// ── Utility functions ─────────────────────────────────────────────

/** Days between now and expiryDate (negative = already expired) */
export function getDaysUntilExpiry(expiryDate: Date): number {
  const diff = expiryDate.getTime() - new Date().getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Urgency bucket based on days remaining */
export function getUrgencyLevel(daysLeft: number): UrgencyLevel {
  if (daysLeft <= 1) return "critical";
  if (daysLeft <= 7) return "warning";
  if (daysLeft <= 30) return "caution";
  return "safe";
}

/** Human-readable expiry string shown in ItemCard badge */
export function formatExpiresIn(daysLeft: number): string {
  if (daysLeft < 0) return "Expired";
  if (daysLeft === 0) return "Expires today";
  if (daysLeft === 1) return "Expires in 1 day";
  if (daysLeft < 30) return `Expires in ${daysLeft} days`;
  const months = Math.floor(daysLeft / 30);
  if (months === 1) return "Expires in 1 month";
  return `Expires in ${months} months`;
}

/** Formatted cost string: "$12.50/monthly" */
export function formatCost(cost: number, period: RenewalPeriod, currency: Currency = "USD"): string {
  const symbol = currencySymbols[currency] || "$";
  return `${symbol}${cost.toFixed(2)}/${renewalPeriodLabels[period].toLowerCase()}`;
}

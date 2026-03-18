// mockData.ts — No longer used by the app (Dashboard fetches from real API).
// Kept as a reference/seed example only.

import { BillingItem, ItemType, RenewalPeriod } from "@/types";

// Utility: create a date offset by N days from today
export const daysFromNow = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
};

export const mockItems: BillingItem[] = [
  {
    id: "1",
    name: "Adobe Creative Cloud",
    type: "license" as ItemType,
    renewalPeriod: "1-year" as RenewalPeriod,
    expiryDate: daysFromNow(0),
    createdAt: daysFromNow(-365),
    cost: 599.99,
  },
  {
    id: "2",
    name: "mycompany.com",
    type: "domain" as ItemType,
    renewalPeriod: "1-year" as RenewalPeriod,
    expiryDate: daysFromNow(5),
    createdAt: daysFromNow(-360),
    cost: 14.99,
  },
  {
    id: "3",
    name: "GitHub Enterprise",
    type: "subscription" as ItemType,
    renewalPeriod: "1-year" as RenewalPeriod,
    expiryDate: daysFromNow(20),
    createdAt: daysFromNow(-345),
    cost: 252.0,
  },
  {
    id: "4",
    name: "Slack Pro",
    type: "subscription" as ItemType,
    renewalPeriod: "1-month" as RenewalPeriod,
    expiryDate: daysFromNow(45),
    createdAt: daysFromNow(-320),
    cost: 7.25,
  },
];

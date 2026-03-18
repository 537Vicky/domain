# RenewX — Frontend Complete Documentation
> **Purpose:** This document provides complete backend-developer-ready documentation for the **RenewX** frontend — a license & domain renewal management SaaS application. It covers all features, routing, data models, component interactions, workflow flows, and the exact API contract the backend must fulfil.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Routing / Navigation Paths](#4-routing--navigation-paths)
5. [Data Models & Types](#5-data-models--types)
6. [Pages & Features](#6-pages--features)
   - [Landing Page (`/`)](#61-landing-page-)
   - [Login Page (`/login`)](#62-login-page-login)
   - [Register Page (`/register`)](#63-register-page-register)
   - [Dashboard Page (`/dashboard`)](#64-dashboard-page-dashboard)
   - [404 Not Found](#65-404-not-found)
7. [Components](#7-components)
   - [Navbar](#71-navbar)
   - [ItemCard](#72-itemcard)
   - [AddItemModal](#73-additemmodal)
   - [RenewModal](#74-renewmodal)
   - [NavLink](#75-navlink)
8. [Business Logic & Utility Functions](#8-business-logic--utility-functions)
9. [State Management](#9-state-management)
10. [Current Mock Data](#10-current-mock-data)
11. [Required Backend API Contract](#11-required-backend-api-contract)
    - [Authentication](#111-authentication-apis)
    - [Items (Licenses / Domains / Subscriptions)](#112-items-api)
    - [Renewal](#113-renewal-api)
12. [Enums & Allowed Values](#12-enums--allowed-values)
13. [Urgency Algorithm](#13-urgency-algorithm)
14. [Error Handling Contract](#14-error-handling-contract)
15. [Authentication Flow (Expected)](#15-authentication-flow-expected)
16. [Backend Recommendations](#16-backend-recommendations)

---

## 1. Project Overview

**RenewX** is an enterprise-grade renewal management platform. It allows users to:
- Track **licenses**, **domains**, and **subscriptions** with expiry dates.
- Automatically categorize items by urgency (Critical / Warning / Caution / Safe).
- Renew items with a chosen renewal period.
- Add, edit, and delete tracked items.
- Register and sign in to manage their own collection.

The app is currently **fully frontend-only with mock data**. The backend must replace all mock data with real persistent API endpoints.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 (with Vite + TypeScript) |
| Routing | React Router DOM v6 |
| UI Library | shadcn/ui (Radix UI primitives) |
| Styling | TailwindCSS v3 |
| Forms | React Hook Form + Zod |
| Server State | TanStack Query (React Query v5) |
| Icons | Lucide React |
| Notifications | Sonner + shadcn/ui Toast |
| Charts | Recharts |
| Build Tool | Vite 7 |
| Testing | Vitest + Testing Library |

---

## 3. Project Structure

```
frontend/
├── index.html                    # App entry point
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── src/
    ├── main.tsx                  # React DOM render
    ├── App.tsx                   # Root router + providers
    ├── index.css                 # Global styles + design tokens
    ├── App.css                   # App-level styles
    │
    ├── pages/                    # Route-level page components
    │   ├── Landing.tsx           # / — Public landing page
    │   ├── Login.tsx             # /login — User login
    │   ├── Register.tsx          # /register — New user registration
    │   ├── Dashboard.tsx         # /dashboard — Authenticated main view
    │   ├── Index.tsx             # Index redirect helper
    │   └── NotFound.tsx          # * — 404 catch-all
    │
    ├── components/               # Reusable components
    │   ├── Navbar.tsx            # Top navigation bar
    │   ├── ItemCard.tsx          # Single item display card
    │   ├── AddItemModal.tsx      # Add / Edit item dialog
    │   ├── RenewModal.tsx        # Renewal period picker dialog
    │   ├── NavLink.tsx           # Active-aware nav link wrapper
    │   └── ui/                   # shadcn/ui primitive components (49 files)
    │       ├── button.tsx
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── badge.tsx
    │       ├── toast.tsx
    │       └── ... (44 more)
    │
    ├── data/
    │   └── mockData.ts           # Temporary seed data (to be replaced by API)
    │
    ├── types/
    │   └── index.ts              # All TypeScript types, enums, and utility functions
    │
    ├── hooks/
    │   ├── use-toast.ts          # Toast notification hook
    │   └── use-mobile.tsx        # Responsive mobile detection hook
    │
    └── lib/
        └── utils.ts              # Tailwind `cn()` helper utility
```

---

## 4. Routing / Navigation Paths

All routing is handled by **React Router DOM v6** with `BrowserRouter`.

| Route | Component | Auth Required | Description |
|-------|-----------|:-------------:|-------------|
| `/` | `Landing` | ❌ No | Public marketing / hero page |
| `/login` | `Login` | ❌ No | User login form |
| `/register` | `Register` | ❌ No | New user registration form |
| `/dashboard` | `Dashboard` | ✅ Yes | Main app — item management |
| `*` (catch-all) | `NotFound` | ❌ No | 404 page |

### Route Definition (from `App.tsx`)

```tsx
<BrowserRouter>
  <Routes>
    <Route path="/"          element={<><Navbar /><Landing /></>} />
    <Route path="/login"     element={<><Navbar /><Login /></>} />
    <Route path="/register"  element={<><Navbar /><Register /></>} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="*"          element={<NotFound />} />
  </Routes>
</BrowserRouter>
```

> **Note:** `/dashboard` currently has **no auth guard**. The backend integration must add a protected route wrapper that checks for a valid JWT/session before rendering the dashboard.

### Navigation Flow

```
Landing (/)
  ├── "Get Started Free" button  → /register
  ├── "Sign In" button           → /login
  └── Footer links               → /register

Login (/login)
  ├── Submit form (success)      → /dashboard
  └── "Register" link            → /register

Register (/register)
  ├── Submit form (success)      → /dashboard
  └── "Sign In" link             → /login

Dashboard (/dashboard)
  └── "Sign Out" button          → / (Landing)

NotFound (*) 
  └── "Return to Home"           → /
```

---

## 5. Data Models & Types

All types are defined in `src/types/index.ts`.

### 5.1 `BillingItem` (Core Entity)

This is the primary data object the backend must persist per user.

```typescript
interface BillingItem {
  id: string;                       // Unique identifier (UUID recommended)
  name: string;                     // Human-readable name, e.g. "Adobe Creative Suite"
  type: ItemType;                   // "license" | "domain" | "subscription"
  renewalPeriod: RenewalPeriod;     // Current billing cycle
  expiryDate: Date;                 // ISO 8601 date string from API
  createdAt: Date;                  // ISO 8601 date string from API
  plan: SubscriptionPlan;           // "free" | "basic" | "pro" | "enterprise"
  subscriptionStatus: SubscriptionStatus; // "active" | "paused" | "cancelled" | "trial"
  cost: number;                     // Price in USD (decimal)
  autoRenew: boolean;               // Whether the item auto-renews
}
```

### 5.2 Type Aliases

```typescript
type ItemType          = "license" | "domain" | "subscription";
type RenewalPeriod     = "1-month" | "3-months" | "6-months" | "1-year";
type SubscriptionPlan  = "free" | "basic" | "pro" | "enterprise";
type SubscriptionStatus = "active" | "paused" | "cancelled" | "trial";
type UrgencyLevel      = "critical" | "warning" | "caution" | "safe";
```

### 5.3 Renewal Period to Days Mapping

```typescript
const renewalPeriodDays: Record<RenewalPeriod, number> = {
  "1-month":  30,
  "3-months": 90,
  "6-months": 180,
  "1-year":   365,
};
```

### 5.4 Plan Labels

```typescript
const planLabels: Record<SubscriptionPlan, string> = {
  free:       "Free",
  basic:      "Basic",
  pro:        "Pro",
  enterprise: "Enterprise",
};
```

### 5.5 Subscription Status Labels

```typescript
const statusLabels: Record<SubscriptionStatus, string> = {
  active:    "Active",
  paused:    "Paused",
  cancelled: "Cancelled",
  trial:     "Trial",
};
```

---

## 6. Pages & Features

### 6.1 Landing Page (`/`)

**File:** `src/pages/Landing.tsx`  
**Auth Required:** No  

#### Sections
1. **Hero Section** — Main headline ("Never miss a renewal again."), CTA buttons linking to `/register` and `/login`.
2. **Features Section** — 3 feature cards: Smart Alerts, One-Click Renewal, Unified Dashboard.
3. **CTA Section** — Secondary call-to-action to get started free.
4. **Footer** — Brand mark, copyright notice.

#### Backend Requirements
- None (fully static page)
- Future: Could hit `GET /api/stats` for public stats (optional)

---

### 6.2 Login Page (`/login`)

**File:** `src/pages/Login.tsx`  
**Auth Required:** No  

#### Form Fields
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `email` | `email` input | `required`, email format | Placeholder: `you@company.com` |
| `password` | `password` input | `required` | Placeholder: `••••••••` |
| `remember` | `checkbox` | Optional | "Remember me" — affects session/token persistence |

#### Current Behavior (Mock)
- On submit: navigates directly to `/dashboard` without any API call.

#### Required Backend Behavior
- On submit: `POST /api/auth/login` with `{ email, password }`
- On success: store JWT (localStorage or httpOnly cookie), redirect to `/dashboard`
- On failure: display error toast/message (invalid credentials, account not found)

---

### 6.3 Register Page (`/register`)

**File:** `src/pages/Register.tsx`  
**Auth Required:** No  

#### Form Fields
| Field | Type | Validation | Notes |
|-------|------|-----------|-------|
| `name` | `text` input | `required` | Full name, placeholder: `John Doe` |
| `email` | `email` input | `required`, email format | Placeholder: `you@company.com` |
| `password` | `password` input | `required` | Placeholder: `••••••••` |
| `confirmPassword` | `password` input | `required`, must match `password` | Placeholder: `••••••••` |

#### Current Behavior (Mock)
- On submit: navigates directly to `/dashboard` without any API call.

#### Required Backend Behavior
- On submit: `POST /api/auth/register` with `{ name, email, password }`
- On success: auto-login user (return JWT), redirect to `/dashboard`
- On failure: show error (email already exists, weak password, etc.)

---

### 6.4 Dashboard Page (`/dashboard`)

**File:** `src/pages/Dashboard.tsx`  
**Auth Required:** Yes (guard required)  

This is the **core application page** — the most complex page with full CRUD operations.

#### Features

##### A. Display — Urgency-Based Sections
Items are **grouped and sorted** into 4 urgency sections displayed in order:

| Section Name | Urgency Level | Condition | Color |
|---|---|---|---|
| Expiring in 1 Day | `critical` | `daysLeft <= 1` | Red (`bg-urgency-critical`) |
| Expiring in 1 Week | `warning` | `daysLeft <= 7` | Amber (`bg-urgency-warning`) |
| Expiring in 1 Month | `caution` | `daysLeft <= 30` | Yellow (`bg-urgency-caution`) |
| More than 1 Month | `safe` | `daysLeft > 30` | Green (`bg-urgency-safe`) |

Within each section, items are **sorted ascending** by `expiryDate` (soonest first).

##### B. Add New Item
- Button: "Add New" (top-right of header)
- Opens `AddItemModal` dialog
- Form fields: **Name**, **Type** (license/domain/subscription), **Renewal Period**, **Cost**
- On add: item is created with:
  - `expiryDate` = today + `renewalPeriodDays[period]`
  - `plan` = `"basic"` (default)
  - `subscriptionStatus` = `"active"` (default)
  - `autoRenew` = `false` (default)
  - `createdAt` = now
  - `id` = `Date.now().toString()` (currently; backend should use UUID)

##### C. Edit Item
- "Edit" button on each ItemCard
- Re-opens `AddItemModal` pre-filled with existing data
- Editable fields: **Name**, **Type**, **Renewal Period**, **Cost**
- **Non-editable via UI:** `expiryDate`, `plan`, `subscriptionStatus`, `autoRenew`, `createdAt`

##### D. Delete Item
- "Delete" button on each ItemCard
- Immediately removes item from state with a toast notification
- No confirmation dialog (direct delete)

##### E. Renew Item
- "Renew" button on each ItemCard
- Opens `RenewModal` dialog
- User picks a renewal period: Monthly / 3 Months / 6 Months / Yearly
- On confirm: `expiryDate` = current `expiryDate` + `renewalPeriodDays[selectedPeriod]`

##### F. Empty State
- When no items exist, shows an empty state with icon and "Add New" button

#### State Variables (Dashboard-level)

```typescript
const [items, setItems]       = useState<BillingItem[]>(mockItems);
const [renewItem, setRenewItem] = useState<BillingItem | null>(null);
const [editItem, setEditItem]  = useState<BillingItem | null>(null);
const [addOpen, setAddOpen]    = useState(false);
```

---

### 6.5 404 Not Found

**File:** `src/pages/NotFound.tsx`  
**Purpose:** Catch-all for undefined routes. Logs the attempted path to console, shows 404 message, and links back to `/`.

---

## 7. Components

### 7.1 Navbar

**File:** `src/components/Navbar.tsx`

**Props:**
```typescript
interface NavbarProps {
  isAuthenticated?: boolean; // default: false
}
```

**Behavior:**
- Sticky top navigation with brand logo (Shield icon + "RenewX")
- **Public state** (`isAuthenticated=false` and not on `/dashboard`): Shows "Sign In" + "Register" buttons
- **Authenticated state** (`isAuthenticated=true` OR path is `/dashboard`): Shows "Sign Out" button (navigates to `/`)
- Mobile-responsive: hamburger menu on small screens

**Where used:**
| Page | Props passed |
|------|-------------|
| Landing `/` | `<Navbar />` (default, unauthenticated) |
| Login `/login` | `<Navbar />` (default, unauthenticated) |
| Register `/register` | `<Navbar />` (default, unauthenticated) |
| Dashboard `/dashboard` | `<Navbar isAuthenticated />` (authenticated) |

---

### 7.2 ItemCard

**File:** `src/components/ItemCard.tsx`

**Props:**
```typescript
interface ItemCardProps {
  item: BillingItem;
  onRenew: (item: BillingItem) => void;
  onEdit:  (item: BillingItem) => void;
  onDelete: (id: string) => void;
}
```

**Displays:**
- Item name and type (with icon: Globe for domain, CreditCard for subscription, KeyRound for license)
- Expiry urgency badge (color-coded: red/amber/yellow/green)
- Renewal period label
- Expiry date (localized)
- Cost (formatted as `$X.XX/period`) — only shown if `cost > 0`
- Three action buttons: **Renew**, **Edit**, **Delete**

**Icons used:**
| Item Type | Icon |
|-----------|------|
| `domain` | `Globe` |
| `subscription` | `CreditCard` |
| `license` | `KeyRound` |

---

### 7.3 AddItemModal

**File:** `src/components/AddItemModal.tsx`

**Props:**
```typescript
interface AddItemModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (item: Omit<BillingItem, "id" | "createdAt">) => void;
  editItem?: BillingItem | null;
  onUpdate?: (item: BillingItem) => void;
}
```

**Modes:**
1. **Add Mode** (when `editItem` is null/undefined) — Title: "Add New Item"
2. **Edit Mode** (when `editItem` is set) — Title: "Edit Item", form pre-filled

**Form Fields:**
| Field | Control | Options |
|-------|---------|---------|
| Name | Text input | Free text |
| Type | Select | `license`, `domain`, `subscription` |
| Renewal Period | Select | `1-month`, `3-months`, `6-months`, `1-year` |
| Cost ($) | Number input | Min: 0, Step: 0.01 |

**Add mode defaults on submit:**
```typescript
{
  name,
  type,
  renewalPeriod: period,
  expiryDate: new Date() + renewalPeriodDays[period],
  plan: "basic",
  subscriptionStatus: "active",
  autoRenew: false,
  cost: parseFloat(cost) || 0,
}
```

---

### 7.4 RenewModal

**File:** `src/components/RenewModal.tsx`

**Props:**
```typescript
interface RenewModalProps {
  item: BillingItem | null;
  open: boolean;
  onClose: () => void;
  onRenew: (id: string, period: RenewalPeriod) => void;
}
```

**Behavior:**
- Shows item name in title
- Displays 4 period options as toggle buttons: Monthly, 3 Months, 6 Months, Yearly
- Default selection: `"1-month"`
- On "Confirm Renewal": calls `onRenew(item.id, selectedPeriod)` and closes

---

### 7.5 NavLink

**File:** `src/components/NavLink.tsx`

A thin wrapper around React Router's `NavLink` that supports `activeClassName` and `pendingClassName` as separate string props (instead of a function), making it more ergonomic with Tailwind.

---

## 8. Business Logic & Utility Functions

All defined in `src/types/index.ts`:

### `getDaysUntilExpiry(expiryDate: Date): number`
```typescript
// Returns number of days between now and expiryDate (can be negative = expired)
const diff = expiryDate.getTime() - new Date().getTime();
return Math.ceil(diff / (1000 * 60 * 60 * 24));
```

### `getUrgencyLevel(daysLeft: number): UrgencyLevel`
```typescript
if (daysLeft <= 1)  return "critical";
if (daysLeft <= 7)  return "warning";
if (daysLeft <= 30) return "caution";
return "safe";
```

### `formatExpiresIn(daysLeft: number): string`
```typescript
if (daysLeft < 0)   return "Expired";
if (daysLeft === 0) return "Expires today";
if (daysLeft === 1) return "Expires in 1 day";
if (daysLeft < 30)  return `Expires in ${daysLeft} days`;
// else humanize to months
```

### `formatCost(cost: number, period: RenewalPeriod): string`
```typescript
return `$${cost.toFixed(2)}/${renewalPeriodLabels[period].toLowerCase()}`;
// e.g. "$12.50/monthly"
```

---

## 9. State Management

The app uses **local component state only** (no Redux, Zustand, or Context).

TanStack Query (`QueryClientProvider`) is set up in `App.tsx` as a provider but **not yet used** for any API calls — it is ready for backend integration.

### Current State Architecture

```
App.tsx
└── Dashboard.tsx (main state holder)
    ├── items[]         — full list of BillingItems
    ├── renewItem       — item to be renewed (null when modal closed)
    ├── editItem        — item to be edited (null when modal closed)
    ├── addOpen         — Add/Edit modal visibility
    ├── ItemCard        — receives callbacks, no own state
    ├── AddItemModal    — own form state (name, type, period, cost)
    └── RenewModal      — own selected period state
```

### After Backend Integration (Recommended Pattern)

Replace `useState(mockItems)` with TanStack Query hooks:
```typescript
const { data: items }   = useQuery({ queryKey: ['items'], queryFn: fetchItems });
const addMutation       = useMutation({ mutationFn: createItem, onSuccess: () => queryClient.invalidateQueries(['items']) });
const renewMutation     = useMutation({ mutationFn: renewItem });
const updateMutation    = useMutation({ mutationFn: updateItem });
const deleteMutation    = useMutation({ mutationFn: deleteItem });
```

---

## 10. Current Mock Data

**File:** `src/data/mockData.ts`

10 sample `BillingItem` entries used as seed data. All expiry dates are calculated **relative to today** so urgency sections are always populated.

| ID | Name | Type | Plan | Status | Cost | Days Until Expiry |
|----|------|------|------|--------|------|-------------------|
| 1 | Adobe Creative Suite | license | enterprise | active | $599.99 | +1 |
| 2 | mycompany.com | domain | pro | active | $14.99 | 0 (today) |
| 3 | Slack Pro | license | pro | active | $12.50 | +5 |
| 4 | app.mycompany.io | domain | basic | trial | $9.99 | +3 |
| 5 | Microsoft 365 | license | enterprise | active | $299.99 | +21 |
| 6 | dashboard.io | domain | basic | paused | $5.99 | +14 |
| 7 | Figma Enterprise | license | enterprise | active | $450.00 | +90 |
| 8 | GitHub Enterprise | license | pro | active | $231.00 | +120 |
| 9 | brandsite.com | domain | free | active | $0.00 | +200 |
| 10 | AWS License | license | pro | cancelled | $149.00 | +45 |

---

## 11. Required Backend API Contract

The backend **must** implement the following REST API. All endpoints (except auth) require a valid JWT Bearer token.

### Base URL
```
http://localhost:<PORT>/api
```

### Request/Response Format
- **Content-Type:** `application/json`
- **Auth Header:** `Authorization: Bearer <token>`
- **Dates:** ISO 8601 strings (`"2025-03-15T00:00:00.000Z"`)

---

### 11.1 Authentication APIs

#### `POST /api/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response `201`:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2025-02-21T00:00:00.000Z"
  }
}
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| `400` | Missing fields / invalid email format |
| `409` | Email already registered |
| `422` | Password too weak |

---

#### `POST /api/auth/login`
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Success Response `200`:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| `400` | Missing fields |
| `401` | Invalid email or password |
| `404` | User not found |

---

#### `GET /api/auth/me`
Get the current authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Success Response `200`:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2025-02-21T00:00:00.000Z"
}
```

---

### 11.2 Items API

> All item endpoints require `Authorization: Bearer <token>`. Items belong to the authenticated user.

#### `GET /api/items`
Fetch all billing items for the authenticated user.

**Success Response `200`:**
```json
[
  {
    "id": "uuid-1",
    "name": "Adobe Creative Suite",
    "type": "license",
    "renewalPeriod": "1-year",
    "expiryDate": "2025-02-22T00:00:00.000Z",
    "createdAt": "2024-02-22T00:00:00.000Z",
    "plan": "enterprise",
    "subscriptionStatus": "active",
    "cost": 599.99,
    "autoRenew": true
  }
]
```

---

#### `POST /api/items`
Create a new billing item for the authenticated user.

**Request Body:**
```json
{
  "name": "My Domain",
  "type": "domain",
  "renewalPeriod": "1-year",
  "expiryDate": "2026-02-21T00:00:00.000Z",
  "plan": "basic",
  "subscriptionStatus": "active",
  "cost": 14.99,
  "autoRenew": false
}
```

**Success Response `201`:**
```json
{
  "id": "uuid-new",
  "name": "My Domain",
  "type": "domain",
  "renewalPeriod": "1-year",
  "expiryDate": "2026-02-21T00:00:00.000Z",
  "createdAt": "2025-02-21T00:00:00.000Z",
  "plan": "basic",
  "subscriptionStatus": "active",
  "cost": 14.99,
  "autoRenew": false
}
```

---

#### `PUT /api/items/:id`
Update an existing item. Only updatable fields (`name`, `type`, `renewalPeriod`, `cost`) are required; all fields can be sent.

**Request Body (partial update acceptable):**
```json
{
  "name": "Updated Name",
  "type": "subscription",
  "renewalPeriod": "3-months",
  "cost": 25.00
}
```

**Success Response `200`:**
```json
{
  "id": "uuid-1",
  "name": "Updated Name",
  "type": "subscription",
  "renewalPeriod": "3-months",
  "expiryDate": "2025-05-21T00:00:00.000Z",
  "createdAt": "2024-02-22T00:00:00.000Z",
  "plan": "enterprise",
  "subscriptionStatus": "active",
  "cost": 25.00,
  "autoRenew": true
}
```

**Error Responses:**
| Status | Reason |
|--------|--------|
| `403` | Item belongs to another user |
| `404` | Item not found |

---

#### `DELETE /api/items/:id`
Remove an item permanently.

**Success Response `200`:**
```json
{ "message": "Item deleted successfully" }
```

---

### 11.3 Renewal API

#### `POST /api/items/:id/renew`
Extend the expiry date of an item by a given renewal period.

**Request Body:**
```json
{
  "period": "1-year"
}
```

**Backend Logic:**
```
new expiryDate = current expiryDate + renewalPeriodDays[period]
```

Where:
```
"1-month"  → +30 days
"3-months" → +90 days
"6-months" → +180 days
"1-year"   → +365 days
```

**Success Response `200`:**
```json
{
  "id": "uuid-1",
  "expiryDate": "2026-02-21T00:00:00.000Z",
  "renewalPeriod": "1-year",
  "message": "Renewal successful"
}
```

---

## 12. Enums & Allowed Values

The backend must validate these exact string values:

### `ItemType`
```
"license" | "domain" | "subscription"
```

### `RenewalPeriod`
```
"1-month" | "3-months" | "6-months" | "1-year"
```

### `SubscriptionPlan`
```
"free" | "basic" | "pro" | "enterprise"
```

### `SubscriptionStatus`
```
"active" | "paused" | "cancelled" | "trial"
```

---

## 13. Urgency Algorithm

The frontend categorizes every item into an urgency bucket **on the client side** based on `daysLeft = ceil((expiryDate - now) / 86400000)`:

```
daysLeft <= 1   → "critical"   (Expiring in 1 Day)
daysLeft <= 7   → "warning"    (Expiring in 1 Week)
daysLeft <= 30  → "caution"    (Expiring in 1 Month)
daysLeft > 30   → "safe"       (More than 1 Month)
```

**The backend does NOT need to calculate or store urgency level.** The frontend computes it from `expiryDate` at runtime.

However, the backend **SHOULD**:
- Send email/push notifications for items hitting urgency thresholds (critical/warning)
- Optionally expose a `GET /api/items/expiring-soon` convenience endpoint

---

## 14. Error Handling Contract

All API errors should return a consistent JSON structure:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE_SLUG"
}
```

### Common Error Codes

| HTTP Status | `code` | Meaning |
|-------------|--------|---------|
| `400` | `VALIDATION_ERROR` | Missing or malformed fields |
| `401` | `UNAUTHORIZED` | No token or invalid token |
| `403` | `FORBIDDEN` | Token valid but no access to resource |
| `404` | `NOT_FOUND` | Resource does not exist |
| `409` | `CONFLICT` | Duplicate (e.g., email already exists) |
| `422` | `UNPROCESSABLE` | Business rule violation |
| `500` | `SERVER_ERROR` | Unexpected server error |

---

## 15. Authentication Flow (Expected)

```
1. User submits Register/Login form
2. Frontend: POST /api/auth/register OR /api/auth/login
3. Backend returns { token, user }
4. Frontend stores token in localStorage (key: "renewx_token")
5. Frontend redirects to /dashboard
6. All subsequent API calls: Authorization: Bearer <token> header
7. TanStack Query fetches GET /api/items on dashboard mount
8. Dashboard renders items grouped by urgency
9. User actions (add/renew/edit/delete) → corresponding API calls
10. TanStack Query invalidates cache → UI re-fetches automatically
11. "Sign Out": clears token from localStorage → redirect to /
```

---

## 16. Backend Recommendations

Based on the frontend's structure, here is the recommended backend architecture:

### Technology Stack (Suggested)
| Layer | Recommendation |
|-------|----------------|
| Runtime | Node.js |
| Framework | Express.js or Fastify |
| Language | TypeScript (to match frontend types) |
| Database | PostgreSQL (with Prisma ORM) |
| Auth | JWT (jsonwebtoken) + bcrypt for passwords |
| Validation | Zod (same library as frontend) |
| Email Alerts | Nodemailer or SendGrid (for renewal reminders) |

### Database Schema (Conceptual)

```sql
-- Users table
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,  -- bcrypt hash
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Items table
CREATE TABLE billing_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  type                VARCHAR(20) NOT NULL CHECK (type IN ('license', 'domain', 'subscription')),
  renewal_period      VARCHAR(20) NOT NULL CHECK (renewal_period IN ('1-month', '3-months', '6-months', '1-year')),
  expiry_date         TIMESTAMPTZ NOT NULL,
  plan                VARCHAR(20) NOT NULL DEFAULT 'basic' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'paused', 'cancelled', 'trial')),
  cost                DECIMAL(10, 2) NOT NULL DEFAULT 0,
  auto_renew          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### CORS Configuration
The frontend dev server runs on `http://localhost:8080` (or similar Vite default). Backend must allow:
```javascript
cors({
  origin: ['http://localhost:8080', 'http://localhost:3000', 'http://localhost:5173'],
  credentials: true
})
```

### Notification System (Future)
A background job (cron) should:
1. Run daily — query all items where `expiry_date <= NOW() + INTERVAL '7 days'`
2. Send email alerts to item owners
3. Alert levels mirror the frontend urgency algorithm

---

## Summary: What the Backend Must Provide

| Priority | Feature | Endpoint(s) |
|----------|---------|-------------|
| 🔴 Critical | User Registration | `POST /api/auth/register` |
| 🔴 Critical | User Login | `POST /api/auth/login` |
| 🔴 Critical | JWT Auth Middleware | All protected routes |
| 🔴 Critical | List Items | `GET /api/items` |
| 🔴 Critical | Create Item | `POST /api/items` |
| 🔴 Critical | Update Item | `PUT /api/items/:id` |
| 🔴 Critical | Delete Item | `DELETE /api/items/:id` |
| 🔴 Critical | Renew Item | `POST /api/items/:id/renew` |
| 🟡 Important | Current User Profile | `GET /api/auth/me` |
| 🟢 Optional | Expiring Soon Feed | `GET /api/items/expiring-soon` |
| 🟢 Optional | Email Notifications | Background cron job |
| 🟢 Optional | Auto-Renew Processing | Cron + `autoRenew` flag |

---

*Frontend documentation generated: 2026-02-21 | Frontend version: v0.0.0 (pre-release) | App name: RenewX*

---
---

# PART 2 — Backend Implementation Guide
## Express.js + MongoDB (Mongoose)

> This section is a **complete, copy-paste-ready backend implementation** for RenewX based on the frontend contract above.

---

## Table of Contents (Backend)

- [B1. Backend Folder Structure](#b1-backend-folder-structure)
- [B2. Setup & Installation](#b2-setup--installation)
- [B3. Environment Variables (.env)](#b3-environment-variables-env)
- [B4. Entry Point — server.js](#b4-entry-point--serverjs)
- [B5. Database Connection — config/db.js](#b5-database-connection--configdbjs)
- [B6. MongoDB Models](#b6-mongodb-models)
  - [User Model](#b61-user-model--modelsuserjsjs)
  - [Item Model](#b62-item-model--modelsitemjs)
- [B7. Middleware](#b7-middleware)
  - [Auth Middleware](#b71-auth-middleware--middlewareauthjs)
  - [Error Handler](#b72-error-handler--middlewareerrorhandlerjs)
- [B8. Route Handlers](#b8-route-handlers)
  - [Auth Routes](#b81-auth-routes--routesauthjs)
  - [Item Routes](#b82-item-routes--routesitemsjs)
- [B9. App Entry Point — app.js](#b9-app-entry-point--appjs)
- [B10. Running the Server](#b10-running-the-server)
- [B11. API Quick Reference](#b11-api-quick-reference)
- [B12. Frontend Integration Checklist](#b12-frontend-integration-checklist)

---

## B1. Backend Folder Structure

```
backend/
├── package.json
├── .env                        # Environment variables (never commit)
├── .gitignore
├── server.js                   # Entry point — starts HTTP server
├── app.js                      # Express app setup (routes, middleware)
│
├── config/
│   └── db.js                   # MongoDB connection via Mongoose
│
├── models/
│   ├── User.js                 # Mongoose User schema
│   └── Item.js                 # Mongoose BillingItem schema
│
├── middleware/
│   ├── auth.js                 # JWT verification middleware
│   └── errorHandler.js         # Global error handler
│
└── routes/
    ├── auth.js                 # POST /api/auth/register, /login, GET /me
    └── items.js                # GET/POST /api/items, PUT/DELETE/:id, POST /:id/renew
```

---

## B2. Setup & Installation

```bash
# 1. Go into the backend folder
cd backend

# 2. Install dependencies
npm install

# 3. Create your .env file (see B3 below)

# 4. Make sure MongoDB is running locally
#    Windows:  net start MongoDB
#    macOS:    brew services start mongodb-community

# 5. Start the dev server
npm run dev

# Server will run at: http://localhost:5000
```

**Dependencies installed:**
| Package | Purpose |
|---------|---------|
| `express` | HTTP web framework |
| `mongoose` | MongoDB ODM |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT sign & verify |
| `cors` | Cross-Origin Resource Sharing |
| `dotenv` | Load `.env` variables |
| `morgan` | Request logger |
| `express-validator` | Input validation |
| `nodemon` *(dev)* | Auto-restart on file changes |

---

## B3. Environment Variables (.env)

Create a file named `.env` in the `backend/` folder:

```env
# Server
PORT=5000

# MongoDB — local
MONGODB_URI=mongodb://localhost:27017/renewx

# MongoDB Atlas (cloud) — uncomment to use
# MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/renewx

# JWT
JWT_SECRET=renewx_super_secret_key_change_in_production
JWT_EXPIRES_IN=7d

# CORS — comma-separated frontend origins
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:5173,http://localhost:3000
```

---

## B4. Entry Point — `server.js`

```js
// server.js
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ RenewX API running on http://localhost:${PORT}`);
  });
});
```

---

## B5. Database Connection — `config/db.js`

```js
// config/db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
```

---

## B6. MongoDB Models

### B6.1 User Model — `models/User.js`

Maps to the frontend's register/login form and `GET /api/auth/me` response.

```js
// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare plain password with hashed
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Transform _id → id in JSON output (matches frontend expectation)
userSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
  },
});

module.exports = mongoose.model('User', userSchema);
```

---

### B6.2 Item Model — `models/Item.js`

Exactly mirrors the frontend `BillingItem` interface.

```js
// models/Item.js
const mongoose = require('mongoose');

const ITEM_TYPES        = ['license', 'domain', 'subscription'];
const RENEWAL_PERIODS   = ['1-month', '3-months', '6-months', '1-year'];
const PLANS             = ['free', 'basic', 'pro', 'enterprise'];
const STATUSES          = ['active', 'paused', 'cancelled', 'trial'];

// Days to add per renewal period — mirrors frontend renewalPeriodDays
const RENEWAL_DAYS = {
  '1-month':  30,
  '3-months': 90,
  '6-months': 180,
  '1-year':   365,
};

const itemSchema = new mongoose.Schema(
  {
    // Which user owns this item
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Frontend fields
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: { values: ITEM_TYPES, message: 'Invalid item type' },
    },
    renewalPeriod: {
      type: String,
      required: true,
      enum: { values: RENEWAL_PERIODS, message: 'Invalid renewal period' },
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required'],
    },
    plan: {
      type: String,
      enum: { values: PLANS, message: 'Invalid plan' },
      default: 'basic',
    },
    subscriptionStatus: {
      type: String,
      enum: { values: STATUSES, message: 'Invalid subscription status' },
      default: 'active',
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // adds createdAt, updatedAt automatically
);

// Transform _id → id in JSON output
itemSchema.set('toJSON', {
  transform(doc, ret) {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.user; // hide userId from response
  },
});

// Static helper: add days to a date (mirrors frontend renewalPeriodDays)
itemSchema.statics.getRenewalDays = function (period) {
  return RENEWAL_DAYS[period] || 0;
};

module.exports = mongoose.model('Item', itemSchema);
```

---

## B7. Middleware

### B7.1 Auth Middleware — `middleware/auth.js`

Reads the `Authorization: Bearer <token>` header, verifies the JWT, and attaches `req.user` to the request.

```js
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check Authorization header
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
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: 'User belonging to this token no longer exists',
        code: 'UNAUTHORIZED',
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      message: 'Token is invalid or expired',
      code: 'UNAUTHORIZED',
    });
  }
};

module.exports = { protect };
```

---

### B7.2 Error Handler — `middleware/errorHandler.js`

Global Express error handler — always returns consistent JSON error shape.

```js
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  // Mongoose duplicate key (e.g., email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      error: true,
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} already in use`,
      code: 'CONFLICT',
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      error: true,
      message: messages.join(', '),
      code: 'VALIDATION_ERROR',
    });
  }

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    return res.status(404).json({
      error: true,
      message: 'Resource not found',
      code: 'NOT_FOUND',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      message: 'Invalid token',
      code: 'UNAUTHORIZED',
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR',
  });
};

module.exports = errorHandler;
```

---

## B8. Route Handlers

### B8.1 Auth Routes — `routes/auth.js`

Implements: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`

```js
// routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ── Helper: generate JWT ────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ── Helper: send validation errors ─────────────────────────────────
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: errors.array()[0].msg,
      code: 'VALIDATION_ERROR',
    });
  }
  return null;
};

// ──────────────────────────────────────────────────────────────────
// POST /api/auth/register
// Body: { name, email, password }
// ──────────────────────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { name, email, password } = req.body;

      // Check if email already taken
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({
          error: true,
          message: 'Email already registered',
          code: 'CONFLICT',
        });
      }

      // Create user (password is hashed by pre-save hook)
      const user = await User.create({ name, email, password });
      const token = generateToken(user._id);

      res.status(201).json({
        token,
        user: user.toJSON(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ──────────────────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const { email, password } = req.body;

      // Find user and include password field (normally excluded)
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({
          error: true,
          message: 'Invalid email or password',
          code: 'UNAUTHORIZED',
        });
      }

      // Verify password
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({
          error: true,
          message: 'Invalid email or password',
          code: 'UNAUTHORIZED',
        });
      }

      const token = generateToken(user._id);

      res.status(200).json({
        token,
        user: user.toJSON(),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// Headers: Authorization: Bearer <token>
// ──────────────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  // req.user is set by the protect middleware
  res.status(200).json(req.user.toJSON());
});

module.exports = router;
```

---

### B8.2 Item Routes — `routes/items.js`

Implements all CRUD + renew endpoints for `BillingItem`.

```js
// routes/items.js
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');

// All item routes require authentication
router.use(protect);

// Allowed enum values (mirror frontend types)
const VALID_TYPES    = ['license', 'domain', 'subscription'];
const VALID_PERIODS  = ['1-month', '3-months', '6-months', '1-year'];
const VALID_PLANS    = ['free', 'basic', 'pro', 'enterprise'];
const VALID_STATUSES = ['active', 'paused', 'cancelled', 'trial'];

// ── Helper: handle express-validator errors ─────────────────────
const handleValidation = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: true,
      message: errors.array()[0].msg,
      code: 'VALIDATION_ERROR',
    });
  }
  return null;
};

// ──────────────────────────────────────────────────────────────────
// GET /api/items
// Returns all items belonging to the logged-in user
// ──────────────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const items = await Item.find({ user: req.user._id }).sort({ expiryDate: 1 });
    res.status(200).json(items.map((i) => i.toJSON()));
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────
// GET /api/items/expiring-soon
// Returns items expiring within the next 30 days for alerts
// ──────────────────────────────────────────────────────────────────
router.get('/expiring-soon', async (req, res, next) => {
  try {
    const now = new Date();
    const in30Days = new Date(now);
    in30Days.setDate(in30Days.getDate() + 30);

    const items = await Item.find({
      user: req.user._id,
      expiryDate: { $lte: in30Days },
    }).sort({ expiryDate: 1 });

    res.status(200).json(items.map((i) => i.toJSON()));
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────
// POST /api/items
// Body: { name, type, renewalPeriod, expiryDate, plan,
//         subscriptionStatus, cost, autoRenew }
// ──────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('type').isIn(VALID_TYPES).withMessage('Invalid item type'),
    body('renewalPeriod').isIn(VALID_PERIODS).withMessage('Invalid renewal period'),
    body('expiryDate').isISO8601().withMessage('expiryDate must be a valid ISO date'),
    body('plan').optional().isIn(VALID_PLANS).withMessage('Invalid plan'),
    body('subscriptionStatus').optional().isIn(VALID_STATUSES).withMessage('Invalid status'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a non-negative number'),
    body('autoRenew').optional().isBoolean().withMessage('autoRenew must be a boolean'),
  ],
  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const {
        name,
        type,
        renewalPeriod,
        expiryDate,
        plan = 'basic',
        subscriptionStatus = 'active',
        cost = 0,
        autoRenew = false,
      } = req.body;

      const item = await Item.create({
        user: req.user._id,
        name,
        type,
        renewalPeriod,
        expiryDate: new Date(expiryDate),
        plan,
        subscriptionStatus,
        cost: parseFloat(cost),
        autoRenew: Boolean(autoRenew),
      });

      res.status(201).json(item.toJSON());
    } catch (err) {
      next(err);
    }
  }
);

// ──────────────────────────────────────────────────────────────────
// PUT /api/items/:id
// Editable fields (from AddItemModal): name, type, renewalPeriod, cost
// ──────────────────────────────────────────────────────────────────
router.put(
  '/:id',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('type').optional().isIn(VALID_TYPES).withMessage('Invalid item type'),
    body('renewalPeriod').optional().isIn(VALID_PERIODS).withMessage('Invalid renewal period'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
    body('plan').optional().isIn(VALID_PLANS).withMessage('Invalid plan'),
    body('subscriptionStatus').optional().isIn(VALID_STATUSES).withMessage('Invalid status'),
    body('autoRenew').optional().isBoolean().withMessage('autoRenew must be a boolean'),
  ],
  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

    try {
      const item = await Item.findById(req.params.id);

      if (!item) {
        return res.status(404).json({
          error: true,
          message: 'Item not found',
          code: 'NOT_FOUND',
        });
      }

      // Ensure item belongs to the requesting user
      if (item.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: true,
          message: 'You do not have permission to edit this item',
          code: 'FORBIDDEN',
        });
      }

      // Apply updates — only the fields sent by the frontend
      const allowedUpdates = ['name', 'type', 'renewalPeriod', 'cost', 'plan', 'subscriptionStatus', 'autoRenew'];
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

// ──────────────────────────────────────────────────────────────────
// DELETE /api/items/:id
// ──────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────
// POST /api/items/:id/renew
// Body: { period: "1-month" | "3-months" | "6-months" | "1-year" }
// Logic: new expiryDate = current expiryDate + renewalDays[period]
// ──────────────────────────────────────────────────────────────────
router.post(
  '/:id/renew',
  [
    body('period')
      .isIn(VALID_PERIODS)
      .withMessage('period must be one of: 1-month, 3-months, 6-months, 1-year'),
  ],
  async (req, res, next) => {
    const validationError = handleValidation(req, res);
    if (validationError) return;

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

      // Extend from the CURRENT expiryDate (not from today)
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
```

---

## B9. App Entry Point — `app.js`

Wires together all middleware, routes, and error handlers.

```js
// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');

const app = express();

// ── CORS ──────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, curl, etc.)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// ── Body Parsing ──────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Request Logging (dev only) ────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Health Check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', app: 'RenewX API', time: new Date().toISOString() });
});

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);

// ── 404 for unknown API routes ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `Route ${req.originalUrl} not found`,
    code: 'NOT_FOUND',
  });
});

// ── Global Error Handler (must be last) ──────────────────────────
app.use(errorHandler);

module.exports = app;
```

---

## B10. Running the Server

```bash
# Development (auto-restart with nodemon)
npm run dev

# Production
npm start
```

**Expected console output:**
```
✅ MongoDB connected: localhost
✅ RenewX API running on http://localhost:5000
```

### Test the health check:
```bash
curl http://localhost:5000/api/health
# → { "status": "OK", "app": "RenewX API", "time": "..." }
```

### Test registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"test1234"}'
```

### Test login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"test1234"}'
```

### Test get items (replace TOKEN):
```bash
curl http://localhost:5000/api/items \
  -H "Authorization: Bearer TOKEN_HERE"
```

---

## B11. API Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login, get JWT |
| `GET` | `/api/auth/me` | ✅ | Current user profile |
| `GET` | `/api/health` | ❌ | Server health check |
| `GET` | `/api/items` | ✅ | List all user's items |
| `GET` | `/api/items/expiring-soon` | ✅ | Items expiring within 30 days |
| `POST` | `/api/items` | ✅ | Create a new item |
| `PUT` | `/api/items/:id` | ✅ | Update item fields |
| `DELETE` | `/api/items/:id` | ✅ | Delete an item |
| `POST` | `/api/items/:id/renew` | ✅ | Extend item's expiry date |

---

## B12. Frontend Integration Checklist

After the backend is running, these changes are needed in the **frontend**:

### 1. Create an API utility file `src/lib/api.ts`
```typescript
const BASE_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('renewx_token');

export const api = {
  get: (path: string) =>
    fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((r) => r.json()),

  post: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  put: (path: string, body: unknown) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(body),
    }).then((r) => r.json()),

  delete: (path: string) =>
    fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    }).then((r) => r.json()),
};
```

### 2. Update `Login.tsx` — replace mock navigation
```typescript
// Replace handleSubmit with:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const res = await api.post('/auth/login', { email, password });
  if (res.token) {
    localStorage.setItem('renewx_token', res.token);
    navigate('/dashboard');
  } else {
    // show error toast with res.message
  }
};
```

### 3. Update `Register.tsx` — replace mock navigation
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const res = await api.post('/auth/register', { name, email, password });
  if (res.token) {
    localStorage.setItem('renewx_token', res.token);
    navigate('/dashboard');
  } else {
    // show error toast with res.message
  }
};
```

### 4. Update `Dashboard.tsx` — replace mock data with API calls
```typescript
// Remove:  import { mockItems } from "@/data/mockData";
// Replace: useState(mockItems) → useState<BillingItem[]>([])

// Add useEffect to fetch items on mount:
useEffect(() => {
  api.get('/items').then((data) => {
    const parsed = data.map((item: any) => ({
      ...item,
      expiryDate: new Date(item.expiryDate),
      createdAt:  new Date(item.createdAt),
    }));
    setItems(parsed);
  });
}, []);
```

### 5. Update action handlers in `Dashboard.tsx`
```typescript
const handleAdd = async (data: Omit<BillingItem, 'id' | 'createdAt'>) => {
  const res = await api.post('/items', {
    ...data,
    expiryDate: data.expiryDate.toISOString(),
  });
  setItems((prev) => [{ ...res, expiryDate: new Date(res.expiryDate), createdAt: new Date(res.createdAt) }, ...prev]);
};

const handleUpdate = async (updated: BillingItem) => {
  await api.put(`/items/${updated.id}`, { name: updated.name, type: updated.type, renewalPeriod: updated.renewalPeriod, cost: updated.cost });
  setItems((prev) => prev.map((item) => item.id === updated.id ? updated : item));
};

const handleDelete = async (id: string) => {
  await api.delete(`/items/${id}`);
  setItems((prev) => prev.filter((item) => item.id !== id));
};

const handleRenew = async (id: string, period: RenewalPeriod) => {
  const res = await api.post(`/items/${id}/renew`, { period });
  setItems((prev) => prev.map((item) => item.id === id ? { ...item, expiryDate: new Date(res.expiryDate), renewalPeriod: res.renewalPeriod } : item));
};
```

### 6. Add Sign Out logic in `Navbar.tsx`
```typescript
const handleSignOut = () => {
  localStorage.removeItem('renewx_token');
  navigate('/');
};
// Replace the <Link to="/"> wrapper on Sign Out with onClick={handleSignOut}
```

---

*Backend documentation added: 2026-02-21 | Stack: Express.js + MongoDB (Mongoose) + JWT | App: RenewX*

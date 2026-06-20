# Hackathon Project — Full Team Plan

> Read this fully before writing a single line of code.
> This document covers what we are building, why, how it works, who builds what, and how all three parts connect.

---

## Table of Contents

1. [What We Are Building](#1-what-we-are-building)
2. [The Problem We Are Solving](#2-the-problem-we-are-solving)
3. [How It Works — The Three Sides](#3-how-it-works--the-three-sides)
4. [The Innovative Feature — Life Moments](#4-the-innovative-feature--life-moments)
5. [Tech Stack](#5-tech-stack)
6. [Project Structure](#6-project-structure)
7. [How All Three Parts Connect](#7-how-all-three-parts-connect)
8. [Authentication Flow](#8-authentication-flow)
9. [Database Models](#9-database-models)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Work Breakdown — Who Builds What](#11-work-breakdown--who-builds-what)
12. [Person 1 — Django Backend](#12-person-1--django-backend)
13. [Person 2 — Next.js Web](#13-person-2--nextjs-web)
14. [Person 3 — Expo Mobile](#14-person-3--expo-mobile)
15. [Environment Variables Setup](#15-environment-variables-setup)
16. [GitHub Workflow](#16-github-workflow)
17. [Shared Database Setup](#17-shared-database-setup)
18. [Deployment](#18-deployment)
19. [Hackathon Timeline — 3 Days](#19-hackathon-timeline--3-days)
20. [Demo Flow](#20-demo-flow)

---

## 1. What We Are Building

A three-sided welfare marketplace that connects **employees**, **employers**, and **service providers** in a single platform.

It replaces the outdated, one-size-fits-all benefits package with a personalized credit-based system where employees choose the perks that actually matter to their lives — and employers fund it with full visibility and control.

It is not just a benefits tool. It is company culture, made tangible.

**Three types of users:**

| User Type | Who They Are | What They Do |
|---|---|---|
| Employee | Workers at a company | Browse and redeem perks using credits |
| Employer / HR | HR managers at companies | Fund employee wallets, approve perks, view analytics |
| Provider | Gyms, airlines, restaurants, course platforms etc. | List their services on the marketplace |

---

## 2. The Problem We Are Solving

Most companies offer the same benefits to everyone — a gym discount nobody uses, a health insurance plan nobody understands, a meal voucher that expired last month. Employees feel like a number. HR has no idea if the benefits budget is making people happy or driving retention. Providers have no direct channel to reach employees who genuinely want their services.

This platform fixes all three sides at once.

---

## 3. How It Works — The Three Sides

### For Employees
Every month, employees receive a credit balance funded by their employer. They open the mobile app and browse a catalog of real services across categories:

- Wellness (gyms, therapy, meditation)
- Food (meal delivery, restaurant vouchers)
- Travel (airlines, hotels, travel agencies)
- Learning (online courses, certifications)
- Connectivity (mobile plans, home internet)
- Lifestyle (streaming, childcare, pet care)

They pick what fits their life, redeem instantly via QR code or voucher, and watch their wallet update in real time.

If they want something not in the catalog, they submit a request. Their employer reviews and approves or rejects it with one tap. No forms, no HR emails, no waiting.

They also get personalized suggestions based on their past choices — if they pick a gym and a meditation app, the platform suggests nutrition coaching and sleep tracking next.

### For Employers
HR managers set a monthly credit budget per employee or per team. They choose whether credits roll over or expire to drive engagement. They can pre-bundle perks into packages and assign them in one click:

- "Remote Worker Pack"
- "New Hire Pack"
- "Performance Reward Pack"

They get a live dashboard showing spend by category, utilization rate per employee, and which perks are most popular. This turns a cost center into a strategic retention tool.

### For Providers
Gyms, airlines, travel agencies, meal delivery services, course platforms, and mobile carriers list their services and set their own credit pricing. They get access to a motivated, employer-funded audience that is actively looking to spend. They see redemption analytics and grow without traditional marketing costs.

A verification badge system ensures quality. Employees trust what they see. Providers compete on value, not just visibility.

---

## 4. The Innovative Feature — Life Moments

This is where the platform becomes something no other benefits tool has attempted.

When an employee marks a personal life event — the birth of a child, a medical procedure, a relocation, a bereavement, a burnout leave — the platform responds with two automatic actions.

**Action 1 — Automatic Care Package**
Based on the event type, the system curates a bundle of relevant perks:
- New baby → meal delivery, childcare platform, sleep tracking app
- Medical leave → therapy sessions, meal delivery, wellness app
- Relocation → moving services, new city restaurant vouchers
- Burnout leave → therapy, meditation, meal delivery

HR receives a one-click notification to approve a one-time credit boost. The company shows up before the employee even has to ask.

**Action 2 — Anonymous Team Contribution**
Colleagues can silently donate credits from their own wallets to the person going through a life event. No group chat coordination, no awkward collections, no pressure.

The employee simply receives a notification:
> *"Your team sent you a care package"*

No names attached. Just the feeling that the people around them noticed.

It transforms a financial tool into an act of care. It gives employers the single most powerful retention signal they can offer: *we see you as a human being, not a headcount.*

---

## 5. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend API | Python + Django + Django REST Framework | Built-in admin, auth, ORM — saves huge amounts of setup time |
| Web Frontend | Next.js (React) | Employer dashboard and provider portal are data-heavy, web is the right home |
| Mobile App | Expo (React Native) | Employee experience is mobile-first, Expo runs on iOS and Android, demo via QR code without App Store |
| Database | PostgreSQL via Supabase | Free, cloud-hosted, shared by the whole team in real time |
| Auth | JWT tokens (djangorestframework-simplejwt) | Works identically for both Next.js and Expo |
| Deployment | Railway (Django), Vercel (Next.js), Expo Go (mobile demo) | All free, all fast |

---

## 6. Project Structure

```
hackathon/
│
├── backend/                  ← Person 1 owns this
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── users/
│   ├── companies/
│   ├── wallet/
│   ├── catalog/
│   ├── approvals/
│   ├── life_moments/
│   └── analytics/
│
├── web/                      ← Person 2 owns this
│   ├── package.json
│   ├── .env.local
│   ├── app/
│   │   ├── (auth)/
│   │   ├── employer/
│   │   └── provider/
│   ├── components/
│   └── lib/
│       └── api.js            ← All API calls live here
│
├── mobile/                   ← Person 3 owns this
│   ├── package.json
│   ├── .env
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (tabs)/
│   │   ├── perk/
│   │   ├── redeem/
│   │   ├── life-moments/
│   │   └── request/
│   ├── components/
│   └── lib/
│       └── api.js            ← All API calls live here
│
└── PLAN.md                   ← This file
```

---

## 7. How All Three Parts Connect

This is the most important thing to understand.

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│                                                         │
│     Next.js (Web)               Expo (Mobile)           │
│     Employer Dashboard          Employee App            │
│     Provider Portal             Wallet + Catalog        │
│                                 Life Moments            │
└──────────────────────┬──────────────────────────────────┘
                       │
              HTTP requests with
              JWT token in header
                       │
┌──────────────────────▼──────────────────────────────────┐
│                   DJANGO BACKEND                        │
│                                                         │
│        REST API endpoints (JSON responses)              │
│        Business logic, credit engine                    │
│        Life Moments engine                              │
│        Django Admin panel                               │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│                  POSTGRESQL DATABASE                    │
│                   (hosted on Supabase)                  │
└─────────────────────────────────────────────────────────┘
```

**The simple rule:**
- Django stores all data and contains all logic
- Next.js and Expo NEVER talk to the database directly
- Next.js and Expo ONLY talk to Django through HTTP requests
- Django returns JSON, both frontends render that JSON as UI

**Every screen in Next.js and Expo follows this pattern:**
```
1. User does something (opens a screen, clicks a button)
2. Frontend sends an HTTP request to Django
3. Django processes it and returns JSON
4. Frontend displays the data
```

---

## 8. Authentication Flow

Both Next.js and Expo use the exact same login system.

```
Step 1: User submits email + password to POST /api/auth/login/

Step 2: Django validates and returns:
{
  "access": "eyJhbGc...",    ← short-lived token (1 hour)
  "refresh": "eyJhbGc...",   ← long-lived token (7 days)
  "user": {
    "id": 1,
    "email": "maria@company.com",
    "role": "employee",
    "full_name": "Maria Silva"
  }
}

Step 3: Frontend stores the tokens
  Next.js  → stores in cookies
  Expo     → stores in expo-secure-store

Step 4: Every request after login includes the access token:
  GET /api/wallet/
  Authorization: Bearer eyJhbGc...

Step 5: When access token expires, use refresh token:
  POST /api/auth/token/refresh/
  { "refresh": "eyJhbGc..." }
  → Django returns a new access token
```

Django reads the token and automatically knows who the user is and what role they have. No need to send user ID in requests — Django figures it out from the token.

---

## 9. Database Models

These are the data structures Person 1 builds. Person 2 and 3 do not touch the database — they only see data through API responses.

### Users & Auth
```
User
├── id
├── email (unique)
├── password (hashed)
├── role → "employee" | "employer" | "provider"
├── full_name
├── avatar (image)
├── company → links to Company
├── is_verified (bool)
└── created_at

ProviderProfile (extra info for provider users)
├── user → links to User
├── company_name
├── description
├── logo
├── website
└── is_verified (gets a badge)
```

### Companies & Teams
```
Company
├── id
├── name
├── logo
├── industry
├── monthly_budget_per_employee (in credits)
├── credits_rollover → true/false
└── created_at

Team
├── id
├── company → links to Company
├── name
└── manager → links to User

TeamMembership
├── employee → links to User
└── team → links to Team
```

### Wallet & Credits
```
Wallet (one per employee, auto-created on registration)
├── id
├── employee → links to User
├── balance (decimal, current credits)
└── updated_at

Transaction (every credit movement is recorded)
├── id
├── wallet → links to Wallet
├── amount (positive = credit in, negative = credit out)
├── type → "credit" | "debit" | "donation" | "refund"
├── description
└── created_at

CreditAllocation (employer loads credits each month)
├── id
├── company → links to Company
├── employee → links to User
├── amount
├── month (e.g. "2026-06")
├── expires_at
└── created_at
```

### Catalog & Perks
```
Category
├── id
├── name → "Wellness" | "Food" | "Travel" | "Learning" | "Connectivity" | "Lifestyle"
├── icon
└── description

Perk (listed by providers)
├── id
├── provider → links to User (must be provider role)
├── category → links to Category
├── name
├── description
├── credit_price
├── images
├── is_active (bool)
├── is_featured (bool)
├── tags (array, used for suggestions e.g. ["fitness", "health"])
└── created_at

Redemption (when employee redeems a perk)
├── id
├── employee → links to User
├── perk → links to Perk
├── qr_code (base64 image, shown to employee)
├── status → "pending" | "redeemed" | "expired"
└── created_at
```

### Approvals
```
PerkRequest (employee requests something not in catalog)
├── id
├── employee → links to User
├── perk_name
├── perk_description
├── estimated_credits
├── reason
├── status → "pending" | "approved" | "rejected"
├── reviewed_by → links to User (the HR manager)
├── reviewed_at
└── created_at

PerkBundle (employer pre-packages perks)
├── id
├── company → links to Company
├── name (e.g. "Remote Worker Pack")
└── perks → many perks linked

BundleAssignment
├── bundle → links to PerkBundle
├── assigned_to → links to User or Team
└── assigned_at
```

### Life Moments
```
LifeEvent
├── id
├── employee → links to User
├── event_type → "new_baby" | "medical" | "relocation" | "bereavement" | "burnout"
├── note (optional, private message from employee)
├── is_active
└── created_at

CarePackage (auto-suggested when life event is marked)
├── id
├── life_event → links to LifeEvent
├── perks → suggested perks linked
├── status → "pending_approval" | "approved" | "delivered"
├── credit_boost (extra credits HR approves)
├── approved_by → links to User (HR manager)
└── created_at

CreditDonation (colleague donates credits anonymously)
├── id
├── from_wallet → links to Wallet (donor)
├── to_wallet → links to Wallet (recipient)
├── life_event → links to LifeEvent
├── amount
└── is_anonymous (always true, names never shown)
```

---

## 10. API Endpoints Reference

This is the contract between Person 1 (Django) and Person 2+3 (frontends).

> **Base URL:** Set in `.env` as `API_URL`
> **All protected routes require:** `Authorization: Bearer <token>` header

### Auth Endpoints
```
POST   /api/auth/register/            Register new user
POST   /api/auth/login/               Login, returns tokens
POST   /api/auth/logout/              Logout
POST   /api/auth/token/refresh/       Get new access token using refresh token
GET    /api/auth/me/                  Get current logged-in user info
```

### Wallet Endpoints
```
GET    /api/wallet/                   Get my current balance
GET    /api/wallet/transactions/      Get my transaction history
POST   /api/wallet/donate/            Donate credits to a life event
```

### Catalog Endpoints
```
GET    /api/catalog/categories/       Get all categories
GET    /api/catalog/perks/            Get all perks (supports ?category=wellness&max_price=200)
GET    /api/catalog/perks/:id/        Get single perk detail
GET    /api/catalog/perks/featured/   Get featured perks (for home screen)
GET    /api/catalog/perks/suggestions/ Get personalized perk suggestions for me
POST   /api/catalog/redeem/:id/       Redeem a perk → returns QR code image
GET    /api/catalog/redemptions/      Get my redemption history
```

### Approval Endpoints
```
GET    /api/approvals/requests/       List requests
                                      → Employee sees only their own
                                      → Employer sees all from their company
POST   /api/approvals/requests/       Employee submits a custom perk request
PATCH  /api/approvals/requests/:id/   Employer approves or rejects
GET    /api/approvals/bundles/        List perk bundles for the company
POST   /api/approvals/bundles/        Employer creates a new bundle
POST   /api/approvals/bundles/:id/assign/  Assign bundle to employee or team
```

### Company Endpoints
```
GET    /api/companies/employees/      List all employees with wallet balances
POST   /api/companies/allocate/       Allocate monthly credits to employees
PATCH  /api/companies/settings/       Update budget and rollover settings
GET    /api/companies/teams/          List all teams
POST   /api/companies/teams/          Create a new team
```

### Life Moments Endpoints
```
POST   /api/life-moments/             Employee marks a life event
GET    /api/life-moments/             Employee sees their own life events
GET    /api/life-moments/pending/     Employer sees events needing care package approval
POST   /api/life-moments/:id/approve/ Employer approves care package + sets credit boost
GET    /api/life-moments/:id/donate/  Get info about donating to this event
POST   /api/life-moments/:id/donate/  Anonymously donate credits to this event
```

### Analytics Endpoints (Employer only)
```
GET    /api/analytics/spend/          Spend breakdown by category
GET    /api/analytics/utilization/    Credit utilization per employee
GET    /api/analytics/top-perks/      Most redeemed perks this month
GET    /api/analytics/provider-stats/ Provider's own redemption stats
```

### Example API Responses

**GET /api/wallet/**
```json
{
  "balance": 400,
  "currency": "credits",
  "expires_at": "2026-06-30",
  "monthly_allocation": 400
}
```

**GET /api/catalog/perks/**
```json
{
  "count": 24,
  "results": [
    {
      "id": 1,
      "name": "Monthly Gym Membership",
      "provider": "Lift Gym",
      "category": "Wellness",
      "credit_price": 150,
      "description": "Full access to all facilities",
      "tags": ["fitness", "health"],
      "is_featured": true,
      "images": ["https://..."]
    }
  ]
}
```

**POST /api/catalog/redeem/1/**
```json
{
  "redemption_id": 42,
  "perk_name": "Monthly Gym Membership",
  "qr_code": "data:image/png;base64,iVBORw0KGgo...",
  "status": "pending",
  "created_at": "2026-06-17T10:30:00Z"
}
```

**POST /api/life-moments/**
```json
Request body:
{
  "event_type": "new_baby",
  "note": "Baby girl born June 15th"
}

Response:
{
  "id": 5,
  "event_type": "new_baby",
  "care_package": {
    "id": 3,
    "status": "pending_approval",
    "suggested_perks": [
      { "id": 8, "name": "Weekly Meal Kit", "credit_price": 120 },
      { "id": 12, "name": "Childcare App Premium", "credit_price": 80 },
      { "id": 19, "name": "Sleep Tracking App", "credit_price": 50 }
    ]
  },
  "message": "HR has been notified and will review your care package shortly."
}
```

---

## 11. Work Breakdown — Who Builds What

```
Person 1 (Django Backend)
└── The entire server, database, and API
    Nobody else touches this folder

Person 2 (Next.js Web)
└── Employer dashboard + Provider portal
    Only communicates with the backend through HTTP requests
    Never touches the database

Person 3 (Expo Mobile)
└── Employee mobile app
    Only communicates with the backend through HTTP requests
    Never touches the database
```

### Dependency Order
```
Person 1 builds endpoints FIRST
    │
    ├──► Person 2 can start building UI against those endpoints
    │
    └──► Person 3 can start building UI against those endpoints
```

Person 1 should always be half a day ahead of the frontend team.

---

## 12. Person 1 — Django Backend

### Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers psycopg2-binary Pillow django-filter python-dotenv

django-admin startproject config .
python manage.py startapp users
python manage.py startapp companies
python manage.py startapp wallet
python manage.py startapp catalog
python manage.py startapp approvals
python manage.py startapp life_moments
python manage.py startapp analytics
```

### Task List
- [ ] Custom User model with role field (do this FIRST before any migrations)
- [ ] JWT auth endpoints (register, login, logout, refresh, me)
- [ ] Company + Team models and endpoints
- [ ] Wallet model (auto-create on employee registration using signals)
- [ ] Credit allocation endpoint
- [ ] Category seeding (hardcode 6 categories in a migration)
- [ ] Perk CRUD endpoints (provider manages their own)
- [ ] Perk list with filtering
- [ ] Redemption endpoint with QR code generation
- [ ] Personalized suggestions (match employee's past perk tags)
- [ ] PerkRequest submit + approval endpoints
- [ ] PerkBundle create + assign endpoints
- [ ] LifeEvent create endpoint + auto care package suggestion
- [ ] Employer care package approval + credit boost
- [ ] Anonymous credit donation endpoint
- [ ] Analytics endpoints (spend, utilization, top perks)
- [ ] Django Admin configured for all models
- [ ] CORS configured (allow localhost:3000 and deployed Vercel URL)
- [ ] Seed script with demo data (companies, employees, perks, providers)
- [ ] Deploy to Railway on Day 1
- [ ] Share Postman collection with team showing all endpoints

### Key Settings
```python
# config/settings.py

INSTALLED_APPS = [
    'corsheaders',
    'rest_framework',
    'rest_framework_simplejwt',
    'users',
    'companies',
    'wallet',
    'catalog',
    'approvals',
    'life_moments',
    'analytics',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # must be first
    'django.middleware.common.CommonMiddleware',
    ...
]

AUTH_USER_MODEL = 'users.User'  # custom user model

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'https://your-vercel-app.vercel.app',
]
```

---

## 13. Person 2 — Next.js Web

### Setup
```bash
cd web
npx create-next-app@latest . --typescript --tailwind --app
npm install axios js-cookie recharts
```

### How to Call the API

Create one file that handles all API communication. Never write raw fetch calls in your components.

```javascript
// web/lib/api.js

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function request(method, path, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// Auth
export const login = (email, password) =>
  request('POST', '/api/auth/login/', { email, password })

export const getMe = (token) =>
  request('GET', '/api/auth/me/', null, token)

// Employer
export const getEmployees = (token) =>
  request('GET', '/api/companies/employees/', null, token)

export const allocateCredits = (token, data) =>
  request('POST', '/api/companies/allocate/', data, token)

export const getPerkRequests = (token) =>
  request('GET', '/api/approvals/requests/', null, token)

export const approveRequest = (token, id, status) =>
  request('PATCH', `/api/approvals/requests/${id}/`, { status }, token)

export const getPendingLifeEvents = (token) =>
  request('GET', '/api/life-moments/pending/', null, token)

export const approveCarePackage = (token, id, creditBoost) =>
  request('POST', `/api/life-moments/${id}/approve/`, { credit_boost: creditBoost }, token)

export const getAnalytics = (token) =>
  request('GET', '/api/analytics/spend/', null, token)

// Provider
export const getMyPerks = (token) =>
  request('GET', '/api/catalog/perks/?mine=true', null, token)

export const createPerk = (token, data) =>
  request('POST', '/api/catalog/perks/', data, token)

export const getProviderStats = (token) =>
  request('GET', '/api/analytics/provider-stats/', null, token)
```

### Pages to Build

```
app/
│
├── (auth)/
│   ├── login/page.tsx
│   │   └── Form with email + password
│   │       On submit → call login() → store tokens in cookies → redirect
│   │
│   └── register/page.tsx
│       └── Form with name, email, password, role selector (employer/provider)
│
├── employer/
│   │
│   ├── dashboard/page.tsx
│   │   ├── Total credits distributed this month
│   │   ├── Average utilization rate (%)
│   │   ├── Number of employees
│   │   ├── Spend by category (bar chart using recharts)
│   │   └── Recent activity feed
│   │
│   ├── employees/page.tsx
│   │   ├── Table: Name | Team | Balance | Last Redemption | Status
│   │   ├── "Allocate Credits" button → opens modal
│   │   └── Click employee → see their perk history
│   │
│   ├── approvals/page.tsx
│   │   ├── List of pending perk requests
│   │   ├── Each row: Employee name | Perk requested | Cost | Reason
│   │   └── Approve / Reject buttons on each row
│   │
│   ├── bundles/page.tsx
│   │   ├── List of existing bundles
│   │   ├── Create new bundle form
│   │   └── Assign bundle to team dropdown
│   │
│   ├── life-moments/page.tsx
│   │   ├── List of employees who marked a life event
│   │   ├── Each card: Employee name | Event type | Suggested care package
│   │   ├── Credit boost input field
│   │   └── "Approve Care Package" button
│   │
│   └── settings/page.tsx
│       ├── Monthly budget per employee input
│       └── Credits rollover toggle (on/off)
│
└── provider/
    │
    ├── dashboard/page.tsx
    │   ├── Total redemptions this month
    │   ├── Credits earned
    │   └── Redemptions over time chart
    │
    ├── listings/page.tsx
    │   ├── My listed perks (grid)
    │   ├── Active / inactive toggle per perk
    │   └── Edit / Delete buttons
    │
    ├── listings/new/page.tsx
    │   └── Form: name, category dropdown, credit price,
    │         description, tags, image upload
    │
    └── analytics/page.tsx
        ├── Per-perk redemption count
        ├── Demographics (if available)
        └── Peak usage times
```

### Component Hints

```javascript
// How to show a chart (recharts)
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

const data = [
  { category: 'Wellness', amount: 1200 },
  { category: 'Food', amount: 800 },
  { category: 'Travel', amount: 400 },
]

<BarChart width={500} height={300} data={data}>
  <XAxis dataKey="category" />
  <YAxis />
  <Tooltip />
  <Bar dataKey="amount" fill="#6366f1" />
</BarChart>


// How to protect pages (redirect if not logged in)
// web/lib/auth.js
export function getTokenFromCookies() {
  if (typeof window === 'undefined') return null
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('access='))
    ?.split('=')[1]
}
```

### Task List
- [ ] Project setup + Tailwind
- [ ] Auth pages (login, register)
- [ ] Token storage in cookies + protected routes
- [ ] api.js file with all API call functions
- [ ] Employer dashboard with charts
- [ ] Employee list page
- [ ] Perk request approvals queue
- [ ] Perk bundles management
- [ ] Life Moments employer approval page
- [ ] Company settings page
- [ ] Provider dashboard
- [ ] Provider perk listings management
- [ ] Add new perk form
- [ ] Provider analytics page
- [ ] QR scanner page (provider scans employee's QR on redemption)

---

## 14. Person 3 — Expo Mobile

### Setup
```bash
cd mobile
npx create-expo-app . --template
npx expo install expo-secure-store expo-router expo-camera
npm install axios
```

### How to Call the API

Same pattern as Next.js but use SecureStore for tokens.

```javascript
// mobile/lib/api.js

import * as SecureStore from 'expo-secure-store'

const API_URL = process.env.EXPO_PUBLIC_API_URL

async function request(method, path, body = null) {
  const token = await SecureStore.getItemAsync('access_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// Auth
export const login = async (email, password) => {
  const data = await request('POST', '/api/auth/login/', { email, password })
  await SecureStore.setItemAsync('access_token', data.access)
  await SecureStore.setItemAsync('refresh_token', data.refresh)
  return data
}

export const logout = async () => {
  await SecureStore.deleteItemAsync('access_token')
  await SecureStore.deleteItemAsync('refresh_token')
}

// Wallet
export const getWallet = () => request('GET', '/api/wallet/')
export const getTransactions = () => request('GET', '/api/wallet/transactions/')

// Catalog
export const getCategories = () => request('GET', '/api/catalog/categories/')
export const getPerks = (categoryId) =>
  request('GET', `/api/catalog/perks/?category=${categoryId}`)
export const getPerkById = (id) => request('GET', `/api/catalog/perks/${id}/`)
export const getSuggestions = () => request('GET', '/api/catalog/perks/suggestions/')
export const redeemPerk = (id) => request('POST', `/api/catalog/redeem/${id}/`)

// Life Moments
export const markLifeEvent = (eventType, note) =>
  request('POST', '/api/life-moments/', { event_type: eventType, note })
export const getMyLifeEvents = () => request('GET', '/api/life-moments/')
export const donateCredits = (eventId, amount) =>
  request('POST', `/api/life-moments/${eventId}/donate/`, { amount })

// Requests
export const submitPerkRequest = (data) =>
  request('POST', '/api/approvals/requests/', data)
export const getMyRequests = () => request('GET', '/api/approvals/requests/')
```

### Screens to Build

```
app/
│
├── (auth)/
│   ├── login.tsx
│   │   └── Email + password form
│   │       On submit → call login() → navigate to /tabs/home
│   │
│   └── register.tsx
│       └── Name, email, password form (employees only)
│
├── (tabs)/
│   │
│   ├── home.tsx
│   │   ├── "Good morning, Maria" greeting
│   │   ├── Wallet balance card (big, 400 credits)
│   │   ├── "Expires in X days" warning if applicable
│   │   ├── Featured perks horizontal scroll
│   │   └── Category quick-access buttons
│   │
│   ├── catalog.tsx
│   │   ├── Category grid (icons + names)
│   │   ├── Tap category → see perks list
│   │   └── Search bar
│   │
│   ├── wallet.tsx
│   │   ├── Current balance (large number)
│   │   ├── Monthly allocation info
│   │   └── Transaction history list
│   │       Each row: description | amount | date
│   │
│   └── profile.tsx
│       ├── Name + avatar
│       ├── Edit profile button
│       ├── "My Life Events" link
│       ├── Notification settings
│       └── Logout button
│
├── perk/
│   └── [id].tsx
│       ├── Full perk images (swipeable)
│       ├── Provider name + badge
│       ├── Description
│       ├── Credit price (large)
│       ├── Tags
│       └── "Redeem for X credits" button
│           → shows confirmation modal
│           → on confirm: call redeemPerk() → navigate to /redeem/[id]
│
├── redeem/
│   └── [id].tsx
│       ├── Big QR code (generated by Django, just display it)
│       ├── "Show this to the provider"
│       ├── Perk name + details
│       └── Save to photos button
│
├── life-moments/
│   │
│   ├── index.tsx
│   │   ├── My life events list
│   │   └── "+" button to add new
│   │
│   ├── new.tsx
│   │   ├── Event type picker:
│   │   │   🍼 New Baby
│   │   │   🏥 Medical Leave
│   │   │   📦 Relocation
│   │   │   🌹 Bereavement
│   │   │   😮‍💨 Burnout Leave
│   │   ├── Optional private note
│   │   └── Submit button
│   │
│   ├── care-package.tsx
│   │   ├── Warm, emotional design
│   │   ├── "Your team sent you a care package"
│   │   ├── List of perks in the package
│   │   └── Redeem buttons for each perk
│   │
│   └── donate.tsx
│       ├── Colleague's event info (no name shown)
│       ├── Credit amount slider
│       └── "Send anonymously" button
│
└── request/
    └── new.tsx
        ├── Perk name input
        ├── Description textarea
        ├── Estimated credits input
        ├── Reason input
        └── Submit button
```

### Task List
- [ ] Expo project setup + expo-router navigation
- [ ] Auth screens (login, register)
- [ ] SecureStore token management
- [ ] api.js with all API call functions
- [ ] Home screen with balance card + featured perks
- [ ] Category grid screen
- [ ] Perk list per category
- [ ] Perk detail screen
- [ ] Redeem flow + QR code display screen
- [ ] Wallet screen with transaction history
- [ ] Life Moments — mark event screen
- [ ] Life Moments — care package received screen
- [ ] Life Moments — donate credits screen
- [ ] Perk request form
- [ ] Profile screen
- [ ] Push notifications setup

### Running the App on a Real Phone
```bash
cd mobile
npx expo start
# QR code appears in terminal
# Download "Expo Go" on your phone
# Scan the QR code
# App runs live on your phone
```

---

## 15. Environment Variables Setup

### backend/.env
```bash
SECRET_KEY=generate-a-random-string-here
DEBUG=True
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
ALLOWED_HOSTS=localhost,127.0.0.1,your-railway-url.railway.app
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-vercel-app.vercel.app
```

### web/.env.local
```bash
NEXT_PUBLIC_API_URL=https://your-django.railway.app
# During local dev before deployment:
# NEXT_PUBLIC_API_URL=https://abc123.ngrok.io
```

### mobile/.env
```bash
EXPO_PUBLIC_API_URL=https://your-django.railway.app
# During local dev before deployment:
# EXPO_PUBLIC_API_URL=https://abc123.ngrok.io
```

> **Important:** Never commit `.env` files to GitHub. Add them to `.gitignore`.

---

## 16. GitHub Workflow

### Initial Setup (Person 1 does this)
```bash
git init
git remote add origin https://github.com/[team]/hackathon.git
git push -u origin main
```

### Each Person Creates Their Branch
```bash
# Person 1
git checkout -b backend

# Person 2
git checkout -b web

# Person 3
git checkout -b mobile
```

### Daily Workflow
```bash
# Before starting work
git pull origin main

# While working (commit often)
git add .
git commit -m "add wallet balance endpoint"
git push origin backend   # push to your own branch

# When a feature is complete and tested, merge to main
git checkout main
git merge backend
git push origin main
```

### Rules
- Never commit directly to `main`
- Never push broken code
- Commit small and often (every 30-60 minutes)
- Write clear commit messages: "add life moments endpoint" not "update stuff"
- When you finish an endpoint/screen, tell the team immediately

---

## 17. Shared Database Setup

Everyone connects to the same database so data is shared.

```
1. Go to supabase.com
2. Create a free account
3. New project → pick a name and password
4. Go to Settings → Database → Connection String
5. Copy the URI string
6. Everyone puts it in their backend/.env as DATABASE_URL
```

Only Person 1 runs Django migrations. Person 2 and 3 never touch the database.

```bash
# Person 1 runs this when models change
python manage.py makemigrations
python manage.py migrate

# Run seed data script to populate demo data
python manage.py seed_data
```

---

## 18. Deployment

### Django → Railway (Person 1, Day 1)
```
1. Go to railway.app
2. New project → Deploy from GitHub repo
3. Point to /backend folder
4. Add environment variables (same as .env)
5. Add Procfile in backend/:
   web: gunicorn config.wsgi:application
6. Deploy → get URL like https://your-app.railway.app
7. Share this URL with Person 2 and Person 3
```

### Next.js → Vercel (Person 2, Day 2)
```
1. Go to vercel.com
2. Import GitHub repo
3. Set root directory to /web
4. Add NEXT_PUBLIC_API_URL environment variable
5. Deploy → get URL like https://your-app.vercel.app
```

### Expo → Expo Go (Person 3, for demo)
```
No deployment needed for hackathon.
Run: npx expo start
Show the QR code to judges.
They scan it with Expo Go on their phone.
```

---

## 19. Hackathon Timeline — 3 Days

### Day 1 — Foundation (everyone is unblocked)

| Person 1 (Django) | Person 2 (Next.js) | Person 3 (Expo) |
|---|---|---|
| Project setup + PostgreSQL connection | Project setup + Tailwind config | Expo setup + navigation structure |
| Custom User model + migrations | Auth pages (login/register UI) | Auth screens (login/register UI) |
| Auth endpoints (register, login, JWT) | Connect auth to Django API | Connect auth to Django API |
| Company + Wallet models + endpoints | Employer dashboard shell | Home screen + wallet balance display |
| **Deploy to Railway** | Set API_URL to Railway URL | Set API_URL to Railway URL |
| Share Postman collection | — | — |

**End of Day 1 goal:** Everyone can log in. Wallet balance shows on mobile. Employer dashboard shell works.

---

### Day 2 — Core Features

| Person 1 (Django) | Person 2 (Next.js) | Person 3 (Expo) |
|---|---|---|
| Catalog + Categories + Perks endpoints | Employee list page | Catalog browsing by category |
| Redemption endpoint + QR generation | Perk request approvals queue | Perk detail screen |
| Approval flow endpoints | Perk bundles management | Redeem flow + QR code screen |
| Life Moments endpoints | Life Moments employer approval | Life Moments mark event screen |
| Personalized suggestions | Provider portal shell | Perk request form |

**End of Day 2 goal:** Full employee flow works on mobile (browse, redeem, get QR). Employer can approve requests. Life Moments can be marked and approved.

---

### Day 3 — Polish + Demo Prep

| Person 1 (Django) | Person 2 (Next.js) | Person 3 (Expo) |
|---|---|---|
| Analytics endpoints | Analytics charts (recharts) | Care package received screen |
| Seed script (realistic demo data) | Provider listings management | Anonymous donate screen |
| Fix bugs reported by team | Final UI polish | Push notifications |
| Django Admin cleanup | Provider analytics page | Final UI polish |
| — | Demo rehearsal | Demo rehearsal |

**End of Day 3 goal:** Full demo flow works. Judges can follow along. No crashes.

---

## 20. Demo Flow

Run this exact sequence when presenting to judges. Practice it at least twice.

### Act 1 — The Employer (Person 2 on laptop)
```
1. HR Manager logs into the web app
2. Dashboard shows team overview and credit stats
3. Creates a "Remote Worker Pack" bundle
4. Assigns it to the engineering team
5. Allocates 400 credits to all employees for the month
```

### Act 2 — The Employee (Person 3 on phone)
```
1. Employee opens app on phone (shown on screen via Expo Go)
2. Home screen shows 400 credits loaded
3. Browses catalog → picks Wellness → selects gym membership
4. Redeems → QR code appears on screen
5. Marks "New Baby" as a life event
```

### Act 3 — Life Moments (back to Person 2 on laptop)
```
1. HR Manager gets notification: employee marked "New Baby"
2. Sees suggested care package: meal delivery + childcare app + sleep tracker
3. Sets 300-credit boost and approves with one click
```

### Act 4 — The Care Package Lands (back to Person 3 on phone)
```
1. Push notification arrives on phone
2. Opens app: "Your team sent you a care package"
3. Care package screen shows all perks ready to redeem
4. (Show a colleague quietly donated 50 credits anonymously)
```

### Act 5 — The Provider (Person 2, switch tab)
```
1. Gym provider portal opens
2. Shows 1 new redemption from earlier
3. Redemption stats, credit earnings visible
4. Verification badge shown on their listing
```

---

## Short Project Description

> A welfare marketplace where employees spend employer-funded credits on the perks they actually want — from gyms and travel to courses and meal delivery — while HR tracks spend and providers reach a motivated audience. Its standout feature, Life Moments, automatically curates care packages and lets teammates anonymously gift credits when a colleague goes through something significant. Benefits, finally built around people.

---

*Built for hackathon. Three people. Three days. One product.*

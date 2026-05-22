# Longevity — Product Requirements Document v2

> **App:** Champions Longevity Dashboard  
> **Tagline:** Biomarker Tracking & Health Analytics  
> **Status:** In Development  
> **Last Updated:** 2026-05-22  
> **Author:** Hemang / Deep  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Goals](#2-vision--goals)
3. [User Roles](#3-user-roles)
4. [Architecture Overview](#4-architecture-overview)
5. [Tech Stack](#5-tech-stack)
6. [Mobile App — Screens & Features](#6-mobile-app--screens--features)
7. [Admin Dashboard — Screens & Features](#7-admin-dashboard--screens--features)
8. [Database Schema](#8-database-schema)
9. [Edge Functions / Backend API](#9-edge-functions--backend-api)
10. [Third-Party Integrations](#10-third-party-integrations)
11. [Design System & Wireframe Notes](#11-design-system--wireframe-notes)
12. [Current Build Status](#12-current-build-status)
13. [Remaining Work & Roadmap](#13-remaining-work--roadmap)
14. [Feasibility Assessment](#14-feasibility-assessment)
15. [Non-Functional Requirements](#15-non-functional-requirements)
16. [Payment Flow — QR + Screenshot Verification](#16-payment-flow--qr--screenshot-verification)
17. [Diagnostics Matrix — Detailed Plan](#17-diagnostics-matrix--detailed-plan)
18. [Session Report Upload — Physician & Therapist](#18-session-report-upload--physician--therapist)
19. [Gamification System](#19-gamification-system)
20. [Backend — Python FastAPI Plan](#20-backend--python-fastapi-plan)
21. [AI Wellness Companion — Privacy-First Design](#21-ai-wellness-companion--privacy-first-design)
22. [Health Metrics Scoring Engine — Full Formulation](#22-health-metrics-scoring-engine--full-formulation)
23. [Device Integration Research — Apple Health, Google Health Connect, Fitbit](#23-device-integration-research--apple-health-google-health-connect-fitbit)

---

## 1. Executive Summary

**Longevity** is a comprehensive longevity and preventive health platform connecting patients with physicians and wellness therapies. It enables users to track biomarkers, book physician consultations (video or in-person), access therapy programs, and receive AI-driven health insights — all from a single mobile app. A companion web admin panel allows physicians and staff to manage schedules, patients, therapies, and consultations.

The platform is built as a TypeScript monorepo with a React Native (Expo) mobile app, a React + Vite admin web app, and a Supabase backend — all containerized via Docker and served through Nginx.

---

## 2. Vision & Goals

### Vision
Build the gold standard digital health companion for people pursuing a longer, healthier life — bridging clinical diagnostics, personalized therapy, and ongoing physician support in one seamless experience.

### Primary Goals
- Allow users to log and track key health biomarkers over time
- Connect users with specialised longevity physicians via video or in-clinic
- Enable booking of wellness therapies (IV, cryotherapy, etc.) at the clinic
- Give physicians and staff a powerful admin panel to manage operations
- Provide data-driven health dashboards and trend analytics
- Send smart reminders and notifications to keep users engaged

### Success Metrics
| Metric | Target |
|---|---|
| MAU (Month 1) | 200+ |
| Consultation booking conversion | > 40% |
| Biomarker entries per user / month | > 5 |
| Physician response time | < 24h |
| App crash rate | < 0.1% |

---

## 3. User Roles

| Role | Access | Description |
|---|---|---|
| **Patient** | Mobile App | End user — tracks health, books consults & therapies, does video calls |
| **Physician** | Admin Panel (physician view) | Manages own schedule, views patient records, updates consultation notes |
| **Admin / Staff** | Admin Panel (full access) | Manages all patients, physicians, slots, therapies, rooms |
| **Super Admin** | Admin Panel | Full system access including physician creation |

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                         │
│                                                          │
│   Mobile App (Expo / React Native)  :8081                │
│   Admin Web App (React + Vite)      :3000                │
└─────────────────────┬────────────────────────────────────┘
                      │
              ┌───────▼───────┐
              │  Nginx Proxy  │  :8080
              └───────┬───────┘
                      │
        ┌─────────────▼──────────────┐
        │       Supabase             │
        │  ┌──────────────────────┐  │
        │  │ PostgreSQL (RLS)     │  │
        │  │ Auth                 │  │
        │  │ Storage              │  │
        │  │ Realtime             │  │
        │  │ Edge Functions       │  │
        │  └──────────────────────┘  │
        └────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │   External Services        │
        │  Agora  │  Zoom  │  FCM    │
        │  Sentry │  SMS   │         │
        └────────────────────────────┘
```

### Monorepo Structure
```
Longevity/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── admin/           # React + Vite admin web
├── packages/
│   └── shared/          # Shared types, utils, constants
├── supabase/
│   ├── functions/       # Edge functions (Deno)
│   ├── migrations/      # SQL migrations
│   ├── ALL_MIGRATIONS.sql
│   └── config.toml
├── docker/
│   └── nginx/nginx.conf
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 5. Tech Stack

### Mobile App (`apps/mobile`)
| Concern | Technology |
|---|---|
| Framework | React Native 0.74 + Expo SDK 51 |
| Routing | Expo Router v3 (file-based) |
| Language | TypeScript 5.4 |
| State Management | Zustand 4.5 |
| Server State | TanStack Query v5 + AsyncStorage persister |
| Database Client | Supabase JS v2 |
| Charts | react-native-gifted-charts |
| Video Calls | Agora RTC |
| Notifications | Expo Notifications (FCM) |
| Error Monitoring | Sentry |

### Admin Web App (`apps/admin`)
| Concern | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | React Router DOM |
| Language | TypeScript |
| State Management | Zustand |
| Server State | TanStack Query |
| Database Client | Supabase JS v2 |
| Styling | CSS (index.css) |

### Backend
| Concern | Technology |
|---|---|
| Database | PostgreSQL (via Supabase) |
| Auth | Supabase Auth (email/OTP) |
| Edge Functions | Deno (Supabase Edge Runtime) |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |

### Infrastructure
| Concern | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Reverse Proxy | Nginx (alpine) |
| Build System | Turborepo |
| Package Manager | npm |

---

## 6. Mobile App — Screens & Features

### 6.1 Auth Flow `app/(auth)/`

#### `intro.tsx` — Onboarding / Intro Screen
- Full-screen splash with app branding
- Brief value proposition ("Track your biomarkers, live longer")
- CTA buttons: **Get Started** → signup, **Sign In** → login

#### `signup.tsx` — Registration
- Fields: Name, Email, Password, Date of Birth
- Consent checkbox (GDPR/health data consent — stored as `consent_given_at`)
- On success → verify screen

#### `verify.tsx` — Email / OTP Verification
- 6-digit OTP input
- Resend OTP button (cooldown timer)
- On verify → profile-setup

#### `login.tsx` — Login
- Email + Password fields
- "Forgot Password?" link
- OAuth future option placeholder

#### `profile-setup.tsx` — Initial Profile Setup
- Inputs: Height (cm), Weight (kg), Gender, Age
- Multi-select: Health Goals (e.g., weight loss, longevity, stress reduction)
- Saved to `users` table
- On complete → main tab navigator

---

### 6.2 Main Tab Navigator `app/(tabs)/`

#### `dashboard/` — Home / Health Dashboard
**Purpose:** Central hub for the user's health at a glance

**Features:**
- Greeting header with user name
- Health Score card (composite score from biomarkers)
- Biomarker summary cards (latest values for key metrics)
- Upcoming appointments widget
- Trending chart (e.g., blood pressure last 30 days via `react-native-gifted-charts`)
- Quick actions: Log Health Data, Book Consult, Browse Therapies
- Notification bell (unread badge)

#### `diagnostics/` — Biomarker Tracking
**Purpose:** Log and view health metrics over time

**Features:**
- Metric categories: Blood Markers, Vitals, Body Composition, Sleep, HRV
- Add entry: metric type picker + value input + date
- Historical charts per metric
- Source tracking (manual, wearable, lab upload)
- Trend indicators (up/down/stable vs. last entry)
- Target ranges with color coding (green/amber/red)
- Data sourced from `health_metrics` table

**Key Metrics Tracked:**
| Category | Metrics |
|---|---|
| Blood | HbA1c, Cholesterol, Triglycerides, Glucose, CRP |
| Vitals | Blood Pressure, Resting HR, SpO2, Body Temp |
| Body | Weight, BMI, Body Fat %, Muscle Mass |
| Sleep | Duration, REM %, Deep Sleep % |
| Longevity | VO2 Max, Biological Age, HRV |

#### `consult/` — Physician Consultation
**Purpose:** Browse physicians and book video/in-person consultations

**Features:**
- Physician directory (name, photo, specialization, bio)
- View physician's available slots
- Book consultation slot (creates record in `consultations`)
- Upcoming consultations list with status badges
- Join video call (Agora or Zoom) when slot is active
- View consultation notes post-session
- Reschedule (up to allowed count) / Cancel
- Consultation status: scheduled → in_progress → completed / no_show / cancelled

#### `appointments/` — All Bookings Overview
**Purpose:** Unified view of all upcoming and past bookings

**Features:**
- Tab: Consultations | Therapies
- Calendar / list toggle
- Status filters
- Cancellation flow
- Past records with notes

#### `therapies/` — Therapy Catalogue & Booking
**Purpose:** Browse and book wellness therapies

**Features:**
- Therapy cards (name, description, duration, price tier)
- Filter by pricing tier (basic / premium / elite)
- View available slots per therapy
- Book slot (creates `therapy_bookings`)
- My Bookings section (status: pending / confirmed / completed / cancelled)

**Therapy Types (examples):**
- IV Nutrient Therapy
- Cryotherapy
- Red Light Therapy
- Hyperbaric Oxygen
- Float Tank
- Infrared Sauna

#### `programs/` — Wellness Programs
**Purpose:** Structured multi-week health protocols

**Features:**
- Program cards (name, duration, goal, included therapies)
- Enroll in program
- Program progress tracker
- Recommended therapies within program

#### `chat/` — Messaging
**Purpose:** Async messaging with assigned physician or support

**Features:**
- Thread list (physician/support)
- Real-time messaging via Supabase Realtime
- File/image attachment
- Read receipts
- Physician can respond from admin panel

#### `explore/` — Discovery & Content
**Purpose:** Health content, tips, and featured programs

**Features:**
- Featured articles / videos on longevity topics
- Personalized recommendations based on health goals
- Therapy spotlight cards
- "What's new" section

#### `profile/` — User Profile & Settings
**Purpose:** Account management and health profile

**Features:**
- Edit personal details (height, weight, health goals)
- Notification preferences
- Privacy settings
- Data export request
- Delete account (triggers `delete-user-data` edge function)
- App version info, T&C, Privacy Policy links
- Sign out

---

### 6.3 Modules `src/modules/`

#### `booking/`
- Slot availability logic
- Booking state machine (draft → confirmed → cancelled)
- Conflict detection

#### `health-sync/`
- Sync health data from wearables (Apple Health / Google Fit - future)
- Manual entry validation
- Offline queue with TanStack Query persister

#### `video-session/`
- Agora RTC integration (primary video)
- Zoom meeting join (fallback / specific cases)
- Pre-call permission checks (camera, mic)
- In-call UI (mute, camera toggle, end call)
- Token fetched from `generate-agora-token` edge function

---

## 7. Admin Dashboard — Screens & Features

Base URL: `/admin`

### Auth
- `LoginPage.tsx` — Email + Password login for staff/physicians
- `ForgotPasswordPage.tsx` — Password reset request
- `ResetPasswordPage.tsx` — Set new password (from email link)

### Dashboard
- `DashboardPage.tsx`
  - KPI cards: Total Patients, Today's Consultations, Active Slots, Revenue
  - Upcoming consultation list (today's schedule)
  - Recent patient sign-ups
  - Therapy booking volume chart

### Patient Management
- `PatientsPage.tsx`
  - Searchable, filterable patient list (name, email, join date)
  - Pagination
  - Link to patient detail

- `PatientDetailPage.tsx`
  - Full patient profile (age, gender, height, weight, health goals)
  - Health metrics history (charts + table)
  - Consultation history
  - Therapy booking history
  - Notes field for admin

### Consultation Management
- `ConsultDetailPage.tsx`
  - Full consultation record
  - Patient info, physician info, slot time
  - Status management (mark complete, no-show, cancel)
  - Add/edit physician notes
  - View recommended therapies from consultation

### Physician Schedule Management
- `PhysicianSchedulePage.tsx`
  - Physician selector
  - Weekly calendar view of their slots
  - Add new slots (date, time range)
  - Block slots / mark unavailable

- `PhysicianSlotsPage.tsx`
  - List view of all slots for a physician
  - Slot status: available / booked / completed / cancelled

### Slot Management (Global)
- `SlotsPage.tsx`
  - All consultation slots across all physicians
  - Filter by physician, date, status
  - Bulk slot creation

### Therapy & Room Management
- `TherapiesAdminPage.tsx`
  - CRUD for therapies (name, description, duration, pricing tier, booking type, active toggle)

- `TherapySlotsPage.tsx`
  - Create/edit therapy time slots
  - Assign room
  - Set capacity
  - View booked_count vs capacity

---

## 8. Database Schema

### `users`
```sql
uuid          UUID PK (→ auth.users)
name          TEXT
age           INT
gender        TEXT
height_cm     NUMERIC
weight_kg     NUMERIC
health_goals  TEXT[]
consent_given_at TIMESTAMPTZ
deleted_at    TIMESTAMPTZ
created_at    TIMESTAMPTZ
```
RLS: Users can only read/write their own record.

### `health_metrics`
```sql
id            UUID PK
uuid          UUID FK → users
metric_type   TEXT        -- e.g. 'hba1c', 'blood_pressure_systolic'
value         NUMERIC
recorded_at   DATE
source        TEXT        -- 'manual' | 'apple_health' | 'lab'
UNIQUE (uuid, metric_type, recorded_at, source)
```
RLS: User sees own. Physician sees records of their consultation patients.

### `physicians`
```sql
uuid          UUID PK (→ auth.users)
name          TEXT
specialization TEXT
bio           TEXT
photo_url     TEXT
```
RLS: All authenticated users can SELECT.

### `admin_users`
```sql
uuid                  UUID PK (→ auth.users)
role                  TEXT    -- 'admin' | 'staff' | 'physician'
linked_physician_uuid UUID FK → physicians
```

### `consultation_slots`
```sql
id             UUID PK
physician_uuid UUID FK → physicians
start_time     TIMESTAMPTZ
end_time       TIMESTAMPTZ
status         TEXT   -- 'available' | 'booked' | 'completed' | 'cancelled'
```

### `consultations`
```sql
id                      UUID PK
patient_uuid            UUID FK → users
slot_id                 UUID FK → consultation_slots
video_type              TEXT    -- 'agora' | 'zoom'
agora_channel           TEXT
video_link              TEXT    -- Zoom URL
notes                   TEXT
recommended_therapy_ids UUID[]
reschedule_count        INT
status                  TEXT    -- 'scheduled' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
created_at              TIMESTAMPTZ
```

### `therapies`
```sql
id            UUID PK
name          TEXT
description   TEXT
duration_min  INT
pricing_tier  TEXT    -- 'basic' | 'premium' | 'elite'
booking_type  TEXT    -- 'individual' | 'group'
active        BOOLEAN
```

### `rooms`
```sql
id        UUID PK
name      TEXT
capacity  INT
```

### `therapy_slots`
```sql
id              UUID PK
therapy_id      UUID FK → therapies
room_id         UUID FK → rooms
start_time      TIMESTAMPTZ
capacity        INT
booked_count    INT
```

### `therapy_bookings`
```sql
id               UUID PK
patient_uuid     UUID FK → users
therapy_slot_id  UUID FK → therapy_slots
status           TEXT   -- 'pending' | 'confirmed' | 'completed' | 'cancelled'
created_at       TIMESTAMPTZ
```

### Automated Functions
- **`mark_noshow_consultations()`** — pg_cron job; auto-marks consultations as `no_show` if 10+ min past slot start, frees the slot
- **`sync_slot_on_consultation_complete()`** — trigger; updates slot status on consultation outcome change

---

## 9. Edge Functions / Backend API

All edge functions run on Supabase Edge Runtime (Deno).

| Function | Trigger | Purpose |
|---|---|---|
| `generate-agora-token` | Patient joins video call | Generates secure Agora RTC token for channel |
| `create-zoom-meeting` | Admin creates Zoom-type consult | Creates Zoom meeting via API, returns join URL |
| `create-physician` | Super admin action | Creates physician auth user + physicians record atomically |
| `send-otp-sms` | Signup / login | Sends SMS OTP via SMS provider |
| `schedule-reminders` | pg_cron / webhook | Sends FCM push notifications for upcoming consults/therapies |
| `delete-user-data` | User requests account deletion | GDPR-compliant data wipe (soft delete + anonymization) |

---

## 10. Third-Party Integrations

| Service | Purpose | SDK / Method |
|---|---|---|
| **Supabase** | Auth, DB, Storage, Realtime, Edge Functions | `@supabase/supabase-js` |
| **Agora** | Real-time video calls (primary) | Agora RTC SDK (token via edge fn) |
| **Zoom** | Meeting-style video (fallback) | Zoom API (link via edge fn) |
| **FCM (Firebase)** | Push notifications on mobile | `expo-notifications` + FCM sender |
| **Sentry** | Crash reporting & error monitoring | `EXPO_PUBLIC_SENTRY_DSN` |
| **SMS Provider** | OTP delivery | Via `send-otp-sms` edge function |

---

## 11. Design System & Wireframe Notes

**Source:** Chief's wireframe — Champions Longevity Dashboard

### Brand Identity
- **Primary Palette:** Deep navy / charcoal backgrounds (longevity/medical premium feel)
- **Accent:** Bright teal / green (health, vitality)
- **Typography:** Clean sans-serif (likely Inter or SF Pro style)
- **Tone:** Clinical yet aspirational — premium wellness, not hospital

### Key Design Principles
1. **Data-first:** Biomarkers and charts are front and center — always show numbers prominently
2. **Status clarity:** Color-coded health ranges (green = optimal, amber = borderline, red = concern)
3. **Action proximity:** Every screen has a primary CTA visible without scrolling
4. **Trust signals:** Physician photos, credentials, and verified badges throughout
5. **Minimal friction:** Booking a consult or logging a metric should take < 3 taps

### Screen-level Notes (from wireframe)
- **Dashboard:** Card-based layout. Top = health score ring. Middle = biomarker chips. Bottom = upcoming consult banner.
- **Diagnostics:** Tabbed by category. Each metric has sparkline + latest value + trend arrow.
- **Consult screen:** Physician cards with photo, specialization, next available slot. One-tap booking.
- **Therapies:** Grid of therapy cards with icon, name, duration, price tier badge.
- **Profile:** Clean list settings UI. Health stats summary at top.

### Mobile UX Patterns
- Bottom tab bar (9 tabs — may need to consolidate to 5 primary + overflow)
- Sticky headers on scroll
- Pull-to-refresh on data screens
- Skeleton loaders (not spinners) while fetching
- Empty states with illustration + CTA

---

## 12. Current Build Status

### ✅ Done

**Infrastructure**
- [x] Monorepo setup with Turborepo
- [x] Docker Compose stack (mobile + admin + nginx)
- [x] Supabase project configured (config.toml)
- [x] All database migrations written (ALL_MIGRATIONS.sql)
- [x] RLS policies on all tables
- [x] All 6 edge functions scaffolded

**Mobile App**
- [x] Expo Router file-based routing structure
- [x] Auth flow screens (intro, signup, verify, login, profile-setup)
- [x] Tab navigator with all 9 tab directories
- [x] Supabase client setup
- [x] TanStack Query + AsyncStorage persister
- [x] Zustand stores scaffolded
- [x] Module directories: booking, health-sync, video-session

**Admin App**
- [x] Vite + React + TypeScript setup
- [x] All 12 page components scaffolded
- [x] React Router routing
- [x] Supabase client setup
- [x] TanStack Query + Zustand

### 🚧 In Progress / Unknown Depth
- [ ] Actual UI implementation inside tab screens (unknown completion %)
- [ ] Edge function logic (scaffolded but implementation depth unknown)
- [ ] Admin page UI (structure exists, content depth unknown)

---

## 13. Remaining Work & Roadmap

### Phase 1 — Core MVP (Mobile)
| Task | Priority | Effort |
|---|---|---|
| Dashboard screen UI + health score calculation | P0 | L |
| Diagnostics: metric entry form + chart display | P0 | L |
| Consult: physician list + slot picker + booking flow | P0 | XL |
| Agora video call integration (join/leave/mute) | P0 | L |
| Therapy catalogue + slot booking flow | P0 | L |
| Push notification handling (schedule reminders) | P1 | M |
| Profile edit screen | P1 | S |
| Appointments unified view | P1 | M |

### Phase 2 — Core MVP (Admin)
| Task | Priority | Effort |
|---|---|---|
| Dashboard KPIs wired to real data | P0 | M |
| Patient list + detail (health metrics viewer) | P0 | L |
| Physician slot management (add/edit/block) | P0 | L |
| Consultation detail + notes + status management | P0 | M |
| Therapies CRUD + slot management | P0 | M |
| Physician creation flow (super admin) | P1 | M |

### Phase 3 — Polish & Growth
| Task | Priority | Effort |
|---|---|---|
| Chat / messaging (realtime) | P1 | XL |
| Programs / wellness protocols | P2 | L |
| Explore / content feed | P2 | M |
| Apple Health / Google Fit sync | P2 | XL |
| Biological age / AI health insights | P2 | XL |
| QR payment flow + screenshot upload + admin verification | P1 | M |
| Zoom video fallback integration | P2 | M |
| Wearable device support | P3 | XL |

### Effort Scale: S = 1-2d, M = 3-5d, L = 1-2w, XL = 2-4w

---

## 14. Feasibility Assessment

### Overall Verdict: ✅ Feasible — Solid Foundation, Significant UI Work Remains

### Strengths
| Area | Assessment |
|---|---|
| **Tech Stack** | ✅ Excellent — Expo + Supabase is a proven, fast-to-ship stack |
| **Architecture** | ✅ Well-structured monorepo with clear separation of concerns |
| **Database Design** | ✅ Thoughtful schema — RLS policies, cascade deletes, no-show automation |
| **Edge Functions** | ✅ Right set of backend operations identified |
| **Video Calls** | ✅ Agora is industry standard for real-time video in health apps |
| **Infrastructure** | ✅ Docker + Nginx production-ready from day one |

### Risks & Mitigations
| Risk | Severity | Mitigation |
|---|---|---|
| 9 bottom tabs is too many for UX | Medium | Consolidate to 5 tabs (Dashboard, Diagnostics, Book, Programs, Profile); move chat/explore to secondary navigation |
| Agora token security | High | Always generate tokens server-side (edge function) — never expose app secret in client |
| HIPAA/health data compliance | High | Ensure `consent_given_at` is collected; add audit logging; consider data residency requirements |
| No-show automation (pg_cron) | Medium | pg_cron must be enabled in Supabase; test edge cases (timezone handling, concurrent calls) |
| Offline support | Medium | TanStack Query persister is set up — ensure mutation queue handles offline properly |
| Admin has no role-based UI | Medium | Admin app must gate features by `admin_users.role` — physician sees only own schedule |
| 1 git commit — early stage | Low | Normal for early dev; establish branch strategy now (main, dev, feature branches) |
| Payment not in schema | Resolved | Using QR + screenshot verification flow (see §16) — no payment gateway needed for v1 |

### Timeline Estimate
| Phase | Duration | Notes |
|---|---|---|
| Phase 1 — Mobile MVP | 6-8 weeks | 1-2 developers |
| Phase 2 — Admin MVP | 3-4 weeks | Parallel or sequential |
| Phase 3 — Polish | 4-6 weeks | After user testing |
| **Total to v1.0** | **~3-4 months** | With 2 developers |

---

## 15. Non-Functional Requirements

### Performance
- App cold start < 3 seconds
- Chart rendering < 500ms (use virtualized lists for long metric history)
- API response < 1 second for all primary reads

### Security
- All health data access enforced via Supabase RLS (no client-side filtering)
- Agora tokens generated server-side, short TTL (< 1 hour)
- SMS OTP for auth (no password-only auth for patients)
- GDPR: consent recorded at signup; delete-user-data edge function tested
- Sentry configured for both mobile and admin — PII scrubbing enabled

### Reliability
- Target 99.5% uptime (Supabase Pro handles this)
- `mark_noshow_consultations()` pg_cron must run every 5 minutes
- Push reminders should have retry logic in `schedule-reminders` fn

### Scalability
- Supabase connection pooling for high concurrent usage
- `therapy_slots.booked_count` updated atomically (use `UPDATE ... WHERE booked_count < capacity` pattern)
- Consider Supabase Realtime presence for active video session detection

### Observability
- Sentry for crash reporting (mobile + admin)
- Supabase dashboard for DB query performance
- Edge function logs via Supabase dashboard
- Add `created_at` to all tables for time-series analysis (✅ already done)

---

## 16. Payment Flow — QR + Screenshot Verification

> **Approach:** No payment gateway for v1. Admin uploads a UPI/bank QR code. Patient scans → pays → uploads screenshot with visible transaction ID. Admin verifies and approves.

---

### 16.1 User Flow (Mobile)

```
Therapy/Consult Booking Confirmed
          │
          ▼
  Payment Required Screen
  ┌──────────────────────────────┐
  │  [QR Code Image]             │
  │  Scan to pay ₹{amount}       │
  │                              │
  │  UPI ID: clinic@upi          │
  │  Amount: ₹2,500              │
  │                              │
  │  [Upload Payment Screenshot] │
  │  Transaction ID: ________    │
  │  [Submit for Verification]   │
  └──────────────────────────────┘
          │
          ▼
  Payment Pending — Awaiting admin approval
  (booking status = 'payment_pending')
          │
          ▼ (admin approves)
  Booking Confirmed ✅
  Push notification sent
```

**Screen: `payment-qr.tsx`** (new screen in mobile `app/`)
- Fetches active payment QR from `payment_config` table
- Displays QR image (Supabase Storage URL)
- Shows UPI ID + exact amount for this booking
- Image picker to upload payment screenshot
- Text field for Transaction ID (user enters manually)
- Submit → creates record in `payment_verifications`
- Status polling / Realtime subscription for approval

---

### 16.2 Admin Flow (Web)

**New Admin Page: `PaymentVerificationsPage.tsx`**
- List of all pending payment submissions
- Columns: Patient Name, Booking Type, Amount, Transaction ID, Submitted At, Screenshot
- Click screenshot → opens full-size image in modal
- Actions: **Approve** (sets booking to `confirmed`) | **Reject** (with reason, notifies patient)
- Filter by: Pending / Approved / Rejected / All

**New Admin Page: `PaymentSettingsPage.tsx`** (super admin / admin only)
- Upload new payment QR image (stored in Supabase Storage bucket `payment-qr`)
- Set UPI ID string (displayed alongside QR)
- Activate / deactivate a QR (only one active at a time)
- QR history log (who uploaded, when)

---

### 16.3 Database Schema Additions

#### `payment_config`
```sql
id           UUID PK
qr_image_url TEXT          -- Supabase Storage URL
upi_id       TEXT
is_active    BOOLEAN DEFAULT false
uploaded_by  UUID FK → admin_users
created_at   TIMESTAMPTZ
```
RLS: SELECT for authenticated patients (active only); ALL for admin.

#### `payment_verifications`
```sql
id                UUID PK
booking_type      TEXT       -- 'therapy' | 'consultation'
booking_id        UUID       -- references therapy_bookings.id or consultations.id
patient_uuid      UUID FK → users
amount            NUMERIC
transaction_id    TEXT       -- entered by patient
screenshot_url    TEXT       -- Supabase Storage URL
status            TEXT       -- 'pending' | 'approved' | 'rejected'
rejection_reason  TEXT
reviewed_by       UUID FK → admin_users
reviewed_at       TIMESTAMPTZ
created_at        TIMESTAMPTZ
```
RLS: Patient sees own rows; admin sees all.

---

### 16.4 Storage Buckets

| Bucket | Purpose | Access |
|---|---|---|
| `payment-qr` | Admin-uploaded QR codes | Public read (authenticated), admin write |
| `payment-screenshots` | User-uploaded payment proofs | Private — patient write own, admin read all |

---

### 16.5 Booking Status State Machine (updated)

```
Therapy Booking:
  pending → payment_pending → confirmed → completed
                           → rejected (re-submit or cancel)
                    → cancelled

Consultation Booking:
  scheduled → payment_pending → confirmed → in_progress → completed
                             → rejected
```

---

### 16.6 Edge Function: `verify-payment-notification`

Triggered when admin approves/rejects a `payment_verifications` record.
- On approve: updates booking status to `confirmed`, sends FCM push "Your booking is confirmed!"
- On reject: updates booking status to `payment_rejected`, sends FCM push with reason

---

### 16.7 Admin QR Management — Access Control

| Role | Upload QR | View Verifications | Approve / Reject |
|---|---|---|---|
| Super Admin | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ |
| Staff | ❌ | ✅ | ✅ |
| Physician | ❌ | ❌ | ❌ |

---

## 17. Diagnostics Matrix — Detailed Plan

> **Note:** This section is a dedicated plan for the Diagnostics screen as envisioned in the chief's wireframe. It goes significantly beyond simple metric logging — it's a structured health matrix that visualises where a user stands across all longevity dimensions.
>
> **Important design decision:** The composite Longevity Score (0–100) is a **patient-facing motivational tool only**. Physicians must never see or act on this score clinically — their view shows raw values, clinical reference ranges (sourced from ADA/AHA/ESC guidelines), and trend charts. The score needs chief physician sign-off on weights before shipping.

---

### 17.1 Concept: The Diagnostics Matrix

The Diagnostics screen is the scientific core of the app. Rather than a flat list of numbers, it presents health as a **multi-dimensional matrix** — each category has a score, each metric has a range band, and the whole thing tells a unified story: *"Where are you on your longevity journey?"*

```
┌──────────────────────────────────────────┐
│  YOUR HEALTH MATRIX                      │
│  Last updated: Today                     │
│                                          │
│  ┌──────────┐  ┌──────────┐             │
│  │ METABOLIC│  │ CARDIAC  │             │
│  │   72/100 │  │  85/100  │             │
│  │  ●●●●○○  │  │  ●●●●●○  │             │
│  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐             │
│  │  BODY    │  │  SLEEP & │             │
│  │COMPOSIT. │  │  RECOVERY│             │
│  │   68/100 │  │  55/100  │             │
│  └──────────┘  └──────────┘             │
│  ┌──────────┐  ┌──────────┐             │
│  │LONGEVITY │  │  MENTAL  │             │
│  │BIOMARKERS│  │ WELLNESS │             │
│  │   80/100 │  │  (soon)  │             │
│  └──────────┘  └──────────┘             │
│                                          │
│  OVERALL LONGEVITY SCORE: 74/100        │
└──────────────────────────────────────────┘
```

---

### 17.2 Category Definitions

#### A. Metabolic Health
| Metric | Unit | Optimal | Borderline | Concern |
|---|---|---|---|---|
| Fasting Glucose | mg/dL | < 100 | 100–125 | ≥ 126 |
| HbA1c | % | < 5.7 | 5.7–6.4 | ≥ 6.5 |
| Fasting Insulin | μIU/mL | < 7 | 7–15 | > 15 |
| Triglycerides | mg/dL | < 100 | 100–149 | ≥ 150 |
| HDL Cholesterol | mg/dL | > 60 (M) / > 50 (F) | 40–60 | < 40 |
| LDL (ApoB proxy) | mg/dL | < 100 | 100–129 | ≥ 130 |
| CRP (hs) | mg/L | < 1.0 | 1–3 | > 3 |
| Homocysteine | μmol/L | < 10 | 10–15 | > 15 |

#### B. Cardiovascular Health
| Metric | Unit | Optimal | Borderline | Concern |
|---|---|---|---|---|
| Blood Pressure (Sys) | mmHg | < 120 | 120–139 | ≥ 140 |
| Blood Pressure (Dia) | mmHg | < 80 | 80–89 | ≥ 90 |
| Resting Heart Rate | bpm | 50–70 | 70–85 | > 85 or < 45 |
| VO2 Max | mL/kg/min | Age-adjusted | Age-adjusted | — |
| HRV (RMSSD) | ms | > 50 | 30–50 | < 30 |

#### C. Body Composition
| Metric | Unit | Optimal | Borderline | Concern |
|---|---|---|---|---|
| Body Fat % | % | 10–20 (M) / 18–28 (F) | ±5% | > 30 (M) / > 38 (F) |
| Muscle Mass | kg | Age-adjusted | — | — |
| BMI | kg/m² | 18.5–24.9 | 25–29.9 | ≥ 30 or < 18.5 |
| Waist Circumference | cm | < 94 (M) / < 80 (F) | — | > 102 (M) / > 88 (F) |
| Visceral Fat | Rating | 1–9 | 10–14 | ≥ 15 |

#### D. Sleep & Recovery
| Metric | Unit | Optimal | Borderline | Concern |
|---|---|---|---|---|
| Total Sleep | hrs | 7–9 | 6–7 | < 6 or > 10 |
| Deep Sleep % | % | > 20% | 15–20% | < 15% |
| REM Sleep % | % | > 20% | 15–20% | < 15% |
| Sleep Consistency | — | ±30 min | ±60 min | > 60 min variance |
| Recovery Score | 1–100 | > 70 | 50–70 | < 50 |

#### E. Longevity Biomarkers
| Metric | Unit | Optimal | Notes |
|---|---|---|---|
| Biological Age | Years | < Chronological | Calculated composite |
| Telomere Length | T/S ratio | Age-adjusted | Lab test |
| NAD+ | nmol/mg | > 30 | Specialized lab |
| Vitamin D (25-OH) | ng/mL | 40–80 | |
| Omega-3 Index | % | > 8% | |
| Testosterone (total) | ng/dL | Age-adjusted | Gender-adjusted |
| IGF-1 | ng/mL | Age-adjusted | |

#### F. Mental Wellness *(Phase 3 — future)*
- Stress score (HRV-derived)
- Mood logging (1–5 daily)
- Cognitive function (simple reaction time test)

---

### 17.3 Scoring Algorithm

Each category score (0–100) is computed as a weighted average of its metrics:
- **Optimal** → 100 points for that metric
- **Borderline** → 60 points (linear scale within range)
- **Concern** → 0–40 points (scaled by severity)
- **Missing metric** → excluded from average (not penalised for not testing everything)

**Overall Longevity Score** = weighted average of all category scores:
| Category | Weight |
|---|---|
| Metabolic | 25% |
| Cardiovascular | 25% |
| Body Composition | 15% |
| Sleep & Recovery | 15% |
| Longevity Biomarkers | 20% |

Scoring logic lives in `packages/shared` so both mobile and admin can use it.

---

### 17.4 Screen Architecture (Mobile)

#### Entry: `diagnostics/index.tsx`
- Overview matrix (6 category cards with score + ring)
- Overall score at top
- "Last updated" timestamp per category
- Tap category card → drill into category detail

#### Drill-down: `diagnostics/[category].tsx`
- Category header with score ring
- Metric list, each row showing:
  - Metric name
  - Latest value + unit
  - Color band indicator (green / amber / red)
  - Trend arrow (vs. previous entry)
  - Sparkline (last 6 readings)
  - Tap row → metric history modal
- "+ Log New Reading" FAB button

#### Log Entry: `diagnostics/log.tsx` (modal / sheet)
- Metric picker (grouped by category)
- Value input (numeric keyboard, unit shown)
- Date picker (defaults to today)
- Source selector: Manual | Lab Report | Wearable
- Optional: upload lab report image (Supabase Storage)
- Save → optimistic update in TanStack Query cache

#### Metric History Modal
- Full chart (line graph, 3M / 6M / 1Y range toggle)
- Reference range band overlaid on chart
- Data table below chart (date, value, source)
- Edit / delete individual entries

---

### 17.5 Database Additions for Diagnostics

#### `metric_definitions` (new — seeded table)
```sql
id            UUID PK
category      TEXT    -- 'metabolic' | 'cardiovascular' | 'body' | 'sleep' | 'longevity'
metric_key    TEXT    -- e.g. 'fasting_glucose'
display_name  TEXT    -- e.g. 'Fasting Glucose'
unit          TEXT    -- e.g. 'mg/dL'
optimal_min   NUMERIC
optimal_max   NUMERIC
border_min    NUMERIC
border_max    NUMERIC
weight        NUMERIC -- within-category scoring weight
sort_order    INT
```
This table is read-only (seeded), no RLS needed beyond authenticated SELECT.

> `health_metrics.metric_type` keys map 1:1 to `metric_definitions.metric_key` — no schema change needed to `health_metrics`, just add the definition table.

#### `lab_reports` (new — optional attachment)
```sql
id            UUID PK
patient_uuid  UUID FK → users
file_url      TEXT    -- Supabase Storage
uploaded_at   TIMESTAMPTZ
note          TEXT
```

---

### 17.6 Phone-Native Data (No External Device Required)

These measurements are available from the smartphone itself and should be wired as first-class "Measure Now" inputs on the diagnostics screen.

#### Camera PPG (finger on rear camera + flash)
| Metric | Reliability | Method |
|---|---|---|
| Resting Heart Rate | ✅ Good (±3–5 bpm) | PPG — blood flow detected via flash reflection |
| HRV (RMSSD) | ⚠️ Trend use only | Derived from RR intervals in PPG signal (~2 min read) |
| SpO2 estimate | ⚠️ Rough (±2–4%) | Red/IR ratio via camera + flash — not clinical grade |
| Respiratory Rate | ❌ Unreliable | Subtle chest motion — skip for v1 |

**Implementation:** Use an existing React Native PPG library or write a native module. Measurement button on the Cardiovascular and Longevity category screens. Results auto-populate the relevant `health_metrics` entry with `source = 'camera_ppg'`.

#### Accelerometer (always on, no permission)
- Steps per day → feeds "Active Minutes" metric
- Activity level (sedentary / light / moderate / vigorous)
- Rough sleep detection (if phone is on bedside) — use as fallback if no manual log

#### Manual Self-Report (critical — covers most biomarkers at launch)
- Blood pressure (user reads from their own cuff)
- Weight (bathroom scale)
- Blood glucose (glucometer reading)
- Sleep duration + rough quality (morning check-in: "How did you sleep? 1–5")
- Water intake, meals (optional)

#### What Always Needs Lab / External Device
These can only enter the matrix via physician-uploaded reports or manual lab entry:
- HbA1c, Lipids, CRP, Homocysteine, Hormones, Vitamin D, NAD+
- Body fat % (DEXA or bioimpedance)
- Telomere length (specialised lab)

> **v1 strategy:** Camera PPG for HR/HRV, accelerometer for steps, manual entry for everything else. Lab values enter exclusively via physician/therapist report upload (§18) or patient manual entry with lab paper in hand.

---

### 17.7 Scoring Integrity & Clinical Defensibility

**Three rules that must be followed before shipping the score:**

1. **Reference ranges from published guidelines only** — not invented internally:
   - Glucose/HbA1c → ADA 2024 Standards of Care
   - BP → AHA/ACC 2017 Hypertension Guidelines
   - Lipids → ACC/AHA Cholesterol Guidelines
   - BMI → WHO with South Asian adjustment (≥23 = overweight for South Asian patients)
   - Sleep → NSF Consensus (7–9h for adults)
   - HRV → No single standard; use age-stratified normative data (Shaffer & Ginsberg 2017)

2. **Age-bracket adjustment is mandatory** — same metric, different optimal:
   - Age groups: 20–35 / 36–50 / 51–65 / 65+
   - `metric_definitions` table must store `optimal_min_by_age` and `optimal_max_by_age` as JSONB columns
   - At minimum: VO2 max, HRV, testosterone, IGF-1, resting HR

3. **Score is patient-only, not clinical** — mandatory disclaimer on every score display:
   > *"Your Longevity Score tracks trends over time. It is not a medical diagnosis. Consult your physician to interpret individual values."*

**Physician view of diagnostics** (separate from patient matrix):
- Raw table: metric name | latest value | unit | clinical range | status flag | trend
- Status flag: `NORMAL` / `BORDERLINE` / `ABNORMAL` (per clinical guidelines, not our score)
- **No composite score shown to physician**
- Trend chart per metric (physician can annotate: "Recheck in 3 months")
- Chief physician must review and approve reference ranges before launch — add as a blocker

---

### 17.8 Admin: Diagnostics View for Physicians

On `PatientDetailPage.tsx`, add a **Diagnostics tab** with physician-appropriate layout:

**What physician sees (raw clinical view, not the score):**
- Metric table grouped by category: Name | Latest Value | Unit | Clinical Range | Flag | Last Updated
- `ABNORMAL` rows highlighted in red, `BORDERLINE` in amber
- Click any metric row → full history chart with clinical reference band overlay
- "Add Clinical Note" against any metric (e.g., "HbA1c trending up — discussed diet changes in session")
- All metrics tagged `source = 'physician_report'` are highlighted with a report icon
- Export patient diagnostics as PDF (Phase 3)

**What physician does NOT see:**
- The composite Longevity Score (0–100)
- Our internal scoring weights

---

### 17.9 Roadmap for Diagnostics

| Task | Priority | Effort |
|---|---|---|
| Seed `metric_definitions` table (with guidelines source) | P0 | M |
| Age-bracket adjustment columns in `metric_definitions` | P0 | S |
| Scoring algorithm in `packages/shared` (age-adjusted) | P0 | M |
| Chief physician reference range sign-off | P0 | — |
| Diagnostics matrix overview screen (patient) | P0 | L |
| Category drill-down screen | P0 | L |
| Camera PPG "Measure Now" (HR + HRV) | P0 | L |
| Log entry modal (manual input) | P0 | M |
| Metric history chart + reference band overlay | P0 | M |
| Physician clinical table view (raw data, no score) | P1 | M |
| Physician metric annotation / notes | P1 | S |
| Score disclaimer UI component | P0 | S |
| Wearable / Apple Health sync to metrics | P3 | XL |
| AI lab report OCR extraction | P3 | XL |
| PDF export (patient + physician) | P3 | M |

---

## 18. Session Report Upload — Physician & Therapist

> **Purpose:** After every consultation or therapy session, the practitioner uploads a session report. Reports that contain measurable health values automatically feed back into the patient's Diagnostics Matrix, keeping scores current without the patient needing to re-enter data manually.

---

### 18.1 Report Types

| Report Type | Who Uploads | Clinical Data? | Feeds Matrix? |
|---|---|---|---|
| Lab Report / Blood Panel | Physician | Yes — metric values | ✅ Yes |
| Session Notes | Physician / Therapist | Sometimes | Conditional |
| Prescription | Physician | No | ❌ No |
| Therapy Log | Therapist | Sometimes (vitals) | ✅ If tagged |
| Imaging / Scan | Physician | No (descriptive) | ❌ No |

---

### 18.2 Upload Flow — Admin Side

#### After a Consultation (`ConsultDetailPage.tsx`)
```
Consultation marked Complete
        │
        ▼
[+ Upload Session Report] button appears
        │
        ▼
Report Upload Modal:
  ┌─────────────────────────────────────┐
  │ Report Type: [Lab Report ▾]         │
  │ File: [Choose PDF / Image]          │
  │ Visible to patient: [Yes / No]      │
  │                                     │
  │ ── Tag Metric Values (optional) ─── │
  │ + Add Metric    [Metric ▾] [Value]  │
  │   HbA1c         [    5.9  ] %       │
  │   Fasting Glucose [  102  ] mg/dL   │
  │   LDL           [   118  ] mg/dL    │
  │ + Add another metric                │
  │                                     │
  │          [Upload Report]            │
  └─────────────────────────────────────┘
        │
        ▼
Report saved → tagged metrics written to health_metrics
(source = 'physician_report')
        │
        ▼
Patient's Diagnostics Matrix score recalculates
Patient gets push notification: "Your doctor uploaded new test results"
```

#### After a Therapy Session (`TherapySlotsPage` / booking detail)
Same modal, but:
- Report Type defaults to "Therapy Log"
- Metric tagging example: Body Weight post-session, Blood Pressure, SpO2 observed
- These less-common vitals still feed the matrix if tagged

---

### 18.3 Database Schema — `session_reports`

```sql
id                  UUID PK
session_type        TEXT       -- 'consultation' | 'therapy'
session_id          UUID       -- FK to consultations.id or therapy_bookings.id
patient_uuid        UUID FK → users
uploaded_by         UUID FK → admin_users  -- physician or therapist
report_type         TEXT       -- 'lab_report' | 'session_notes' | 'prescription' | 'therapy_log' | 'imaging'
file_url            TEXT       -- Supabase Storage (private bucket)
visible_to_patient  BOOLEAN DEFAULT true
created_at          TIMESTAMPTZ
```

RLS:
- Patient: SELECT own rows WHERE `visible_to_patient = true`
- Admin/Physician/Therapist: INSERT + UPDATE own uploads; SELECT all for their patients

---

### 18.4 Database Schema — `report_metric_tags`

Separate from `health_metrics` to maintain a clear audit trail of what came from which report.

```sql
id                UUID PK
report_id         UUID FK → session_reports
patient_uuid      UUID FK → users
metric_key        TEXT       -- matches metric_definitions.metric_key
value             NUMERIC
unit              TEXT
recorded_date     DATE       -- date of the measurement, not upload date
tagged_by         UUID FK → admin_users
```

**Trigger / Edge Function:** On INSERT into `report_metric_tags`, upsert into `health_metrics`:
```sql
INSERT INTO health_metrics (uuid, metric_type, value, recorded_at, source)
VALUES (patient_uuid, metric_key, value, recorded_date, 'physician_report')
ON CONFLICT (uuid, metric_type, recorded_at, source) DO UPDATE SET value = EXCLUDED.value;
```

This means the `health_metrics` table remains the single source of truth for the matrix. The `report_metric_tags` table provides the audit link back to which report the value came from.

---

### 18.5 Supabase Storage — `session-reports` Bucket

| Property | Value |
|---|---|
| Bucket name | `session-reports` |
| Access | **Private** — no public URLs |
| Read | Patient (own, visible only) + Admin/Physician (all) |
| Write | Admin/Physician/Therapist only |
| File types | PDF, JPEG, PNG, HEIC |
| Max file size | 20 MB per file |

Files accessed via Supabase signed URLs (short TTL, 15 min) — never stored as plain public URLs.

---

### 18.6 Mobile — Patient Report Viewer

In the `appointments/` tab, past consultation and therapy booking cards show:

```
Consultation — Dr. Sharma     ✅ Completed
May 18, 2026 · 10:00 AM

[View Notes]  [View Reports (2)]
```

**Reports bottom sheet:**
- List of uploaded reports (name, type, date)
- Tap → opens PDF viewer or image viewer inside app
- Reports marked `visible_to_patient = false` are hidden entirely
- Banner: "2 new values added to your Diagnostics Matrix" if metrics were tagged

---

### 18.7 Edge Function: `process-report-metrics`

Triggered on INSERT into `report_metric_tags`.
1. Upserts all tagged values into `health_metrics`
2. Recalculates the affected category scores (calls scoring fn from `packages/shared`)
3. Sends FCM push to patient: "Dr. [Name] updated your health data — your matrix has been refreshed"
4. Logs the event in an `audit_log` table (metric_key, old_value, new_value, changed_by, timestamp)

---

### 18.8 Access Control

| Role | Upload Report | Tag Metrics | Delete Report | View All Reports |
|---|---|---|---|---|
| Super Admin | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ |
| Physician | ✅ (own patients) | ✅ | ✅ (own) | Own patients |
| Therapist / Staff | ✅ (own sessions) | ✅ (limited metrics) | ❌ | Own sessions |
| Patient | ❌ | ❌ | ❌ | Own (visible only) |

---

### 18.9 Data Flow Summary

```
Physician/Therapist uploads report + tags metric values
        │
        ▼
session_reports (file stored) + report_metric_tags (values)
        │
        ▼ (trigger / edge fn)
health_metrics updated (source = 'physician_report')
        │
        ▼
Diagnostics Matrix score recalculates in packages/shared
        │
        ├──→ Patient sees updated matrix + notification
        └──→ Audit log written (who changed what, when)
```

---

### 18.10 Roadmap for Session Reports

| Task | Priority | Effort |
|---|---|---|
| `session_reports` + `report_metric_tags` tables + RLS | P0 | S |
| `session-reports` Supabase Storage bucket | P0 | S |
| Report upload modal in admin (ConsultDetailPage) | P0 | M |
| Metric tagging UI (picker + value input rows) | P0 | M |
| `process-report-metrics` edge function + upsert trigger | P0 | M |
| FCM notification on metric update | P1 | S |
| Patient report viewer (bottom sheet in appointments) | P1 | M |
| Therapy session report upload (TherapySlotsPage) | P1 | M |
| Audit log table + admin view | P1 | M |
| AI OCR extraction from lab PDF (auto-tag metrics) | P3 | XL |

---

## 19. Gamification System

> **Philosophy:** Gamification in a clinical health app must feel earned, not gimmicky. Every point, badge, and streak must tie to a real health behaviour — logging data, attending sessions, improving scores. It should feel like a premium wellness tracker, not a mobile game. The goal is sustained engagement through meaningful milestones.

---

### 19.1 Core Mechanics Overview

```
┌─────────────────────────────────────────────────────┐
│              LONGEVITY GAMIFICATION ENGINE           │
│                                                     │
│   XP Points → Level → Health Tier                  │
│       │                                             │
│       ├── Earned by: logging, attending, improving  │
│       └── Displayed: dashboard XP bar + tier badge  │
│                                                     │
│   Streaks → Bonus XP → Streak Shield               │
│       │                                             │
│       └── Daily metric log / daily check-in         │
│                                                     │
│   Badges → Achievement Wall → Social Share         │
│       │                                             │
│       └── Milestones, category mastery, habits      │
│                                                     │
│   Challenges → Weekly Goals → Physician-Set        │
│       │                                             │
│       └── App-generated + physician-assigned        │
└─────────────────────────────────────────────────────┘
```

---

### 19.2 XP Points System

Every meaningful action earns XP. XP never expires and never resets.

| Action | XP Earned | Notes |
|---|---|---|
| Log any health metric | +10 XP | Per entry, max 5 unique metrics/day counted |
| Complete a physician consultation | +150 XP | Status must reach `completed` |
| Attend a therapy session | +100 XP | Status must reach `completed` |
| Daily cognitive self-report | +15 XP | Once per day |
| Upload a lab report (with metric tags) | +60 XP | Only if ≥1 metric tagged |
| First metric logged in a new category | +30 XP | One-time per category (6 max) |
| 7-day logging streak | +75 XP bonus | On the 7th consecutive day |
| 30-day logging streak | +300 XP bonus | On the 30th consecutive day |
| Longevity Score improves ≥5 points | +200 XP | Compared to 30 days prior |
| Complete a weekly challenge | +100–250 XP | Varies by challenge difficulty |
| Refer a friend (Phase 3) | +500 XP | On their first consultation |

---

### 19.3 Health Tiers (Levels)

XP accumulates into tiers. Tiers unlock profile badges and (Phase 3) clinic perks.

| Tier | XP Range | Title | Badge Colour |
|---|---|---|---|
| 1 | 0 – 499 | Health Starter | Grey |
| 2 | 500 – 1,999 | Wellness Explorer | Bronze |
| 3 | 2,000 – 4,999 | Vitality Achiever | Silver |
| 4 | 5,000 – 12,499 | Longevity Champion | Gold |
| 5 | 12,500+ | Elite Longevity Athlete | Platinum |

**Tier display:** Dashboard header shows current tier badge + XP progress bar ("1,240 / 2,000 XP to Silver").

---

### 19.4 Streaks

| Streak Type | What Counts | Reset Condition | Bonus |
|---|---|---|---|
| Daily Metric Streak | ≥1 metric logged today | Miss any calendar day | +75 XP at 7d, +300 XP at 30d |
| Check-in Streak | Daily self-report completed | Miss any day | +50 XP at 7d |
| Attendance Streak | No no-shows in last 5 bookings | Any no-show | Badge: "Reliable Patient" |

**Streak Shield:** Users can earn 1 streak shield per month (gifted at tier 3+). Activating it forgives one missed day without breaking the streak. Must be manually activated before midnight of the missed day.

---

### 19.5 Badges & Achievements

Badges are permanent. They display on the user's Achievement Wall in the Profile tab.

#### Onboarding Badges
| Badge | Trigger |
|---|---|
| First Step | Log your first health metric |
| Complete Profile | Fill all profile fields (height, weight, goals, gender) |
| Full Matrix | Have at least 1 data point in all 6 diagnostic categories |

#### Habit Badges
| Badge | Trigger |
|---|---|
| Consistent | 7-day metric logging streak |
| Unstoppable | 30-day metric logging streak |
| Early Adopter | Log a metric before 9am on 5 separate days |
| Lab Warrior | Upload 5 lab reports with tagged metrics |
| Night Owl Tracker | Log sleep data for 14 consecutive nights |

#### Health Score Badges
| Badge | Trigger |
|---|---|
| Heart Health Hero | Cardiovascular score > 80 |
| Metabolic Master | Metabolic score > 80 |
| Sleep Champion | Sleep score > 80 for 7 consecutive nights |
| Recovery King/Queen | Recovery score > 80 |
| Sharp Mind | Cognitive score > 80 for 7 consecutive days |
| Longevity Legend | Overall Longevity Score > 80 |
| Score Booster | Improve overall score by ≥10 points in 60 days |

#### Clinic Engagement Badges
| Badge | Trigger |
|---|---|
| First Consult | Complete first physician consultation |
| Regular Patient | Complete 5 consultations |
| Therapy Explorer | Try 3 different therapy types |
| Dedicated Patient | Complete 10 total clinic sessions (consults + therapies) |
| Reliable Patient | No no-shows across 5 consecutive bookings |

#### Milestone Badges
| Badge | Trigger |
|---|---|
| 1 Month Strong | 1 month since signup |
| Quarter Champion | 3 months since signup |
| Half Year Hero | 6 months since signup |
| Level Up | Reach each new tier (5 badges total) |

> **Badge design note:** Each badge has a name, icon (SF Symbols / custom SVG), short description, and earned date. Locked badges are shown as greyed silhouettes — visible but unreachable — to drive aspiration.

---

### 19.6 Weekly Challenges

Challenges reset every Monday at 00:00. Users have one active challenge set per week (3 challenges max simultaneously).

#### Challenge Sources

**1. App-Generated (algorithm-driven)**
The system looks at the user's lowest-scoring diagnostic category and generates a targeted challenge:
- Lowest: Sleep → "Log your sleep every night this week"
- Lowest: Metabolic → "Log your weight every day for 7 days"
- Lowest: Cardiovascular → "Measure your resting heart rate 5 times this week"

**2. Physician-Assigned**
After a consultation, physician can assign a custom challenge with:
- Challenge title (free text)
- Target metric + target value (optional)
- Due date (default: 7 days)
- Example: "Maintain blood pressure below 130/85 this week — log daily"

#### Challenge Difficulty & XP

| Difficulty | Example | XP Reward |
|---|---|---|
| Easy | Log 3 metrics this week | +100 XP |
| Medium | 7-day sleep logging streak | +175 XP |
| Hard | Cardiovascular score > 70 by Sunday | +250 XP |
| Physician-Set | Custom goal (any) | +200 XP flat |

#### Challenge States
`active` → `completed` (auto-detected) → XP credited + badge if milestone  
`active` → `failed` (Monday rollover, incomplete) → no XP, replaced by new challenge

---

### 19.7 Celebrations & Feedback Moments

Gamification only works if the user feels the reward. These are the micro-moments:

| Moment | UI Treatment |
|---|---|
| Metric logged | Subtle confetti burst + "+10 XP" floating chip |
| Badge earned | Full-screen modal: badge icon + name + "Share" button |
| Streak milestone (7d/30d) | Animated fire emoji streak counter + bonus XP toast |
| Level up (tier change) | Full-screen celebration with new tier badge reveal |
| Challenge completed | Green checkmark animation + XP credited toast |
| Longevity Score improves | Dashboard score ring animates to new value |
| Score reaches 50 / 60 / 70 / 80 / 90 | One-time milestone modal with encouragement copy |

**Tone of copy:** Clinical but warm. Never childish. Examples:
- "You've logged your metrics for 7 days straight. That consistency is rare — and it's working."
- "Cardiovascular Hero unlocked. Your heart health score crossed 80 for the first time."
- Not: "WOW YOU DID IT!!! 🎉🎊" — avoid this.

---

### 19.8 Gamification on the Dashboard

The dashboard header becomes the "command centre" of gamification:

```
┌───────────────────────────────────────────┐
│  Good morning, Hemang                     │
│                                           │
│  [🥈 Silver]  ████████░░  1,240 / 2,000  │
│               XP to Longevity Champion    │
│                                           │
│  🔥 12-day streak   ⚡ 2 challenges active │
└───────────────────────────────────────────┘
```

- Tier badge (tappable → goes to Achievement Wall)
- XP progress bar to next tier
- Streak counter (tappable → streak history)
- Active challenge count (tappable → challenges screen)

---

### 19.9 Gamification in the Profile Tab

**Achievement Wall:**
- Grid of all badges: earned (coloured + date) vs locked (greyed silhouette + hint text)
- Tap earned badge → modal with badge story + earned date
- Tap locked badge → "How to earn: Complete 5 consultations"

**Stats Summary:**
- Total XP earned all-time
- Current streak + longest streak ever
- Total sessions attended (consults + therapies)
- Badges earned: X / total

**Leaderboard (Phase 3):**
- Anonymous ranking within the clinic's patient base
- "You're in the top 15% of Longevity Champions"
- Opt-in only, never default-on

---

### 19.10 Admin: Gamification Controls

On `PatientDetailPage.tsx`, new **Gamification tab**:
- View patient's XP, tier, streak, badges earned
- Assign a custom challenge (title, target, due date)
- View patient's challenge history (completed vs failed)
- Grant a "bonus XP" award (with reason — e.g., "Exceptional commitment to therapy plan") — admin-only action, logged in audit trail

---

### 19.11 Database Schema — Gamification Tables

#### `user_xp`
```sql
uuid           UUID PK FK → users
total_xp       INT DEFAULT 0
current_tier   INT DEFAULT 1      -- 1-5
updated_at     TIMESTAMPTZ
```

#### `user_streaks`
```sql
uuid                UUID PK FK → users
metric_streak       INT DEFAULT 0   -- current daily metric logging streak
checkin_streak      INT DEFAULT 0   -- daily self-report streak
longest_metric_streak INT DEFAULT 0
last_metric_logged  DATE
last_checkin        DATE
streak_shield_available BOOLEAN DEFAULT false
streak_shield_used_month TEXT       -- YYYY-MM, one per month
```

#### `badges`
```sql
id           UUID PK
key          TEXT UNIQUE     -- e.g. 'heart_health_hero'
name         TEXT
description  TEXT
category     TEXT            -- 'onboarding' | 'habit' | 'health_score' | 'clinic' | 'milestone'
icon_name    TEXT            -- SF Symbol or asset key
difficulty   TEXT            -- 'easy' | 'medium' | 'hard'
xp_reward    INT DEFAULT 0
```
Seeded table — read-only at runtime.

#### `user_badges`
```sql
id           UUID PK
patient_uuid UUID FK → users
badge_id     UUID FK → badges
earned_at    TIMESTAMPTZ
awarded_by   UUID FK → admin_users  -- NULL if auto-awarded
```
RLS: Patient sees own; admin sees all.

#### `challenges`
```sql
id             UUID PK
title          TEXT
description    TEXT
difficulty     TEXT         -- 'easy' | 'medium' | 'hard' | 'physician_set'
xp_reward      INT
target_metric  TEXT         -- metric_key, nullable
target_value   NUMERIC      -- nullable
duration_days  INT DEFAULT 7
is_system      BOOLEAN      -- true = app-generated, false = physician-created
created_by     UUID FK → admin_users  -- NULL if system
```

#### `user_challenges`
```sql
id              UUID PK
patient_uuid    UUID FK → users
challenge_id    UUID FK → challenges
assigned_at     TIMESTAMPTZ
due_at          TIMESTAMPTZ
status          TEXT    -- 'active' | 'completed' | 'failed'
completed_at    TIMESTAMPTZ
xp_credited     BOOLEAN DEFAULT false
```
RLS: Patient sees own; admin sees all.

#### `xp_ledger`
```sql
id             UUID PK
patient_uuid   UUID FK → users
amount         INT         -- positive = earned, negative = N/A for now
reason         TEXT        -- e.g. 'metric_logged' | 'badge_earned' | 'challenge_completed' | 'admin_bonus'
reference_id   UUID        -- optional: links to the triggering entity
created_at     TIMESTAMPTZ
```
Audit trail for every XP change. Used to reconstruct total_xp if ever out of sync.

---

### 19.12 Backend Logic (FastAPI / Edge Function)

**`award-xp` utility function** (called internally, not a public endpoint):
```
Input: patient_uuid, amount, reason, reference_id
1. INSERT into xp_ledger
2. UPDATE user_xp SET total_xp = total_xp + amount
3. Recalculate tier from new total_xp
4. If tier changed → INSERT into user_badges (level_up_tier_N badge) + send FCM push
```

**`check-badge-eligibility`** (called after every significant action):
```
Input: patient_uuid, trigger_event
1. Fetch all badges patient hasn't earned yet
2. For each: evaluate eligibility condition against current DB state
3. Award all newly eligible badges via award-xp + user_badges INSERT
4. Send FCM push for each new badge
```

**`process-challenge-completion`** (runs nightly + on metric update):
```
1. Fetch all active user_challenges due today or overdue
2. For each: check if target_metric/target_value condition is met
3. If met → mark completed, call award-xp
4. If overdue and not met → mark failed
5. Generate new challenges for users with < 3 active
```

---

### 19.13 Gamification Roadmap

| Task | Priority | Effort |
|---|---|---|
| DB tables: user_xp, user_streaks, badges seed, user_badges, xp_ledger | P0 | M |
| award-xp utility + badge eligibility checker | P0 | M |
| XP award on metric log, consultation complete, therapy complete | P0 | M |
| Streak tracking (daily metric + check-in) | P0 | M |
| Dashboard gamification header (tier badge + XP bar + streak) | P0 | L |
| Badge seed data (all badges defined) | P0 | S |
| Achievement Wall in Profile tab | P1 | M |
| Badge award modal (full-screen celebration) | P1 | M |
| Weekly challenge engine (app-generated) | P1 | L |
| Challenge screen + active challenge cards on dashboard | P1 | M |
| Physician-assigned challenges (admin UI) | P1 | M |
| Admin gamification tab on PatientDetailPage | P1 | S |
| Streak shield mechanic | P2 | S |
| Leaderboard (opt-in, anonymous) | P3 | L |
| Social badge sharing (native share sheet) | P3 | M |
| Clinic perks tied to tier (Phase 3 — e.g., discount on therapy) | P3 | L |

---

## 20. Backend — Python FastAPI Plan

> **Decision:** The Supabase Edge Functions (Deno) are replaced by a Python FastAPI service running as a dedicated Docker container. Supabase retains PostgreSQL, Auth (JWT), Storage, and Realtime. FastAPI handles all business logic, health scoring, integrations, background tasks, and gamification engine.

> **Rationale:** Python's scientific ecosystem (numpy, scipy) is far better suited to the health scoring engine than Deno/TypeScript. FastAPI gives us auto-generated Swagger docs, better testability (pytest-asyncio), native async background tasks, and a richer library ecosystem for SMS, FCM, Agora token generation, and Fitbit OAuth.

---

### 20.1 Architecture

```
Mobile App (Expo)  +  Admin Web (React)
            │
            ▼
        Nginx :8080
       ┌──────────────────────┐
       │  /api/*  → FastAPI   │  :8000
       │  /admin/ → Admin App │  :3000
       │  /       → Mobile    │  :8081
       └──────────────────────┘
            │
    ┌───────┴───────┐
    │               │
FastAPI          Supabase
:8000            PostgreSQL (DB)
│                Auth (JWT)
├─ Scoring       Storage (files)
├─ Agora         Realtime (subscriptions)
├─ Zoom
├─ FCM
├─ SMS
├─ Fitbit OAuth
└─ APScheduler
   (background jobs)
```

---

### 20.2 Project Structure

```
apps/api/
├── app/
│   ├── main.py                  # FastAPI app, lifespan, routers
│   ├── config.py                # pydantic-settings env vars
│   ├── dependencies.py          # shared FastAPI dependencies
│   ├── core/
│   │   ├── auth.py              # Supabase JWT verification
│   │   ├── database.py          # asyncpg connection pool
│   │   └── storage.py           # Supabase Storage signed URLs
│   ├── routers/
│   │   ├── health_metrics.py    # CRUD for health_metrics
│   │   ├── diagnostics.py       # matrix scoring endpoints
│   │   ├── consultations.py     # booking, join, reschedule
│   │   ├── therapies.py         # catalogue + slot booking
│   │   ├── payments.py          # QR flow + admin verification
│   │   ├── reports.py           # session report upload + metric tagging
│   │   ├── video_sessions.py    # Agora token + Zoom meeting
│   │   ├── gamification.py      # XP, badges, streaks, challenges
│   │   ├── notifications.py     # FCM push + SMS OTP
│   │   └── admin.py             # physician mgmt, patients, slots
│   ├── services/
│   │   ├── scoring/
│   │   │   ├── cardiovascular.py
│   │   │   ├── metabolic.py
│   │   │   ├── sleep.py
│   │   │   ├── recovery.py
│   │   │   ├── cognitive.py
│   │   │   └── longevity_index.py
│   │   ├── gamification.py      # award_xp, check_badges, process_challenges
│   │   ├── agora.py             # RTC token generation (HMAC-SHA256)
│   │   ├── zoom.py              # Server-to-Server OAuth + meeting creation
│   │   ├── fcm.py               # Firebase push notifications
│   │   ├── sms.py               # OTP delivery
│   │   └── fitbit.py            # OAuth2 + Web API data pull
│   └── tasks/
│       ├── scheduler.py         # APScheduler setup
│       ├── reminders.py         # daily FCM reminders
│       ├── noshow.py            # every-5-min no-show detection
│       └── challenge_engine.py  # nightly challenge eval + generation
├── tests/
│   ├── test_scoring.py
│   ├── test_gamification.py
│   └── test_payments.py
├── Dockerfile
├── requirements.txt
└── pyproject.toml
```

---

### 20.3 Full API Endpoint Reference

#### Auth (validates Supabase JWT — no separate login)
All endpoints require `Authorization: Bearer <supabase_jwt>` header.

#### Health Metrics
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/metrics` | Patient | All metrics grouped by category |
| POST | `/api/v1/metrics` | Patient | Log new metric entry |
| GET | `/api/v1/metrics/{key}/history` | Patient | History for one metric (date range optional) |
| DELETE | `/api/v1/metrics/{id}` | Patient | Delete own metric entry |

#### Diagnostics
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/diagnostics/matrix` | Patient | Full 6-category matrix + longevity score |
| GET | `/api/v1/diagnostics/matrix/{category}` | Patient | Single category score + components |
| GET | `/api/v1/diagnostics/trajectory` | Patient | Score delta vs 30/60/90 days ago |

#### Consultations
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/consultations` | Patient | My consultations list |
| POST | `/api/v1/consultations` | Patient | Book a slot |
| GET | `/api/v1/consultations/{id}` | Patient | Single consultation detail |
| PATCH | `/api/v1/consultations/{id}/cancel` | Patient | Cancel (>24h before slot) |
| PATCH | `/api/v1/consultations/{id}/reschedule` | Patient | Change slot (max 2x) |
| POST | `/api/v1/consultations/{id}/join` | Patient | Get Agora token or Zoom link |

#### Therapies
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/therapies` | Patient | Therapy catalogue (filter: pricing_tier) |
| GET | `/api/v1/therapies/{id}/slots` | Patient | Available therapy slots |
| POST | `/api/v1/therapy-bookings` | Patient | Book therapy slot (atomic capacity check) |
| GET | `/api/v1/therapy-bookings` | Patient | My therapy bookings |
| PATCH | `/api/v1/therapy-bookings/{id}/cancel` | Patient | Cancel + release slot |

#### Payments
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/payment/qr` | Patient | Active payment QR + UPI ID |
| POST | `/api/v1/payment/submit` | Patient | Submit screenshot + transaction ID |
| GET | `/api/v1/payment/my-verifications` | Patient | My payment history |
| GET | `/api/v1/admin/payments/pending` | Admin/Staff | Pending verifications queue |
| PATCH | `/api/v1/admin/payments/{id}/approve` | Admin/Staff | Approve → confirm booking + FCM |
| PATCH | `/api/v1/admin/payments/{id}/reject` | Admin/Staff | Reject with reason + FCM |
| POST | `/api/v1/admin/payment-config` | Admin | Upload new payment QR |

#### Session Reports
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/admin/reports` | Physician/Admin | Upload session report |
| POST | `/api/v1/admin/reports/{id}/tag-metrics` | Physician/Admin | Tag metric values → feeds matrix |
| GET | `/api/v1/my/reports` | Patient | My reports (visible_to_patient=true) |
| GET | `/api/v1/my/reports/{id}/download` | Patient | Signed URL (60-min TTL) |

#### Video Sessions
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/video/agora-token` | Patient | Generate Agora RTC token |
| POST | `/api/v1/video/zoom-meeting` | Admin/Physician | Create Zoom meeting, store link |

#### Gamification
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/gamification/me` | Patient | XP, tier, streaks, badge count |
| GET | `/api/v1/gamification/badges` | Patient | All badges (earned + locked) |
| GET | `/api/v1/gamification/challenges` | Patient | Active + completed challenges |
| POST | `/api/v1/gamification/checkin` | Patient | Daily cognitive self-report → XP |
| GET | `/api/v1/gamification/xp-history` | Patient | XP ledger history |
| POST | `/api/v1/admin/challenges` | Physician/Admin | Assign challenge to patient |
| POST | `/api/v1/admin/gamification/{uuid}/bonus-xp` | Admin | Grant bonus XP with reason |

#### Notifications
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/notifications/otp` | Public | Send SMS OTP for auth |
| POST | `/api/v1/admin/notifications/push` | Admin | Manual push to patient(s) |

#### Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/admin/physicians` | Super Admin | Create physician auth + record |
| GET | `/api/v1/admin/patients` | Admin/Staff | Paginated patient list + search |
| GET | `/api/v1/admin/patients/{uuid}` | Admin/Physician | Patient full detail |
| GET | `/api/v1/admin/patients/{uuid}/metrics` | Physician | Raw clinical metrics view |
| POST | `/api/v1/admin/slots` | Admin/Staff | Bulk create consultation slots |
| GET | `/api/v1/admin/slots` | Admin/Staff | List slots (filter: physician, date, status) |
| PATCH | `/api/v1/admin/slots/{id}` | Admin/Staff | Update slot status |

---

### 20.4 Background Tasks (APScheduler)

| Job | Interval | Logic |
|---|---|---|
| `mark_noshow_consultations` | Every 5 min | UPDATE consultations to `no_show` if slot passed by 10+ min and still `scheduled`. Frees slot. |
| `send_daily_reminders` | Daily 8:00 AM | Fetch consultations + therapy bookings in next 24h. Send FCM to each patient. |
| `process_challenges` | Daily 00:05 AM | Evaluate all active challenges. Mark completed/failed. Generate new challenges for users with < 3 active. Award XP for completions. |
| `sync_fitbit_data` | Daily 3:00 AM | For users with Fitbit OAuth tokens, pull last 24h data → upsert into health_metrics. |
| `refresh_streaks` | Daily 00:01 AM | Check all users: if `last_metric_logged` < today → reset metric_streak to 0. |

---

### 20.5 Tech Stack

| Concern | Library | Version |
|---|---|---|
| Framework | FastAPI | ≥ 0.110 |
| Server | Uvicorn + Gunicorn | ≥ 0.29 |
| Database | asyncpg (raw SQL) | ≥ 0.29 |
| Validation | Pydantic v2 | ≥ 2.7 |
| Config | pydantic-settings | ≥ 2.2 |
| Auth | python-jose | ≥ 3.3 |
| HTTP client | httpx (async) | ≥ 0.27 |
| Storage | supabase-py (Storage only) | ≥ 2.4 |
| Scheduling | APScheduler | ≥ 3.10 |
| Scoring math | numpy | ≥ 1.26 |
| File handling | python-multipart, Pillow | latest |
| Testing | pytest + pytest-asyncio | latest |

---

### 20.6 Docker Compose Addition

```yaml
api:
  build:
    context: apps/api
    dockerfile: Dockerfile
  expose:
    - "8000"
  environment:
    - DATABASE_URL
    - SUPABASE_URL
    - SUPABASE_SERVICE_ROLE_KEY
    - SUPABASE_JWT_SECRET
    - AGORA_APP_ID
    - AGORA_APP_CERTIFICATE
    - ZOOM_ACCOUNT_ID
    - ZOOM_CLIENT_ID
    - ZOOM_CLIENT_SECRET
    - FCM_SERVER_KEY
    - SMS_API_KEY
    - SMS_API_URL
    - FITBIT_CLIENT_ID
    - FITBIT_CLIENT_SECRET
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
  networks:
    - longevity
```

**Nginx update** — add upstream block:
```nginx
location /api/ {
    proxy_pass http://api:8000/;
    proxy_set_header Authorization $http_authorization;
}
```

---

### 20.7 FastAPI Roadmap

| Task | Priority | Effort |
|---|---|---|
| FastAPI app skeleton + config + auth middleware | P0 | S |
| asyncpg pool + DB helpers | P0 | S |
| Health metrics router (CRUD) | P0 | M |
| Diagnostics router + scoring engine (all 6 systems) | P0 | L |
| Consultations router (book, cancel, reschedule, join) | P0 | M |
| Therapies router (catalogue, slot booking, atomic capacity) | P0 | M |
| Payments router (QR flow + admin verification) | P0 | M |
| Agora token generation service | P0 | M |
| APScheduler setup + no-show job | P0 | S |
| Gamification engine (XP, badges, streaks) | P1 | L |
| Gamification router (all endpoints) | P1 | M |
| Session reports router + metric tagging → matrix feed | P1 | M |
| Zoom meeting creation service | P1 | M |
| FCM push service + daily reminders job | P1 | M |
| SMS OTP service | P1 | S |
| Admin router (patients, physicians, slots) | P1 | L |
| Challenge engine (generation + evaluation) | P2 | L |
| Fitbit OAuth + daily sync job | P2 | XL |
| Pytest suite (scoring + gamification + payments) | P1 | M |
| Dockerfile + docker-compose wiring | P0 | S |

---

## 21. AI Wellness Companion — Privacy-First Design

> **Feature:** An AI-powered activity companion that monitors step progress, detects when a user is falling behind on their weekly gamified goals, and proactively delivers a personalised nudge: an encouraging message, a dietician-approved food tip, and a curated music suggestion — all without the AI model ever knowing who the patient is.
>
> **AI Model:** OpenAI `gpt-4o-mini` (current best cost-efficient option). Swap to the latest OpenAI mini model at build time. Estimated cost: ~$0.15 / 1M input tokens → negligible even at 1,000 calls/day.
>
> **Privacy guarantee:** The AI model is a stateless, blind suggestion engine. It receives anonymised health signals only. It never receives name, email, UUID, exact age, location, or any cross-session history.

---

### 21.1 What the Feature Does

```
User is at 38% of daily step goal at 2pm
              │
              ▼
App detects: "at risk of missing daily goal + weekly challenge"
              │
              ▼
AI Companion fires a nudge card in-app + push notification:

┌─────────────────────────────────────────────────────┐
│  🚶 You're 6,200 steps away — a 35-min walk does it │
│                                                     │
│  🍌 Fuel up first: a banana 30 min before a walk   │
│     improves endurance — your dietician recommends  │
│     it for your energy goals.                       │
│                                                     │
│  🎵 Afternoon Power Walk Mix  [Open in Spotify →]  │
│                                                     │
│  [Start Walk  →]    [Remind me later]              │
└─────────────────────────────────────────────────────┘
```

**"Start Walk" CTA** opens the in-app map view showing a suggested walking route near the user's last known location that covers the remaining step distance.

---

### 21.2 Step Tracking Architecture

Two complementary inputs, both feeding `health_metrics` with `metric_type = 'steps'`:

#### A. Mobile Sensors (Primary)
- **Library:** `expo-sensors` → `Pedometer` API
  - iOS: wraps `CMPedometer` (CoreMotion) — highly accurate
  - Android: wraps `TYPE_STEP_COUNTER` hardware sensor
- Always-on background counting during the day
- Syncs step count to `health_metrics` every 30 minutes via background task
- No GPS required for step counting

#### B. Google Maps / GPS (Route Suggestion Layer)
- **Library:** `react-native-maps` (Google Maps provider) + `expo-location`
- GPS is **session-only** — only active when user taps "Start Walk"
- Google Directions API (walking mode) → calculates a nearby loop matching remaining step distance
- Shows route on map with estimated steps + time
- GPS coordinates are **never stored** — only step count result is saved
- After walk ends: final step delta synced to `health_metrics`

#### Daily Step Target
- Default: 10,000 steps/day
- Adjustable in user profile settings
- Weekly challenge can override (e.g., "Hit 70,000 steps this week")
- Progress visible on dashboard as a ring/progress bar alongside other gamification elements

---

### 21.3 Nudge Trigger Logic

The companion fires only when the data says something actionable. Max **2 nudges per day** per user (hard cap). No nudge between 10pm–7am.

| Trigger | Condition | Nudge Type |
|---|---|---|
| Afternoon lag | < 40% of daily target by 2:00 PM | "You have time — here's how to catch up" |
| Evening last chance | < 60% of daily target by 7:00 PM | "One walk left in the day" |
| Weekly challenge at risk | < 50% of weekly target by Wednesday | "You're behind — here's your mid-week plan" |
| Streak about to break | 0 steps logged, streak > 3 days | "Don't break your X-day streak" |
| 2-day inactivity | No steps logged for 2 consecutive days | "We haven't seen you move — let's fix that" |
| Post-meal energy window | User logs a meal (Phase 3) + 45 min passes | "Good time for a walk — digestion + steps" |

**Anti-spam rules:**
- Never fire 2 nudges within 3 hours of each other
- If user dismissed last nudge, wait 24h before next
- Respect `notifications.steps_nudge = false` in user preferences

---

### 21.4 Privacy Architecture (Full)

```
┌──────────────────────────────────────────────────────────────────┐
│                      MOBILE APP (Client)                         │
│                                                                  │
│  Pedometer (always-on) + GPS (session-only, not stored)         │
│  Local progress calculation                                      │
│  Request body contains ONLY: step_count, time_of_day,           │
│  streak_count — no PII constructed client-side                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │  TLS 1.3  +  Supabase JWT
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                FastAPI — PRIVACY PROXY                           │
│                                                                  │
│  STEP 1 — Identity Gate                                         │
│    Validate Supabase JWT → resolve patient UUID (stays here)    │
│    Check ai_companion_consent = true (opt-in required)          │
│    Rate limit: max 2 calls/user/day                             │
│                                                                  │
│  STEP 2 — Fetch Health Context (server-side, UUID-scoped)       │
│    Pull: health_metrics, user_xp, user_streaks,                 │
│           user_challenges, users (age, sex, goals only)         │
│    Fetch: 3–5 tip candidates from dietician_tips (tag-matched)  │
│    Fetch: 2–3 playlist candidates from curated_playlists        │
│                                                                  │
│  STEP 3 — Anonymisation Pipeline                                │
│    DROP:    name, email, phone, UUID, device_id, IP             │
│    REPLACE: UUID → ephemeral token                              │
│             HMAC-SHA256(UUID + date + SERVER_SECRET)            │
│             Rotates daily. OpenAI cannot reverse it.            │
│    BRACKET: age 34 → "30–40"                                    │
│    STRIP:   GPS coordinates (not needed for suggestion)         │
│    ROUND:   step count 8,432 → 8,400 (nearest 100)             │
│    MINIMISE: only send fields relevant to THIS nudge type       │
│                                                                  │
│  STEP 4 — OpenAI API Call (gpt-4o-mini)                        │
│    System prompt: blind suggestion engine, never invent tips,   │
│                   never ask for or infer PII                    │
│    Payload: see §21.5                                           │
│    Response: { message, tip_id, playlist_id, walk_minutes }     │
│    Stateless: no conversation history, no thread ID             │
│                                                                  │
│  STEP 5 — Reconstruct Response                                  │
│    Map tip_id → full tip text from dietician_tips DB           │
│    Map playlist_id → full playlist from curated_playlists DB   │
│    Build walk route suggestion (Google Directions API call)     │
│                                                                  │
│  STEP 6 — Audit Log (server-side only, never sent to OpenAI)   │
│    Log: patient_uuid, request_type, tip_id, playlist_id,        │
│         ephemeral_token_hash, timestamp                         │
│    Do NOT log: anonymised payload sent outbound                 │
│    Do NOT log: raw OpenAI response text                         │
└─────────────────────────────┬────────────────────────────────────┘
                              │  Zero PII past this boundary
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   OpenAI API (gpt-4o-mini)                       │
│                                                                  │
│  RECEIVES:                                                       │
│    age_group: "30–40"                                           │
│    sex: "male"                                                   │
│    health_goals: ["longevity", "cardiovascular"]                │
│    time_of_day: "afternoon"                                      │
│    day_of_week: "Wednesday"                                      │
│    step_progress: { current: 3800, target: 10000, pct: 38 }     │
│    weekly_challenge: { at_risk: true, days_remaining: 4 }       │
│    streak: { current: 12, at_risk_today: true }                 │
│    weakest_category: "metabolic"                                 │
│    tip_candidates: [ {id, text}, {id, text}, {id, text} ]       │
│    playlist_candidates: [ {id, name, bpm}, {id, name, bpm} ]    │
│                                                                  │
│  NEVER RECEIVES:                                                 │
│    ✗ name  ✗ email  ✗ phone  ✗ UUID  ✗ location                │
│    ✗ exact age  ✗ IP address  ✗ device ID                       │
│    ✗ any cross-session history                                   │
│                                                                  │
│  RETURNS:                                                        │
│    { message: str, tip_id: str,                                 │
│      playlist_id: str, walk_minutes: int }                      │
└──────────────────────────────────────────────────────────────────┘
```

---

### 21.5 OpenAI Payload & System Prompt

#### System Prompt (sent with every call)
```
You are a wellness coaching assistant for a longevity health app.
You receive anonymised health data. You do not know who this person is.
You must NEVER ask for or attempt to infer personal identifiers.

Your task:
1. Write ONE encouraging message (max 2 sentences, warm but clinical, never preachy).
2. Select the single most relevant food tip from the tip_candidates list provided.
   Return its id only. Do NOT invent or modify tips.
3. Select the single most relevant playlist from playlist_candidates.
   Return its id only.
4. Suggest a walk duration in minutes to close the step gap.

Respond in JSON only:
{ "message": str, "tip_id": str, "playlist_id": str, "walk_minutes": int }
```

#### Example Anonymised Payload
```json
{
  "age_group": "30–40",
  "sex": "male",
  "health_goals": ["longevity", "cardiovascular"],
  "time_of_day": "afternoon",
  "day_of_week": "Wednesday",
  "step_progress": { "current": 3800, "target": 10000, "pct": 38 },
  "weekly_challenge": { "type": "step_goal", "at_risk": true, "days_remaining": 4 },
  "streak": { "current_days": 12, "at_risk_today": true },
  "weakest_category": "metabolic",
  "tip_candidates": [
    { "id": "tip_18", "text": "A banana 30 min before a walk improves endurance — steady energy without a glucose spike." },
    { "id": "tip_42", "text": "A small handful of almonds provides sustained energy for walks up to 45 minutes." },
    { "id": "tip_67", "text": "250ml of water before your walk improves endurance and reduces fatigue." }
  ],
  "playlist_candidates": [
    { "id": "pl_5", "name": "Afternoon Power Walk", "bpm": 125 },
    { "id": "pl_12", "name": "Sunset Stride Mix", "bpm": 118 }
  ]
}
```

#### Example Response from gpt-4o-mini
```json
{
  "message": "You're at 38% with a full afternoon ahead — a 35-minute walk gets you there and keeps your 12-day streak alive.",
  "tip_id": "tip_18",
  "playlist_id": "pl_5",
  "walk_minutes": 35
}
```

---

### 21.6 Dietician Content Pipeline (Admin)

The dietician (or admin) populates the tip pool via admin panel. AI only selects — never invents.

**New Admin Page: `DietitianContentPage.tsx`**
- CRUD for `dietician_tips`
- CRUD for `curated_playlists`
- Each tip requires: tip text, time_of_day tags, goal tags, health category tags, active toggle
- Tip must be marked `active = true` to enter the candidate pool
- All tips reviewed and approved by in-company dietician before activation

**Tip tagging example:**
```
Tip: "A banana 30 min before a walk improves endurance"
time_of_day: [morning, afternoon]
goal_tags:   [energy, cardiovascular, endurance]
health_cat:  [metabolic, cardiovascular]
active:      true
```

**Playlist tagging example:**
```
Name: "Afternoon Power Walk"
URL:  spotify:playlist:37i9dQZF1DX76Wlfdnj7AP
Platform: spotify
mood_tags: [energising, walking, upbeat]
bpm_range: [120, 130]
active: true
```

---

### 21.7 Music Integration (Option A — Phase 1)

Pre-curated playlist links managed by admin. No Spotify OAuth required from user.

- Playlist cards shown in the nudge with platform icon + deep-link
- `spotify://playlist/...` deep-links open Spotify app directly if installed
- Falls back to `https://open.spotify.com/playlist/...` in browser
- Admin can add YouTube Music / Apple Music links alongside Spotify

**Option B (Phase 3):** Spotify Web API integration — user authenticates with Spotify, app fetches real-time playlist recommendations matched by BPM to target heart rate zone.

---

### 21.8 In-App Map View ("Start Walk")

When user taps "Start Walk" on a nudge card:

```
┌─────────────────────────────────────────────┐
│  Today's Walk Route                         │
│  ┌─────────────────────────────────────┐   │
│  │  [Google Map]                       │   │
│  │  📍 You are here                    │   │
│  │  ──────────────────                 │   │
│  │  Suggested loop: 2.1km             │   │
│  │  Estimated steps: 2,800            │   │
│  │  Estimated time: 28 min            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  🎵 Now playing: Afternoon Power Walk       │
│                                             │
│  Steps today: 3,800 → goal: 10,000         │
│  Progress bar ████░░░░░░░░  38%            │
│                                             │
│  [ Start  ]          [ Different Route ]   │
└─────────────────────────────────────────────┘
```

Route calculation: Google Directions API walking mode, circular route from current location, target distance = `(remaining_steps × 0.762m per step)` metres.

Live step counter updates on screen during the walk. When target reached: celebration animation + XP credited.

---

### 21.9 Database Schema Additions

#### `users` table — add column
```sql
ALTER TABLE users ADD COLUMN ai_companion_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN steps_daily_target INT DEFAULT 10000;
```

#### `dietician_tips`
```sql
id              UUID PK
tip_text        TEXT
time_of_day     TEXT[]     -- 'morning' | 'afternoon' | 'evening'
goal_tags       TEXT[]     -- 'energy' | 'weight_loss' | 'recovery' | 'endurance'
health_categories TEXT[]   -- 'metabolic' | 'cardiovascular' | 'sleep'
active          BOOLEAN DEFAULT false
created_by      UUID FK → admin_users
created_at      TIMESTAMPTZ
```
RLS: Authenticated users can SELECT active tips. Admin can INSERT/UPDATE.

#### `curated_playlists`
```sql
id              UUID PK
name            TEXT
url             TEXT        -- Spotify / YouTube / Apple Music URL
platform        TEXT        -- 'spotify' | 'youtube_music' | 'apple_music'
mood_tags       TEXT[]      -- 'energising' | 'recovery' | 'focus' | 'walking'
bpm_min         INT
bpm_max         INT
active          BOOLEAN DEFAULT false
created_by      UUID FK → admin_users
```
RLS: Authenticated users SELECT active. Admin INSERT/UPDATE.

#### `ai_companion_log`
```sql
id                    UUID PK
patient_uuid          UUID FK → users   -- server-side only, never sent to OpenAI
request_type          TEXT              -- 'step_nudge' | 'weekly_check' | 'reengagement'
tip_id                UUID FK → dietician_tips
playlist_id           UUID FK → curated_playlists
ephemeral_token_hash  TEXT              -- SHA256 of the token sent (for forensics only)
nudge_opened          BOOLEAN DEFAULT false   -- did user tap the card?
walk_started          BOOLEAN DEFAULT false   -- did user tap "Start Walk"?
requested_at          TIMESTAMPTZ
```
RLS: Admin SELECT all. Patient sees only own rows.

---

### 21.10 New FastAPI Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/ai-companion/nudge` | Patient | Trigger AI nudge (rate-limited, consent-gated) |
| GET | `/api/v1/ai-companion/history` | Patient | Past nudges received |
| PATCH | `/api/v1/ai-companion/nudge/{id}/opened` | Patient | Mark nudge as opened (analytics) |
| PATCH | `/api/v1/ai-companion/nudge/{id}/walk-started` | Patient | Mark walk started (analytics + XP trigger) |
| GET | `/api/v1/ai-companion/route` | Patient | Get suggested walking route (Google Directions) |
| POST | `/api/v1/ai-companion/consent` | Patient | Toggle AI companion opt-in |
| GET | `/api/v1/admin/dietician-tips` | Admin | List all tips |
| POST | `/api/v1/admin/dietician-tips` | Admin | Create tip |
| PATCH | `/api/v1/admin/dietician-tips/{id}` | Admin | Update / activate tip |
| DELETE | `/api/v1/admin/dietician-tips/{id}` | Admin | Deactivate tip |
| GET | `/api/v1/admin/playlists` | Admin | List all playlists |
| POST | `/api/v1/admin/playlists` | Admin | Add playlist |
| PATCH | `/api/v1/admin/playlists/{id}` | Admin | Update / activate playlist |

---

### 21.11 Gamification Integration

The AI Companion ties directly into §19:

| Action | XP | Notes |
|---|---|---|
| Open a nudge card | +5 XP | Curiosity reward |
| Start a walk from nudge | +15 XP | Engagement reward |
| Complete walk (hit step target) | +50 XP | Outcome reward |
| Hit daily step goal | +30 XP | Added to existing metric-log XP |
| Weekly step challenge completed (AI-assisted) | +200 XP | Challenge completion reward |

**New badges triggered by AI Companion usage:**
| Badge | Trigger |
|---|---|
| First Step (AI) | Complete a walk started from an AI nudge |
| Nudge Responder | Act on 5 AI nudges (open + start walk) |
| AI-Assisted Champion | Complete a weekly step challenge having used at least 3 nudges |

---

### 21.12 New Integrations Required

| Service | Purpose | Note |
|---|---|---|
| **OpenAI API** (`gpt-4o-mini`) | Nudge generation | Upgrade to latest mini model at build time |
| **Google Maps SDK** | In-app map display | `react-native-maps` with Google provider |
| **Google Directions API** | Walking route calculation | Server-side call from FastAPI |
| **Spotify deep-links** | Music playlist open | No OAuth needed for Phase 1 |

New env vars:
```
OPENAI_API_KEY
GOOGLE_MAPS_API_KEY          # mobile SDK
GOOGLE_DIRECTIONS_API_KEY    # server-side (can be same key)
```

---

### 21.13 Cost Estimate (OpenAI)

| Scenario | Calls/day | Tokens/call (est.) | Daily cost | Monthly cost |
|---|---|---|---|---|
| 100 active users | 200 | ~800 tokens | ~$0.03 | ~$0.90 |
| 500 active users | 1,000 | ~800 tokens | ~$0.14 | ~$4.20 |
| 2,000 active users | 4,000 | ~800 tokens | ~$0.56 | ~$16.80 |

Effectively negligible. gpt-4o-mini pricing: $0.15/1M input + $0.60/1M output tokens.

---

### 21.14 Roadmap

| Task | Priority | Effort |
|---|---|---|
| `dietician_tips` + `curated_playlists` + `ai_companion_log` tables | P0 | S |
| Seed initial tip set (10–15 tips, dietician-reviewed) | P0 | M |
| Seed initial playlist set (8–10 playlists) | P0 | S |
| FastAPI privacy proxy + anonymisation pipeline | P0 | L |
| OpenAI gpt-4o-mini integration + system prompt | P0 | M |
| Nudge trigger logic + rate limiting | P0 | M |
| FCM push for nudges | P0 | S |
| Nudge card UI (mobile) | P1 | M |
| Opt-in consent screen + settings toggle | P0 | S |
| In-app map view + route suggestion | P1 | L |
| Pedometer always-on sync to health_metrics | P1 | M |
| Gamification XP integration (walk completed) | P1 | S |
| Admin DietitianContentPage (tips + playlists CRUD) | P1 | M |
| Nudge analytics (opened / walk-started tracking) | P2 | S |
| Spotify Web API integration (Option B) | P3 | L |
| Post-meal walk trigger (Phase 3) | P3 | M |

---

## 22. Health Metrics Scoring Engine — Full Formulation

> **Source:** `health-metrics-formulation.md` — embedded here as the canonical formula reference.  
> **Status:** Draft — requires Chief Physician sign-off before production release.  
> **Audience:** Engineering, Clinical Advisory, Product.



## Table of Contents

1. [Overview and Scoring Philosophy](#1-overview-and-scoring-philosophy)
2. [Cardiovascular Health (0–100)](#2-cardiovascular-health-0100)
3. [Metabolic Fitness (0–100)](#3-metabolic-fitness-0100)
4. [Sleep Architecture (0–100)](#4-sleep-architecture-0100)
5. [Recovery Capacity (0–100)](#5-recovery-capacity-0100)
6. [Cognitive Performance (0–100)](#6-cognitive-performance-0100)
7. [Longevity Index (0–100)](#7-longevity-index-0100)
8. [Master Data Source Mapping Table](#8-master-data-source-mapping-table)
9. [Age-Bracket Reference Table](#9-age-bracket-reference-table)
10. [Implementation Notes](#10-implementation-notes)
11. [Scoring Disclaimer](#11-scoring-disclaimer)
12. [References](#12-references)

---

## 1. Overview and Scoring Philosophy

The Longevity scoring engine condenses a user's physiological and behavioral data into six domain scores, each normalized to a 0–100 integer scale. A composite **Longevity Index** is then derived as a weighted average of the six domains.

### Guiding Principles

| Principle | Detail |
|-----------|--------|
| Clinically anchored | Every threshold and weight maps to a peer-reviewed population norm or guideline |
| Transparent | All formulas are deterministic and auditable; no black-box ML in Phase 1 |
| Graceful degradation | Missing inputs lower confidence but do not zero a score; partial scores are computed from available sub-scores renormalized to 100 |
| Motivational framing | Scores trend toward improvement; a user who improves any sub-dimension sees movement within 24–48 h |
| Not diagnostic | All scores are wellness indicators; clinical decisions require physician interpretation |

### Phase Definitions

- **Phase 1 (MVP — Phone-Native):** Data sourced exclusively from Apple HealthKit, Google Health Connect, or manual user entry. No external hardware required.
- **Phase 2 (Wearable / CGM / Facility):** Adds continuous glucose monitors, chest-strap or wrist HRV monitors, Fitbit / Oura / Garmin integrations, and clinic-administered cognitive battery (COGBAT).

### General Piecewise Scaling Convention

Unless stated otherwise, each raw metric `x` is mapped to a sub-score `s ∈ [0, 100]` using a piecewise linear function of the form:

```
s(x) = clamp( 100 × (x − x_floor) / (x_optimal − x_floor), 0, 100 )   if x ≤ x_optimal
s(x) = clamp( 100 × (x_ceiling − x) / (x_ceiling − x_optimal), 0, 100 ) if x > x_optimal
```

Where:
- `x_floor` = value at which score = 0 (worst physiologically meaningful value)
- `x_optimal` = target value corresponding to score = 100
- `x_ceiling` = upper bound beyond which score = 0 again (for metrics with a U-shaped optimum)

All sub-scores are clamped to [0, 100] before weighting.

---

## 2. Cardiovascular Health (0–100)

### 2.1 Description and Clinical Rationale

Cardiovascular health is the single strongest predictor of all-cause mortality in longitudinal cohort studies. This domain captures four complementary dimensions: resting autonomic tone (RHR), heart rate variability as a proxy for parasympathetic nervous system function (HRV/SDNN), cardiorespiratory fitness (VO2 Max), and systemic arterial load (Blood Pressure). Together they represent both structural cardiac capacity and moment-to-moment autonomic regulation.

VO2 Max is age- and sex-adjusted because absolute milliliter values are not comparable across demographic groups; the Cooper Institute percentile table provides population-normed reference ranges. Blood Pressure thresholds follow the 2017 AHA/ACC Hypertension Guideline, which reclassified stage thresholds downward to reflect evidence of organ damage beginning below the prior 140/90 mmHg cutoff.

### 2.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| Resting Heart Rate | 25% | `HKQuantityTypeIdentifierHeartRate` (HealthKit resting sample) / `HeartRate` (Health Connect) / Manual |
| HRV — SDNN | 35% | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` / `HeartRateVariability` (Health Connect) / Chest strap |
| VO2 Max (age-sex adjusted) | 25% | `HKQuantityTypeIdentifierVO2Max` / Estimated (Health Connect) / Manual lab value |
| Blood Pressure | 15% | `HKCorrelationTypeIdentifierBloodPressure` (systolic + diastolic) / Manual / Fitbit Sense |

### 2.3 Raw Data Inputs

```
rhr_bpm          : float   — resting heart rate in beats per minute (overnight or 5-min supine)
sdnn_ms          : float   — SDNN in milliseconds (24-h or overnight window)
vo2max_ml_kg_min : float   — VO2 Max in mL/kg/min
sbp_mmhg         : integer — systolic blood pressure in mmHg
dbp_mmhg         : integer — diastolic blood pressure in mmHg
user_age         : integer — years
user_sex         : enum    — "male" | "female"
```

**Phase 1 availability:** RHR and HRV available from any modern iPhone (watchOS or HealthKit background samples). VO2 Max estimated by Apple Watch or manual entry. Blood Pressure manual entry only.

**Phase 2 additions:** SDNN from Polar H10 / Garmin HRV4Training; VO2 Max from VO2 Max lab test; ambulatory BP monitor integration.

### 2.4 Piecewise Scaling Formulas

#### 2.4.1 Resting Heart Rate Sub-Score (`s_rhr`)

Optimal resting heart rate for longevity is 50–60 bpm in non-athletes; below 40 signals bradycardia risk.

```
x = rhr_bpm

if x < 40:
    s_rhr = max(0, 100 × (x − 30) / (40 − 30))   # bradycardia penalty, linear from 30→40 bpm
elif 40 ≤ x ≤ 60:
    s_rhr = 100                                     # optimal zone
elif 60 < x ≤ 100:
    s_rhr = 100 × (100 − x) / (100 − 60)          # linear decline to 0 at 100 bpm
else:  # x > 100
    s_rhr = 0
```

#### 2.4.2 HRV / SDNN Sub-Score (`s_hrv`)

SDNN reference values are sex-agnostic but age-dependent. Use age-group lookup (Section 9) to obtain `sdnn_target` and `sdnn_floor`.

```
x        = sdnn_ms
x_opt    = sdnn_target[age_group]   # see Table 9.2
x_floor  = sdnn_floor[age_group]    # see Table 9.2

s_hrv = clamp(100 × (x − x_floor) / (x_opt − x_floor), 0, 100)
# HRV is monotonically beneficial within physiological range; no ceiling penalty applied
```

#### 2.4.3 VO2 Max Sub-Score (`s_vo2`) — Age/Sex Adjusted

Retrieve percentile from the Kaminsky/ACSM lookup table (reproduced in Section 9) for the user's age-sex group. Convert percentile to sub-score directly.

```
percentile = VO2MaxPercentile(vo2max_ml_kg_min, user_age, user_sex)  # Table 9.3
s_vo2 = percentile  # percentile is already 0–100
```

#### 2.4.4 Blood Pressure Sub-Score (`s_bp`)

Uses the 2017 AHA/ACC classification with a piecewise score mapped to the five categories.

```
# Determine AHA 2017 category from sbp and dbp (whichever drives the higher stage)
category = AHA2017Category(sbp_mmhg, dbp_mmhg)

AHA 2017 category thresholds (systolic / diastolic):
  Normal         : sbp < 120  AND dbp < 80
  Elevated       : sbp 120–129 AND dbp < 80
  Stage 1 HTN   : sbp 130–139 OR  dbp 80–89
  Stage 2 HTN   : sbp ≥ 140  OR  dbp ≥ 90
  Crisis         : sbp > 180  OR  dbp > 120

s_bp score mapping:
  Normal         → 100
  Elevated       →  75
  Stage 1 HTN   →  45
  Stage 2 HTN   →  15
  Crisis         →   0
```

### 2.5 Composite Cardiovascular Score

```
CV_score = round(
    0.25 × s_rhr  +
    0.35 × s_hrv  +
    0.25 × s_vo2  +
    0.15 × s_bp
)
```

**Partial score rule:** If any sub-score is unavailable, re-weight remaining sub-scores proportionally:

```
available_weight = sum of weights for available sub-scores
CV_score = round( sum(w_i × s_i for available i) / available_weight × 100 / 100 )
```

### 2.6 Age/Sex Adjustment Rules

- `s_vo2` is fully adjusted via the percentile table (Section 9.3); no additional adjustment needed.
- `s_hrv` uses age-group SDNN targets (Section 9.2); no sex adjustment (population norms are combined-sex for SDNN).
- `s_rhr` and `s_bp` are not age-adjusted; clinical thresholds are population-wide.

### 2.7 References

1. Kaminsky, L.A., Arena, R., Beckie, T.M., et al. (2013). The importance of cardiorespiratory fitness in the United States: the need for a national registry. *Circulation*, 127(5), 652–662. (Normative VO2 Max tables updated in Kaminsky et al., 2015, *Mayo Clinic Proceedings*.)
2. Shaffer, F., & Ginsberg, J.P. (2017). An overview of heart rate variability metrics and norms. *Frontiers in Public Health*, 5, 258.
3. Whelton, P.K., Carey, R.M., Aronow, W.S., et al. (2018). 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. *Journal of the American College of Cardiology*, 71(19), e127–e248.

---

## 3. Metabolic Fitness (0–100)

### 3.1 Description and Clinical Rationale

Metabolic fitness reflects how efficiently the body generates, stores, and utilizes energy. Poor metabolic fitness — characterized by excess adiposity, physical inactivity, and dysglycemia — is the root driver of type 2 diabetes, non-alcoholic fatty liver disease, and cardiovascular disease. This domain captures three complementary angles: habitual physical activity intensity (Activity Consistency), body composition as a surrogate for visceral adiposity (Body Composition), and glycemic regulation (Glucose Health).

Body fat thresholds use sex-specific cutoffs. BMI thresholds additionally apply the South Asian / East Asian correction (−2.5 kg/m² per WHO 2004 Expert Consultation) because standard WHO BMI thresholds underestimate cardiometabolic risk in these populations.

### 3.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| Activity Consistency | 40% | `HKQuantityTypeIdentifierActiveEnergyBurned` + `HKQuantityTypeIdentifierBasalEnergyBurned` / `ActiveCaloriesBurned` + `BasalMetabolicRate` (Health Connect) |
| Body Composition | 40% | `HKQuantityTypeIdentifierBodyFatPercentage` + `HKQuantityTypeIdentifierBodyMassIndex` / Manual / DEXA (Phase 2) |
| Glucose Health | 20% | `HKQuantityTypeIdentifierBloodGlucose` (manual HbA1c) / CGM Time-in-Range (Phase 2) |

### 3.3 Raw Data Inputs

```
active_kcal_day  : float   — active (exercise) calories burned in past 7-day average
bmr_kcal_day     : float   — basal metabolic rate (estimated via Mifflin-St Jeor if not measured)
body_fat_pct     : float   — body fat percentage (0–60)
bmi              : float   — body mass index (kg/m²)
user_ethnicity   : enum    — "south_asian" | "east_asian" | "other"  (for BMI correction)
hba1c_pct        : float   — HbA1c percentage (Phase 1; optional)
tir_pct          : float   — CGM Time-in-Range 70–180 mg/dL, % of day (Phase 2; optional)
user_sex         : enum    — "male" | "female"
```

**Phase 1 availability:** Active calories and BMR from HealthKit/Health Connect. Body fat from smart scales synced via HealthKit, or manual entry. BMI calculated from height/weight (manual). HbA1c manual entry (lab result).

**Phase 2 additions:** CGM TIR from Dexterity/Libre/Dexcom integration. DEXA body composition from clinic visit.

### 3.4 Piecewise Scaling Formulas

#### 3.4.1 Activity Consistency Sub-Score (`s_activity`)

The ratio of active calories to BMR captures relative exercise intensity independent of body size. A ratio of 0.3 or higher (active calories ≥ 30% of BMR) is associated with metabolic benefit. Target is 0.5 (moderate-high activity).

```
ratio = active_kcal_day / bmr_kcal_day

if ratio ≥ 0.5:
    s_activity = 100
elif 0 ≤ ratio < 0.5:
    s_activity = 100 × ratio / 0.5
else:
    s_activity = 0
```

Use 7-day rolling average of `active_kcal_day` to smooth single-day noise.

#### 3.4.2 Body Composition Sub-Score (`s_body`)

Compute two sub-components and average them:

**Component A — Body Fat Percentage (`s_bf`):**

```
# Sex-specific optimal and floor values
if user_sex == "male":
    bf_optimal = 15.0   # %
    bf_floor   = 30.0   # % (obese threshold)
    bf_low     = 5.0    # % (essential fat minimum)
else:  # female
    bf_optimal = 22.0
    bf_floor   = 38.0
    bf_low     = 12.0

x = body_fat_pct

if x < bf_low:
    s_bf = max(0, 100 × (x − bf_low + 5) / 5)   # penalty for dangerously low body fat
elif bf_low ≤ x ≤ bf_optimal:
    s_bf = 100
elif bf_optimal < x ≤ bf_floor:
    s_bf = 100 × (bf_floor − x) / (bf_floor − bf_optimal)
else:  # x > bf_floor
    s_bf = 0
```

**Component B — BMI (`s_bmi`) with South/East Asian correction:**

```
# Apply ethnicity correction
if user_ethnicity in ("south_asian", "east_asian"):
    bmi_adj = bmi - 2.5   # shift thresholds down by 2.5 kg/m²
    bmi_optimal_upper = 20.5   # equivalent to 23.0 standard
    bmi_optimal_lower = 16.0
    bmi_obese = 25.0           # equivalent to 27.5 standard
else:
    bmi_adj = bmi
    bmi_optimal_upper = 23.0
    bmi_optimal_lower = 18.5
    bmi_obese = 30.0

x = bmi_adj

if x < bmi_optimal_lower:
    s_bmi = max(0, 100 × (x − (bmi_optimal_lower − 5)) / 5)
elif bmi_optimal_lower ≤ x ≤ bmi_optimal_upper:
    s_bmi = 100
elif bmi_optimal_upper < x ≤ bmi_obese:
    s_bmi = 100 × (bmi_obese − x) / (bmi_obese − bmi_optimal_upper)
else:
    s_bmi = 0
```

**Body Composition composite:**

```
# If both available:
s_body = 0.6 × s_bf + 0.4 × s_bmi

# If only BMI available (no body fat device):
s_body = s_bmi

# If only body fat available:
s_body = s_bf
```

#### 3.4.3 Glucose Health Sub-Score (`s_glucose`)

**Phase 1 — HbA1c:**

```
x = hba1c_pct

if x ≤ 5.0:    s_glucose = 100
elif x ≤ 5.7:  s_glucose = 100 × (5.7 − x) / (5.7 − 5.0) + 70 × (x − 5.0) / 0.7
    # simplify: linear from 100 at 5.0 to 70 at 5.7
elif x ≤ 6.5:  s_glucose = 70 × (6.5 − x) / (6.5 − 5.7)    # linear 70→0 in pre-diabetic range
else:           s_glucose = 0
```

Cleaner piecewise form:
```
x = hba1c_pct
if   x ≤ 5.0:  s_glucose = 100
elif x ≤ 5.7:  s_glucose = round(100 − 42.86 × (x − 5.0))   # slope: (100-70)/0.7 ≈ 42.86
elif x ≤ 6.5:  s_glucose = round(70 − 87.50 × (x − 5.7))    # slope: 70/0.8 = 87.5
else:           s_glucose = 0
```

**Phase 2 — CGM Time-in-Range (TIR, 70–180 mg/dL):**

Per the International Consensus on CGM (Danne et al. 2019), TIR > 70% is the clinical target for people without diabetes.

```
x = tir_pct  # 0–100

if x ≥ 85:   s_glucose = 100
elif x ≥ 70: s_glucose = round(100 × (x − 70) / (85 − 70) × 0.5 + 50)
              # linear from 50 at 70% TIR to 100 at 85% TIR
else:         s_glucose = round(50 × x / 70)
              # linear from 0 to 50 below the target
```

**Phase selection:** Use TIR if CGM data covers ≥ 70% of the past 14 days; otherwise fall back to HbA1c.

### 3.5 Composite Metabolic Score

```
Metabolic_score = round(
    0.40 × s_activity  +
    0.40 × s_body      +
    0.20 × s_glucose
)
```

Apply proportional re-weighting if any sub-score is unavailable.

### 3.6 Age/Sex Adjustment Rules

- Body fat percentage thresholds are sex-specific (Section 3.4.2).
- BMI thresholds apply South/East Asian ethnicity correction.
- No age adjustment applied to activity or glucose; clinical targets are age-invariant for adults.

### 3.7 References

1. World Health Organization. (2000). *Obesity: Preventing and Managing the Global Epidemic.* WHO Technical Report Series 894. Geneva: WHO.
2. Danne, T., Nimri, R., Battelino, T., et al. (2017). International Consensus on Use of Continuous Glucose Monitoring. *Diabetes Care*, 40(12), 1631–1640. (TIR consensus targets from Battelino et al., 2019.)
3. Desprès, J.P., & Lemieux, I. (2006). Abdominal obesity and metabolic syndrome. *Nature*, 444(7121), 881–887. (Desprès 2008 review on visceral adiposity and cardiometabolic risk also cited.)

---

## 4. Sleep Architecture (0–100)

### 4.1 Description and Clinical Rationale

Sleep is the primary biological process for memory consolidation, immune function, hormonal regulation (growth hormone, cortisol), and metabolic restoration. Insufficient or fragmented sleep is a causal risk factor for cardiovascular disease, type 2 diabetes, and cognitive decline. This domain captures four dimensions: total sleep duration (quantity), stage distribution (quality), chronobiological consistency (timing regularity), and ease of sleep initiation (latency).

The National Sleep Foundation's 2015 consensus (Hirshkowitz et al.) provides the definitive adult duration targets. Stage distribution targets are drawn from polysomnographic normative data; adults should obtain ≥ 20% REM and ≥ 20% deep (slow-wave) sleep. Chronotype regularity is quantified via the standard deviation of the sleep midpoint across 7 nights, following Roenneberg's social jetlag methodology.

### 4.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| Sleep Duration | 35% | `HKCategoryTypeIdentifierSleepAnalysis` / `SleepSession` (Health Connect) / Fitbit Sleep |
| Stage Distribution | 30% | `HKCategoryTypeIdentifierSleepAnalysis` (sleep stages) / Fitbit Premium / Oura Ring |
| Sleep Timing Consistency | 20% | Derived from sleep midpoint across 7 nights |
| Sleep Latency | 15% | `HKCategoryTypeIdentifierSleepAnalysis` (in-bed minus asleep time) / Manual |

### 4.3 Raw Data Inputs

```
sleep_duration_h       : float   — total sleep time last night in hours
rem_pct                : float   — % of total sleep spent in REM (0–60)
deep_pct               : float   — % of total sleep spent in deep/SWS (0–60)
sleep_midpoint_times   : list    — array of 7 sleep midpoint timestamps (datetime)
sleep_latency_min      : float   — minutes from lights-out to sleep onset
user_age               : integer — years
```

**Phase 1 availability:** Duration and basic sleep/wake from HealthKit on iPhone (using phone motion/sensors). Sleep stages require Apple Watch Series 4+ (watchOS 9+) or a Fitbit device synced to HealthKit. Sleep midpoint computed from start/end timestamps. Latency: manual entry or wearable.

**Phase 2 additions:** Oura Ring provides stage-level polysomnographic-validated data; actigraphy-calibrated latency.

### 4.4 Piecewise Scaling Formulas

#### 4.4.1 Sleep Duration Sub-Score (`s_duration`)

Based on NSF 2015 age-appropriate targets. For adults 18–64: recommended 7–9 h; for 65+: 7–8 h.

```
# Select targets by age
if user_age >= 65:
    dur_optimal_low  = 7.0
    dur_optimal_high = 8.0
    dur_floor_low    = 5.0    # score = 0 below this
    dur_floor_high   = 10.0   # score = 0 above this
else:  # 18–64
    dur_optimal_low  = 7.0
    dur_optimal_high = 9.0
    dur_floor_low    = 5.0
    dur_floor_high   = 11.0

x = sleep_duration_h

if dur_optimal_low ≤ x ≤ dur_optimal_high:
    s_duration = 100
elif x < dur_optimal_low:
    s_duration = clamp(100 × (x − dur_floor_low) / (dur_optimal_low − dur_floor_low), 0, 100)
else:  # x > dur_optimal_high (oversleeping)
    s_duration = clamp(100 × (dur_floor_high − x) / (dur_floor_high − dur_optimal_high), 0, 100)
```

#### 4.4.2 Stage Distribution Sub-Score (`s_stages`)

Both REM and deep sleep must meet thresholds independently; the sub-score is the average of two components:

```
# REM component
if rem_pct ≥ 20:
    s_rem = 100
elif rem_pct ≥ 10:
    s_rem = 100 × (rem_pct − 10) / (20 − 10)
else:
    s_rem = 0

# Deep sleep component
if deep_pct ≥ 20:
    s_deep = 100
elif deep_pct ≥ 8:
    s_deep = 100 × (deep_pct − 8) / (20 − 8)
else:
    s_deep = 0

s_stages = 0.5 × s_rem + 0.5 × s_deep
```

**Phase 1 fallback:** If stage data unavailable, `s_stages` is excluded and remaining weights are renormalized.

#### 4.4.3 Sleep Timing Consistency Sub-Score (`s_timing`)

Standard deviation of sleep midpoint (in decimal hours) across the past 7 nights. Lower SD = more consistent circadian rhythm.

```
midpoints_h = [timestamp_to_decimal_hour(t) for t in sleep_midpoint_times]
# Handle midnight wraparound: adjust values crossing midnight by ±24
sd_midpoint = standard_deviation(midpoints_h)   # in hours

# Scoring: SD < 0.5 h = excellent; SD > 2.5 h = poor
if sd_midpoint ≤ 0.5:
    s_timing = 100
elif sd_midpoint ≤ 2.5:
    s_timing = 100 × (2.5 − sd_midpoint) / (2.5 − 0.5)
else:
    s_timing = 0
```

Requires at least 4 of 7 nights of data; if fewer available, exclude this sub-score.

#### 4.4.4 Sleep Latency Sub-Score (`s_latency`)

```
x = sleep_latency_min

if x ≤ 20:
    s_latency = 100
elif x ≤ 60:
    s_latency = 100 × (60 − x) / (60 − 20)
else:
    s_latency = 0

# Very short latency (<5 min) may indicate sleep debt — apply mild penalty
if x < 5:
    s_latency = 80
```

### 4.5 Composite Sleep Score

```
Sleep_score = round(
    0.35 × s_duration  +
    0.30 × s_stages    +
    0.20 × s_timing    +
    0.15 × s_latency
)
```

Apply proportional re-weighting for unavailable sub-scores (most commonly `s_stages`).

### 4.6 Age/Sex Adjustment Rules

- Duration optimal range is narrowed by 1 hour for users aged 65+ (Section 4.4.1).
- Deep sleep percentage naturally decreases with age; in Phase 2, an age-adjusted deep sleep floor may replace the static 8% floor using data from Hirshkowitz et al. normative tables.
- No sex adjustment for duration; mild sex differences in deep sleep are not large enough to warrant separate cutoffs at this stage.

### 4.7 References

1. Hirshkowitz, M., Whiton, K., Albert, S.M., et al. (2015). National Sleep Foundation's sleep time duration recommendations: methodology and results summary. *Sleep Health*, 1(1), 40–43.
2. Walker, M.P. (2017). *Why We Sleep: Unlocking the Power of Sleep and Dreams.* Scribner. (Clinical references therein for stage-function relationships.)
3. Roenneberg, T., Allebrandt, K.V., Merrow, M., & Vetter, C. (2012). Social jetlag and obesity. *Current Biology*, 22(10), 939–943.

---

## 5. Recovery Capacity (0–100)

### 5.1 Description and Clinical Rationale

Recovery capacity quantifies the body's readiness to adapt to future physiological stress. Insufficient recovery is a key mechanism linking overtraining, chronic stress, and sleep deprivation to immune suppression, injury risk, and accelerated biological aging. This domain uses trending HRV and resting HR (relative to the individual's own baseline, not population norms) to capture day-to-day autonomic recovery, combined with sleep quality and exercise-load balance.

The critical methodological choice here is individual-relative trending: a day's HRV is evaluated against that user's own 7-day rolling baseline rather than against population means. This makes the score robust across fitness levels and age groups, and is consistent with elite-sport HRV monitoring best practices (Plews et al. 2013).

### 5.2 Sub-Scores and Weights

| Sub-Score | Weight | Identifier/Source |
|-----------|--------|-------------------|
| HRV Trend (vs 7-day baseline) | 35% | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` / Health Connect / Wearable |
| Resting HR Trend (vs 7-day baseline) | 35% | `HKQuantityTypeIdentifierHeartRate` (resting) / Health Connect |
| Sleep Quality (from §4) | 15% | Sleep Architecture score (Section 4) |
| Activity Load vs Rest Ratio | 15% | `HKQuantityTypeIdentifierActiveEnergyBurned` / Health Connect |

### 5.3 Raw Data Inputs

```
hrv_today_ms        : float   — today's morning SDNN in ms
hrv_baseline_7d_ms  : float   — rolling 7-day mean SDNN in ms
rhr_today_bpm       : float   — today's resting HR in bpm
rhr_baseline_7d_bpm : float   — rolling 7-day mean resting HR in bpm
sleep_score         : float   — Section 4 Sleep Architecture score (0–100)
active_kcal_today   : float   — active calories burned today
active_kcal_7d_avg  : float   — 7-day rolling average active calories
```

**Phase 1 availability:** HRV and RHR from Apple Watch via HealthKit morning samples. Sleep score from Section 4. Active calories from HealthKit.

**Phase 2 additions:** HRV from overnight Polar H10 or Oura chest measurement (more reliable SDNN); real-time strain score from Garmin/WHOOP-equivalent calculation.

### 5.4 Piecewise Scaling Formulas

#### 5.4.1 HRV Trend Sub-Score (`s_hrv_trend`)

```
delta_hrv = (hrv_today_ms − hrv_baseline_7d_ms) / hrv_baseline_7d_ms × 100  # % change

# Scoring: +10% above baseline = full score; −20% below = zero
if delta_hrv ≥ 10:
    s_hrv_trend = 100
elif delta_hrv ≥ −20:
    s_hrv_trend = 100 × (delta_hrv + 20) / (10 + 20)   # linear from 0 at -20% to 100 at +10%
else:
    s_hrv_trend = 0
```

#### 5.4.2 Resting HR Trend Sub-Score (`s_rhr_trend`)

Note: for RHR, a decrease is favorable (inverted delta).

```
delta_rhr = (rhr_today_bpm − rhr_baseline_7d_bpm) / rhr_baseline_7d_bpm × 100  # % change

# Favorable: RHR drops (negative delta). Elevated RHR = poor recovery.
# +5% rise = onset of concern; +15% rise = poor recovery
if delta_rhr ≤ 0:
    s_rhr_trend = 100   # RHR at or below baseline — full recovery
elif delta_rhr ≤ 15:
    s_rhr_trend = 100 × (15 − delta_rhr) / 15
else:
    s_rhr_trend = 0
```

#### 5.4.3 Sleep Quality Component (`s_sleep_recovery`)

```
s_sleep_recovery = sleep_score   # directly from Section 4 composite
```

#### 5.4.4 Activity Load vs Rest Ratio (`s_load_balance`)

```
load_ratio = active_kcal_today / max(active_kcal_7d_avg, 1)

# Optimal: load_ratio 0.7–1.3 (moderate variation from baseline = healthy periodization)
# High ratio (>2.0) = potential overtraining on recovery day
if 0.7 ≤ load_ratio ≤ 1.3:
    s_load_balance = 100
elif load_ratio < 0.7:
    # Active rest / deload day: still positive, just lower
    s_load_balance = 100 × load_ratio / 0.7
elif 1.3 < load_ratio ≤ 2.0:
    s_load_balance = 100 × (2.0 − load_ratio) / (2.0 − 1.3)
else:  # load_ratio > 2.0
    s_load_balance = 0
```

### 5.5 Composite Recovery Score

```
Recovery_score = round(
    0.35 × s_hrv_trend      +
    0.35 × s_rhr_trend      +
    0.15 × s_sleep_recovery +
    0.15 × s_load_balance
)
```

**Baseline bootstrapping:** For new users with fewer than 7 days of data, use available days (minimum 3) to compute baseline. Below 3 days, exclude the trend sub-scores and use only sleep and load components, renormalized.

### 5.6 Age/Sex Adjustment Rules

- No age or sex adjustment: trend scores are individual-relative and therefore self-normalizing.
- In Phase 2, if a physician-established HRV baseline is provided (e.g., from a clinical assessment), that value overrides the app-computed 7-day rolling baseline.

### 5.7 References

1. Plews, D.J., Laursen, P.B., Stanley, J., Kilding, A.E., & Buchheit, M. (2013). Training adaptation and heart rate variability in elite endurance athletes: Opening the door to effective monitoring. *Sports Medicine*, 43(9), 773–781.
2. Buchheit, M. (2014). Monitoring training status with HR measures: Do all roads lead to Rome? *Frontiers in Physiology*, 5, 73.
3. Kellmann, M., Bertollo, M., Bosquet, L., et al. (2018). Recovery and performance in sport: Consensus statement. *International Journal of Sports Physiology and Performance*, 13(2), 240–245.

---

## 6. Cognitive Performance (0–100)

### 6.1 Description and Clinical Rationale

Cognitive function is both an output of overall health (sleep, cardiovascular fitness, and metabolic health all drive cognition) and an independent dimension of longevity quality. Cognitive decline precedes Alzheimer's and vascular dementia diagnoses by 10–20 years. Tracking subjective cognitive function longitudinally provides an early-warning signal and a motivational feedback loop.

Phase 1 relies on validated self-report constructs (analogous to the Perceived Stress Scale and WHO-5 Wellbeing Index question structure) because objective neuropsychological tests require controlled administration conditions. Phase 2 integrates the COGBAT (Cognitive Battery) facility scores, which include validated measures of processing speed, working memory, and executive function.

The sleep and HRV bonus scores operationalize the well-documented mediating effect of sleep quality and autonomic balance on next-day cognitive performance (Harrison & Horne 2000; Lambourne & Tomporowski 2010).

### 6.2 Phase 1 — Morning Self-Report Score

#### 6.2.1 5-Question Self-Report

Each question is answered on a 1–5 Likert scale (1 = very poor, 5 = excellent) and normalized to 0–20 points.

| Question | Domain | Scoring Direction |
|----------|--------|-------------------|
| Q1: How well can you focus right now? | Focus | Direct (5 → 20 pts) |
| Q2: How would you rate your mental energy? | Mental Energy | Direct |
| Q3: How is your mood overall? | Mood | Direct |
| Q4: How sharp does your memory feel? | Memory Clarity | Direct |
| Q5: How stressed do you feel? | Stress | Inverted (1 → 20 pts, 5 → 0 pts) |

```
# Normalize each response to 0–20
normalize_direct(r)   = (r − 1) / 4 × 20     # r ∈ {1,2,3,4,5}
normalize_inverted(r) = (5 − r) / 4 × 20     # r ∈ {1,2,3,4,5}

q1_pts = normalize_direct(Q1_response)
q2_pts = normalize_direct(Q2_response)
q3_pts = normalize_direct(Q3_response)
q4_pts = normalize_direct(Q4_response)
q5_pts = normalize_inverted(Q5_response)

self_report_raw = q1_pts + q2_pts + q3_pts + q4_pts + q5_pts  # 0–100
```

#### 6.2.2 Bonus Adjustments

```
sleep_bonus = 10 if sleep_score > 80 else 0
hrv_bonus   = 5  if hrv_today_ms > hrv_baseline_7d_ms else 0

Cognitive_score_p1 = clamp(self_report_raw + sleep_bonus + hrv_bonus, 0, 100)
```

### 6.3 Phase 2 — COGBAT Integration

When a facility COGBAT assessment has been completed within the past 90 days, blend the objective and subjective scores:

```
cogbat_normalized = COGBAT_percentile_score   # 0–100, provided by COGBAT facility API

Cognitive_score_p2 = clamp(
    0.70 × cogbat_normalized  +
    0.30 × self_report_raw,
    0, 100
)
```

**Phase selection logic:**
- If COGBAT assessment age ≤ 90 days: use Phase 2 formula.
- If COGBAT assessment age > 90 days or not available: use Phase 1 formula.
- COGBAT score decays linearly: at 90 days its weight drops to 40%; beyond 90 days it is excluded.

```
# COGBAT weight decay
days_since_cogbat = (today − cogbat_date).days
if days_since_cogbat ≤ 30:
    w_cogbat = 0.70
elif days_since_cogbat ≤ 90:
    w_cogbat = 0.70 − 0.30 × (days_since_cogbat − 30) / 60   # decays from 0.70 to 0.40
else:
    w_cogbat = 0.0   # exclude COGBAT, use Phase 1 only

w_self = 1.0 − w_cogbat
Cognitive_score = clamp(w_cogbat × cogbat_normalized + w_self × self_report_raw + sleep_bonus + hrv_bonus, 0, 100)
```

### 6.4 Age/Sex Adjustment Rules

- COGBAT percentile scores are already age- and sex-normed by the COGBAT facility; no further adjustment needed.
- Self-report scores are not age-adjusted; subjective cognitive perception is not systematically biased by age in a way that warrants algorithmic correction.

### 6.5 References

1. Harrison, Y., & Horne, J.A. (2000). The impact of sleep deprivation on decision making: A review. *Journal of Experimental Psychology: Applied*, 6(3), 236–249.
2. Lambourne, K., & Tomporowski, P. (2010). The effect of exercise-induced arousal on cognitive task performance: A meta-regression analysis. *Brain Research*, 1341, 12–24.
3. Hillman, C.H., Erickson, K.I., & Kramer, A.F. (2008). Be smart, exercise your heart: Exercise effects on brain and cognition. *Nature Reviews Neuroscience*, 9(1), 58–65.

---

## 7. Longevity Index (0–100)

### 7.1 Description and Clinical Rationale

The Longevity Index is a single composite metric designed to communicate overall healthspan trajectory in a format that is immediately intuitive to users and clinicians alike. It weights the six domain scores according to their relative contributions to all-cause mortality and functional independence in older age, drawing on epidemiological evidence from the MacArthur Study of Successful Aging and the Hallmarks of Aging framework (López-Otín et al. 2013).

Cardiovascular health receives the highest single weight because cardiorespiratory fitness and autonomic function are the most robust predictors of all-cause mortality across all adult age groups (Crimmins 2015). Sleep and Cognitive weights reflect emerging evidence that these domains mediate amyloid clearance and neurodegeneration risk (Ferrucci & Fabbri 2018).

> **IMPORTANT:** The weights below have been proposed by the engineering and clinical advisory team. They require **formal sign-off from the Chief Physician** before being used in any production release or user-facing display.

### 7.2 Domain Weights

| Domain | Weight | Clinical Rationale |
|--------|--------|-------------------|
| Cardiovascular Health | 25% | Strongest single predictor of all-cause mortality |
| Metabolic Fitness | 22% | Visceral adiposity and dysglycemia drive cardiometabolic disease cascade |
| Sleep Architecture | 18% | Mediates amyloid clearance, hormonal regulation, immune function |
| Recovery Capacity | 17% | Proxy for allostatic load and physiological resilience |
| Cognitive Performance | 18% | Early marker of neurodegeneration; quality-of-life dimension |
| **Total** | **100%** | |

### 7.3 Composite Formula

```
Longevity_Index = round(
    0.25 × CV_score         +
    0.22 × Metabolic_score  +
    0.18 × Sleep_score      +
    0.17 × Recovery_score   +
    0.18 × Cognitive_score
)
```

**Partial score rule:** If any domain score is unavailable (e.g., no glucose data in Metabolic), that domain's sub-score is excluded and remaining weights are renormalized:

```
available_domains = [d for d in domains if d.score is not None]
total_weight = sum(d.weight for d in available_domains)
Longevity_Index = round(
    sum(d.weight × d.score for d in available_domains) / total_weight
)
```

### 7.4 Trajectory Scoring

In addition to the point-in-time score, a **trajectory delta** is computed and displayed:

```
delta_30d  = Longevity_Index_today − Longevity_Index_30_days_ago
delta_60d  = Longevity_Index_today − Longevity_Index_60_days_ago
delta_90d  = Longevity_Index_today − Longevity_Index_90_days_ago
```

**Display rules:**

| Delta | Trend Label | Color |
|-------|-------------|-------|
| ≥ +5 | Improving | Green |
| −4 to +4 | Stable | Amber |
| ≤ −5 | Declining | Red |

Historical scores are stored daily in Supabase (`longevity_scores` table) and retrieved via indexed queries on `(user_id, score_date)`.

### 7.5 Age/Sex Adjustment Rules

The Longevity Index itself is not age-adjusted — age effects are handled within individual domain scores (e.g., VO2 Max percentile, sleep duration thresholds). This means a 70-year-old and a 30-year-old can both achieve a score of 100 if each is optimally performing relative to their own age-appropriate norms.

### 7.6 References

1. Crimmins, E.M. (2015). Lifespan and healthspan: Past, present, and promise. *The Gerontologist*, 55(6), 901–911.
2. López-Otín, C., Blasco, M.A., Partridge, L., Serrano, M., & Kroemer, G. (2013). The hallmarks of aging. *Cell*, 153(6), 1194–1217.
3. Ferrucci, L., & Fabbri, E. (2018). Inflammageing: Chronic inflammation in ageing, cardiovascular disease, and frailty. *Nature Reviews Cardiology*, 15(9), 505–522.

---

## 8. Master Data Source Mapping Table

The table below maps every data input used across all six scoring domains to its source identifier for each supported platform.

| Metric | Apple HealthKit Identifier | Google Health Connect Type | Fitbit API Field | Manual Entry | Phase |
|--------|---------------------------|---------------------------|-----------------|--------------|-------|
| Resting Heart Rate | `HKQuantityTypeIdentifierHeartRate` (resting context) | `HeartRate` | `heart-rate/activities-heart` | Yes | 1 |
| HRV — SDNN | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | `HeartRateVariability` | Premium: HRV | Chest strap | 1/2 |
| VO2 Max | `HKQuantityTypeIdentifierVO2Max` | `ExerciseSessionRecord` (estimated) | N/A | Yes (lab) | 1/2 |
| Systolic BP | `HKCorrelationTypeIdentifierBloodPressure` → systolic | `BloodPressure` → systolic | N/A (Fitbit Sense BP log) | Yes | 1/2 |
| Diastolic BP | `HKCorrelationTypeIdentifierBloodPressure` → diastolic | `BloodPressure` → diastolic | N/A | Yes | 1/2 |
| Active Calories | `HKQuantityTypeIdentifierActiveEnergyBurned` | `ActiveCaloriesBurned` | `activities/calories` | Yes | 1 |
| Basal Metabolic Rate | `HKQuantityTypeIdentifierBasalEnergyBurned` | `BasalMetabolicRate` | `activities/bmr` | Estimated (Mifflin-St Jeor) | 1 |
| Body Fat % | `HKQuantityTypeIdentifierBodyFatPercentage` | `BodyFat` | `body/fat` | Smart scale / DEXA | 1/2 |
| BMI | `HKQuantityTypeIdentifierBodyMassIndex` | `BodyFat` (derived) | `body/bmi` | Yes | 1 |
| Blood Glucose (HbA1c) | `HKQuantityTypeIdentifierBloodGlucose` | `BloodGlucose` | N/A | Yes (lab) | 1 |
| CGM Time-in-Range | N/A (LibreView / Dexcom SDK) | N/A | N/A | CGM device | 2 |
| Sleep Duration | `HKCategoryTypeIdentifierSleepAnalysis` | `SleepSession` | `sleep/list` | Yes | 1 |
| Sleep Stages (REM/Deep) | `HKCategoryTypeIdentifierSleepAnalysis` (stage values) | `SleepSession` (stages) | `sleep/list` (stages) | Wearable | 1/2 |
| Sleep Latency | `HKCategoryTypeIdentifierSleepAnalysis` (inBed − asleep delta) | `SleepSession` | `sleep/list` → minutesAwake | Manual / Wearable | 1/2 |
| Sleep Midpoint | Derived from sleep start/end timestamps | Derived | Derived | — | 1 |
| Morning Self-Report | N/A | N/A | N/A | In-app 5Q survey | 1 |
| COGBAT Score | N/A | N/A | N/A | Facility API | 2 |
| Ethnicity | N/A | N/A | N/A | User profile | 1 |
| Age | `HKCharacteristicTypeIdentifierDateOfBirth` | `Profile` | `profile` | User profile | 1 |
| Biological Sex | `HKCharacteristicTypeIdentifierBiologicalSex` | `Profile` | `profile` | User profile | 1 |

**Camera PPG (Phase 2):** Resting HR and a proxy HRV signal can be estimated via photoplethysmography using the device camera (index finger or face). Camera PPG feeds the same `rhr_bpm` and `sdnn_ms` fields. Accuracy is lower than wrist PPG; confidence flag is set to `low` when camera PPG is the source, and the sub-score is down-weighted by 15% in the composite.

---

## 9. Age-Bracket Reference Table

### 9.1 Age Group Definitions

Used throughout the scoring engine to select appropriate reference values.

| Group Code | Age Range | Label |
|------------|-----------|-------|
| `AG1` | 20–35 | Young Adult |
| `AG2` | 36–50 | Middle Adult |
| `AG3` | 51–65 | Mature Adult |
| `AG4` | 65+ | Older Adult |

### 9.2 HRV / SDNN Reference Values by Age Group

Source: Shaffer & Ginsberg (2017), Table 2; Nunan et al. (2010) meta-analysis.

| Age Group | SDNN Target (ms) — `sdnn_target` | SDNN Floor (ms) — `sdnn_floor` |
|-----------|----------------------------------|--------------------------------|
| AG1 (20–35) | 65 | 20 |
| AG2 (36–50) | 55 | 18 |
| AG3 (51–65) | 45 | 15 |
| AG4 (65+) | 35 | 12 |

*SDNN naturally declines with age due to reduced parasympathetic tone. Using age-specific targets prevents older adults from being penalized for physiologically normal lower HRV.*

### 9.3 VO2 Max Percentile Reference Table

Source: Kaminsky et al. (2015), ACSM Guidelines for Exercise Testing and Prescription (10th Ed.).

**Males (mL/kg/min → approximate percentile)**

| Percentile | AG1 (20–35) | AG2 (36–50) | AG3 (51–65) | AG4 (65+) |
|------------|------------|------------|------------|----------|
| 95 | ≥ 55 | ≥ 51 | ≥ 45 | ≥ 40 |
| 75 | 46–54 | 42–50 | 36–44 | 32–39 |
| 50 | 40–45 | 36–41 | 30–35 | 26–31 |
| 25 | 34–39 | 30–35 | 24–29 | 20–25 |
| 5 | ≤ 33 | ≤ 29 | ≤ 23 | ≤ 19 |

**Females (mL/kg/min → approximate percentile)**

| Percentile | AG1 (20–35) | AG2 (36–50) | AG3 (51–65) | AG4 (65+) |
|------------|------------|------------|------------|----------|
| 95 | ≥ 48 | ≥ 44 | ≥ 39 | ≥ 34 |
| 75 | 39–47 | 35–43 | 30–38 | 26–33 |
| 50 | 33–38 | 29–34 | 24–29 | 20–25 |
| 25 | 27–32 | 23–28 | 18–23 | 15–19 |
| 5 | ≤ 26 | ≤ 22 | ≤ 17 | ≤ 14 |

**Percentile interpolation:**

```python
def vo2_percentile(vo2, age, sex):
    """
    Linearly interpolate within the table above.
    Returns integer percentile 0–100.
    """
    age_group = classify_age_group(age)
    brackets  = VO2_TABLE[sex][age_group]   # list of (vo2_threshold, percentile) tuples
    # brackets sorted ascending by vo2_threshold
    for i in range(len(brackets) - 1):
        lo_vo2, lo_pct = brackets[i]
        hi_vo2, hi_pct = brackets[i + 1]
        if lo_vo2 <= vo2 <= hi_vo2:
            return round(lo_pct + (hi_pct - lo_pct) * (vo2 - lo_vo2) / (hi_vo2 - lo_vo2))
    if vo2 < brackets[0][0]:
        return 0
    return 100
```

### 9.4 Body Fat Percentage Reference by Sex

Source: American College of Sports Medicine (ACSM) GETP 10th Edition; Gallagher et al. (2000).

| Classification | Males | Females |
|---------------|-------|---------|
| Essential Fat (floor) | < 5% | < 12% |
| Athletic | 5–13% | 12–20% |
| Fitness (optimal) | 14–17% | 21–24% |
| Acceptable | 18–24% | 25–31% |
| Obese (floor for s=0) | ≥ 25% | ≥ 32% |

*The scoring formula maps `bf_optimal` to the midpoint of the "Fitness" category and `bf_floor` to the obese threshold.*

---

## 10. Implementation Notes

### 10.1 Repository Structure

```
packages/
  scoring/
    src/
      cardiovascular.ts     # Section 2 formulas
      metabolic.ts          # Section 3 formulas
      sleep.ts              # Section 4 formulas
      recovery.ts           # Section 5 formulas
      cognitive.ts          # Section 6 formulas
      longevityIndex.ts     # Section 7 composite
      tables/
        vo2MaxTable.ts      # Section 9.3 lookup table
        sdnnTable.ts        # Section 9.2 lookup table
        bodyFatTable.ts     # Section 9.4 lookup table
      utils/
        piecewiseLinear.ts  # clamp + piecewise helpers
        partialScore.ts     # proportional re-weighting logic
        phaseSelector.ts    # Phase 1 vs Phase 2 data selection
      index.ts              # exports all score functions
    tests/
      cardiovascular.test.ts
      metabolic.test.ts
      sleep.test.ts
      recovery.test.ts
      cognitive.test.ts
      longevityIndex.test.ts
```

### 10.2 TypeScript Interfaces

```typescript
// Core input types
interface UserProfile {
  age: number;
  sex: 'male' | 'female';
  ethnicity: 'south_asian' | 'east_asian' | 'other';
}

interface CardiovascularInputs {
  rhrBpm?: number;
  sdnnMs?: number;
  vo2MaxMlKgMin?: number;
  sbpMmhg?: number;
  dbpMmhg?: number;
}

interface MetabolicInputs {
  activeKcalDayAvg7d?: number;
  bmrKcalDay?: number;
  bodyFatPct?: number;
  bmi?: number;
  hba1cPct?: number;          // Phase 1
  tirPct?: number;            // Phase 2
  cgmCoveragePct?: number;    // to determine phase selection
}

interface SleepInputs {
  durationH?: number;
  remPct?: number;
  deepPct?: number;
  midpointTimestamps?: Date[];  // 7-element array
  latencyMin?: number;
}

interface RecoveryInputs {
  hrvTodayMs?: number;
  hrvBaseline7dMs?: number;
  rhrTodayBpm?: number;
  rhrBaseline7dBpm?: number;
  sleepScore?: number;          // from SleepArchitecture output
  activeKcalToday?: number;
  activeKcal7dAvg?: number;
}

interface CognitiveInputs {
  selfReport: {
    focus: 1|2|3|4|5;
    mentalEnergy: 1|2|3|4|5;
    mood: 1|2|3|4|5;
    memoryClarity: 1|2|3|4|5;
    stress: 1|2|3|4|5;         // inverted
  };
  sleepScore?: number;
  hrvTodayMs?: number;
  hrvBaseline7dMs?: number;
  cogbatScore?: number;         // Phase 2
  cogbatDate?: Date;            // Phase 2
}

// Output type
interface DomainScore {
  score: number;                // 0–100 integer
  confidence: 'high' | 'medium' | 'low';  // based on data completeness
  missingInputs: string[];      // list of excluded sub-scores
  subScores: Record<string, number>;
}
```

### 10.3 Supabase Schema (Key Tables)

```sql
-- Daily domain scores (one row per user per day per domain)
CREATE TABLE domain_scores (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  score_date      DATE NOT NULL,
  domain          TEXT NOT NULL CHECK (domain IN (
                    'cardiovascular', 'metabolic', 'sleep',
                    'recovery', 'cognitive', 'longevity_index'
                  )),
  score           SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  confidence      TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  sub_scores      JSONB,
  inputs_snapshot JSONB,        -- raw inputs for auditability
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, score_date, domain)
);

CREATE INDEX idx_domain_scores_user_date ON domain_scores (user_id, score_date DESC);

-- Morning cognitive self-report responses
CREATE TABLE cognitive_self_report (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id),
  report_date  DATE NOT NULL,
  focus        SMALLINT CHECK (focus BETWEEN 1 AND 5),
  mental_energy SMALLINT CHECK (mental_energy BETWEEN 1 AND 5),
  mood         SMALLINT CHECK (mood BETWEEN 1 AND 5),
  memory_clarity SMALLINT CHECK (memory_clarity BETWEEN 1 AND 5),
  stress       SMALLINT CHECK (stress BETWEEN 1 AND 5),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, report_date)
);

-- COGBAT facility assessments (Phase 2)
CREATE TABLE cogbat_assessments (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  assessment_date DATE NOT NULL,
  percentile_score SMALLINT CHECK (percentile_score BETWEEN 0 AND 100),
  raw_data        JSONB,
  facility_id     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### 10.4 Scoring Engine Invocation Pattern

The scoring engine runs in two modes:

1. **On-device (React Native):** Called after a HealthKit/Health Connect sync. Produces a provisional score stored locally; synced to Supabase in the background. Suitable for Phase 1 where all inputs are available on-device.

2. **Server-side (Supabase Edge Function):** Called when Phase 2 data arrives (CGM sync, COGBAT upload). Recomputes affected domain scores and the Longevity Index for the affected date. Triggers a push notification if the score changes by ≥ 5 points.

```typescript
// Example invocation
import { computeAllScores } from '@longitivity/scoring';

const scores = computeAllScores({
  userProfile: { age: 42, sex: 'male', ethnicity: 'south_asian' },
  cardiovascular: { rhrBpm: 58, sdnnMs: 52, vo2MaxMlKgMin: 44, sbpMmhg: 122, dbpMmhg: 78 },
  metabolic: { activeKcalDayAvg7d: 420, bmrKcalDay: 1800, bmi: 24.1, hba1cPct: 5.4 },
  sleep: { durationH: 7.2, remPct: 22, deepPct: 19, latencyMin: 14 },
  recovery: { hrvTodayMs: 55, hrvBaseline7dMs: 50, rhrTodayBpm: 57, rhrBaseline7dBpm: 58,
               activeKcalToday: 380, activeKcal7dAvg: 420 },
  cognitive: { selfReport: { focus: 4, mentalEnergy: 4, mood: 4, memoryClarity: 3, stress: 2 } }
});
// Returns: { cardiovascular: DomainScore, metabolic: DomainScore, ..., longevityIndex: DomainScore }
```

### 10.5 Confidence Levels

| Confidence | Criteria |
|------------|----------|
| `high` | All sub-scores for the domain computed from device/lab data; no manual entry |
| `medium` | 1–2 sub-scores missing or sourced from manual entry |
| `low` | More than 2 sub-scores missing; or camera PPG used as primary HRV/HR source |

Confidence is surfaced to the user as an information icon on each domain card. A `low` confidence score is never featured in marketing materials or coach summaries without explicit physician review.

### 10.6 Data Freshness Rules

| Domain | Score Expires After | Recalculation Trigger |
|--------|--------------------|-----------------------|
| Cardiovascular | 48 hours | New HealthKit sync |
| Metabolic | 7 days (body comp), 24 h (activity) | New sync or manual entry |
| Sleep | 24 hours | Morning sync |
| Recovery | 24 hours | Morning sync |
| Cognitive | 24 hours | Morning self-report |
| Longevity Index | 24 hours | Any domain score update |

---

## 11. Scoring Disclaimer

> **READ BEFORE SHIPPING — PHYSICIAN SIGN-OFF REQUIRED**

### 11.1 Patient Motivation Tool — Not a Diagnostic Instrument

The scores generated by the Longevity / Champions Longevity Dashboard are **wellness motivation indicators only**. They are designed to:

- Help users understand trends in their own health behaviors over time.
- Encourage positive lifestyle changes through gamified, data-driven feedback.
- Facilitate conversations between users and their healthcare providers.

They are **not** intended to:

- Diagnose any medical condition.
- Replace clinical assessment, laboratory testing, or physician evaluation.
- Guide medical treatment decisions.
- Serve as a substitute for emergency medical care.

### 11.2 Physician Sign-Off Requirements

The following elements of this specification require formal written sign-off from the Chief Physician before any production release:

| Element | Status | Required Reviewer |
|---------|--------|------------------|
| Domain weights in Longevity Index (Section 7.2) | **PENDING** | Chief Physician |
| Glucose health thresholds (Section 3.4.3) | **PENDING** | Chief Physician + Endocrinology Advisor |
| Blood pressure category mapping (Section 2.4.4) | **PENDING** | Chief Physician |
| COGBAT integration protocol (Section 6.3) | **PENDING** | Chief Physician + Neuropsychology Advisor |
| Camera PPG confidence downgrade factor (Section 8) | **PENDING** | Chief Physician |

No user-facing score may be displayed until the above sign-offs are obtained and documented in the project management system.

### 11.3 Regulatory Considerations

- This application is classified as a **general wellness product** under FDA Digital Health Center of Excellence guidance (2019 Policy for Device Software Functions).
- If any future feature makes a disease-specific claim or guides clinical treatment, the product must be reclassified and cleared as a Software as a Medical Device (SaMD) under 21 CFR Part 882.
- All data handling must comply with HIPAA (for U.S. users) and applicable local privacy regulations (GDPR, DPDP Act) as detailed in the Privacy Architecture document.

### 11.4 Data Accuracy Limitations

- Consumer wearable HRV measurements have been shown to vary ±15–25% from clinical reference standards (Plews et al. 2013).
- VO2 Max estimates from Apple Watch are validated within ±10% of lab values in healthy, non-obese adults but may be less accurate in clinical populations (Bhatt et al. 2021).
- Camera PPG is an emerging technology; scores derived from it carry a `low` confidence flag and should be treated as directional only.
- Self-reported cognitive data (Section 6) reflects subjective perception and may not correlate with objective neuropsychological performance in all users.

---

## 12. References

All references are cited in context within their respective sections. Consolidated list below for completeness.

### Cardiovascular Health

1. Kaminsky, L.A., Arena, R., & Myers, J. (2015). Reference standards for cardiorespiratory fitness measured with cardiopulmonary exercise testing: Data from the Fitness Registry and the Importance of Exercise National Database (FRIEND Registry). *Mayo Clinic Proceedings*, 90(11), 1515–1523.
2. Shaffer, F., & Ginsberg, J.P. (2017). An overview of heart rate variability metrics and norms. *Frontiers in Public Health*, 5, 258.
3. Whelton, P.K., Carey, R.M., Aronow, W.S., et al. (2018). 2017 ACC/AHA/AAPA/ABC/ACPM/AGS/APhA/ASH/ASPC/NMA/PCNA Guideline for the Prevention, Detection, Evaluation, and Management of High Blood Pressure in Adults. *Journal of the American College of Cardiology*, 71(19), e127–e248.

### Metabolic Fitness

4. World Health Organization. (2000). *Obesity: Preventing and Managing the Global Epidemic.* WHO Technical Report Series 894. Geneva: WHO.
5. Battelino, T., Danne, T., Bergenstal, R.M., et al. (2019). Clinical targets for continuous glucose monitoring data interpretation: Recommendations from the International Consensus on Time in Range. *Diabetes Care*, 42(8), 1593–1603.
6. Desprès, J.P., & Lemieux, I. (2006). Abdominal obesity and metabolic syndrome. *Nature*, 444(7121), 881–887.

### Sleep Architecture

7. Hirshkowitz, M., Whiton, K., Albert, S.M., et al. (2015). National Sleep Foundation's sleep time duration recommendations: Methodology and results summary. *Sleep Health*, 1(1), 40–43.
8. Walker, M.P. (2017). *Why We Sleep: Unlocking the Power of Sleep and Dreams.* New York: Scribner.
9. Roenneberg, T., Allebrandt, K.V., Merrow, M., & Vetter, C. (2012). Social jetlag and obesity. *Current Biology*, 22(10), 939–943.

### Recovery Capacity

10. Plews, D.J., Laursen, P.B., Stanley, J., Kilding, A.E., & Buchheit, M. (2013). Training adaptation and heart rate variability in elite endurance athletes: Opening the door to effective monitoring. *Sports Medicine*, 43(9), 773–781.
11. Buchheit, M. (2014). Monitoring training status with HR measures: Do all roads lead to Rome? *Frontiers in Physiology*, 5, 73.
12. Kellmann, M., Bertollo, M., Bosquet, L., et al. (2018). Recovery and performance in sport: Consensus statement. *International Journal of Sports Physiology and Performance*, 13(2), 240–245.

### Cognitive Performance

13. Harrison, Y., & Horne, J.A. (2000). The impact of sleep deprivation on decision making: A review. *Journal of Experimental Psychology: Applied*, 6(3), 236–249.
14. Lambourne, K., & Tomporowski, P. (2010). The effect of exercise-induced arousal on cognitive task performance: A meta-regression analysis. *Brain Research*, 1341, 12–24.
15. Hillman, C.H., Erickson, K.I., & Kramer, A.F. (2008). Be smart, exercise your heart: Exercise effects on brain and cognition. *Nature Reviews Neuroscience*, 9(1), 58–65.

### Longevity Index

16. Crimmins, E.M. (2015). Lifespan and healthspan: Past, present, and promise. *The Gerontologist*, 55(6), 901–911.
17. López-Otín, C., Blasco, M.A., Partridge, L., Serrano, M., & Kroemer, G. (2013). The hallmarks of aging. *Cell*, 153(6), 1194–1217.
18. Ferrucci, L., & Fabbri, E. (2018). Inflammageing: Chronic inflammation in ageing, cardiovascular disease, and frailty. *Nature Reviews Cardiology*, 15(9), 505–522.

### Supplementary / Methodology

19. Nunan, D., Sandercock, G.R.H., & Brodie, D.A. (2010). A quantitative systematic review of normal values for short-term heart rate variability in healthy adults. *Pacing and Clinical Electrophysiology*, 33(11), 1407–1417.
20. Gallagher, D., Heymsfield, S.B., Heo, M., Jebb, S.A., Murgatroyd, P.R., & Sakamoto, Y. (2000). Healthy percentage body fat ranges: An approach for developing guidelines based on body mass index. *American Journal of Clinical Nutrition*, 72(3), 694–701.
21. WHO Expert Consultation. (2004). Appropriate body-mass index for Asian populations and its implications for policy and intervention strategies. *The Lancet*, 363(9403), 157–163.

---

*End of Document*

---

> **Version History**
>
> | Version | Date | Author | Changes |
> |---------|------|--------|---------|
> | 0.1 | 2026-05-22 | Engineering + Clinical Advisory | Initial draft |
> | — | TBD | Chief Physician | Review and sign-off |
> | 1.0 | TBD | Engineering | Production-ready release |

---

## 23. Device Integration Research — Apple Health, Google Health Connect, Fitbit

> **Source:** `device-integration-research.md` — embedded here as the canonical integration reference.  
> **Audience:** Engineering, Mobile, Backend.

**Date:** 2026-05-22
**Status:** Draft — Ready for Engineering Review

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Library Evaluation](#2-library-evaluation)
3. [Full Data Availability Matrix](#3-full-data-availability-matrix)
4. [Permission & Consent Flows](#4-permission--consent-flows)
5. [Fitbit Web API — OAuth2 and Key Endpoints](#5-fitbit-web-api--oauth2-and-key-endpoints)
6. [Data Sync Architecture](#6-data-sync-architecture)
7. [Architecture Diagram](#7-architecture-diagram)
8. [Library Recommendation](#8-library-recommendation)
9. [Phase 1 vs Phase 2 Data Availability Summary](#9-phase-1-vs-phase-2-data-availability-summary)

---

## 1. Executive Summary

The Champions Longevity Dashboard requires real-time and historical biometric data to power six performance systems: Cardiovascular, Metabolic, Sleep Architecture, Recovery Capacity, Cognitive, and Longevity Index. Data must be sourced from multiple device ecosystems — Apple HealthKit (iOS), Google Health Connect (Android), and Fitbit (cross-platform via server-side API) — with fallback to manual entry and camera-based PPG for users without wearables.

This document evaluates the available React Native libraries for native health platform integration, maps data availability across all six systems and all source platforms, specifies the exact permission and consent flows required for App Store and Play Store approval, details the Fitbit OAuth2 server-side integration strategy, and proposes a tiered sync architecture that balances data freshness, battery impact, and third-party API rate limits.

**Key findings:**

- `react-native-health` (HealthKit) and `react-native-health-connect` (Health Connect) are the recommended native libraries. Both are compatible with Expo's custom dev client (expo-dev-client) via bare workflow or config plugins.
- Fitbit integration must be handled server-side (Supabase Edge Function) due to OAuth2 client-secret requirements; Fitbit's API cannot be called directly from a mobile client.
- Apple Watch is required for continuous HRV, SpO2, ECG, skin temperature, and blood oxygen. iPhone-only users have access to a significantly reduced data set.
- Health Connect requires Android 9+ (API 28) but the full data type set (including sleep stages and SpO2) requires Android 14+ (API 34) where Health Connect is built into the OS.
- Phase 1 (MVP) should focus on HealthKit + manual entry. Phase 2 adds Health Connect and Fitbit API.

---

## 2. Library Evaluation

### 2.1 react-native-health (Apple HealthKit)

| Attribute | Detail |
|---|---|
| Repository | https://github.com/agencyenterprise/react-native-health |
| GitHub Stars | ~2,000 |
| Latest Release | v1.x (actively maintained as of 2025) |
| Maintained By | Agency Enterprise — OSS with active community PRs |
| License | MIT |
| Native Module Type | Old Architecture (JSI/TurboModules bridge); New Architecture not yet fully supported |
| Expo Compatibility | **Compatible via expo-dev-client** with a config plugin or bare workflow. Cannot be used in Expo Go. Requires custom development build. |
| iOS Minimum | iOS 13+ |
| Apple Watch | Read data written by Apple Watch companion app via HealthKit; no direct Watch SDK call needed |
| TypeScript | Full TypeScript definitions included |
| Key Limitations | Background delivery requires `HKObserverQuery` setup; not available in managed Expo workflow |
| Installation | `npx expo install react-native-health` then add config plugin to `app.json` |

**Config plugin entry (`app.json`):**

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-health",
        {
          "iCloudContainerEnvironment": "Production"
        }
      ]
    ]
  }
}
```

**Maturity Assessment:** Production-ready. Used in thousands of health apps. The most mature HealthKit binding available for React Native. Has coverage for all HKQuantityType, HKCategoryType, HKCorrelationType, and HKWorkoutType identifiers relevant to this project.

---

### 2.2 react-native-health-connect (Google Health Connect)

| Attribute | Detail |
|---|---|
| Repository | https://github.com/matinzd/react-native-health-connect |
| GitHub Stars | ~600 |
| Latest Release | v3.x (active) |
| Maintained By | Community-maintained; Matinzd (primary) + contributors |
| License | MIT |
| Native Module Type | Supports New Architecture (TurboModules) in v3+ |
| Expo Compatibility | **Compatible via expo-dev-client** with config plugin. Expo Go not supported. |
| Android Minimum | Android 9 (API 28) for Health Connect app; Android 14 (API 34) for built-in Health Connect |
| TypeScript | Full TypeScript definitions |
| Key Limitations | Health Connect must be installed from Play Store on Android 9-13; pre-installed on Android 14+. Data availability varies greatly by Android version and installed wearable apps. |
| Installation | `npx expo install react-native-health-connect` |

**Alternative considered:** `@kingstinct/react-native-healthkit` — excellent TypeScript-first alternative for HealthKit but smaller community (700 stars). Evaluated and rejected in favor of react-native-health due to broader data type coverage and more documentation.

**Maturity Assessment:** Newer but rapidly maturing. Health Connect itself is relatively new (GA 2022). Library covers all major record types. Background sync requires WorkManager setup.

---

### 2.3 Fitbit via Fitbit Web API (Server-Side)

| Attribute | Detail |
|---|---|
| API Version | Fitbit Web API v1 (stable) |
| Authentication | OAuth2 Authorization Code Flow with PKCE |
| Client Secret | Required — must never be exposed in mobile client |
| Integration Pattern | Supabase Edge Function acts as OAuth2 proxy and data fetcher |
| Rate Limits | 150 API calls per user per hour (per resource type) |
| Webhook / Push | Fitbit Subscriptions API (push notifications to server endpoint) |
| Data Granularity | Intraday data available at 1-min intervals for heart rate, steps, calories (requires Partner API access for full intraday) |
| Device Support | All Fitbit trackers and smartwatches; Fitbit app on Android/iOS |
| React Native Library | None recommended — all calls go through Supabase Edge Function |
| Expo Compatibility | N/A (server-side only) |

**Why server-side only:** The Fitbit OAuth2 flow requires a `client_secret` that cannot be embedded in a mobile app binary (App Store / Play Store policies and basic security practice). The Supabase Edge Function serves as the OAuth2 callback handler, token store, and data proxy.

---

### 2.4 Library Comparison Summary

| Criteria | react-native-health | react-native-health-connect | Fitbit Web API |
|---|---|---|---|
| Platform | iOS only | Android only | iOS + Android (server) |
| Stars | ~2,000 | ~600 | N/A |
| Expo Dev Client | Yes (config plugin) | Yes (config plugin) | N/A |
| New Architecture | Partial | Yes (v3+) | N/A |
| Maintenance | Active | Active | Fitbit-maintained |
| Data Richness | Excellent | Good | Good |
| Background Sync | HKObserverQuery | WorkManager | Fitbit Subscriptions API |
| Production Readiness | High | Medium-High | High |

---

## 3. Full Data Availability Matrix

The following matrix maps each data point required by the six performance systems against its availability in each data source. Availability codes:

- **Y** — Available, standard access
- **Y*** — Available, requires specific hardware (noted)
- **P** — Partial or derived (calculation required)
- **N** — Not available
- **M** — Manual entry only
- **[AW]** — Requires Apple Watch (not iPhone-only)
- **[A14]** — Requires Android 14+ (API 34) for Health Connect
- **[PA]** — Requires Fitbit Partner API (additional approval from Fitbit)

---

### 3.1 Cardiovascular System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Resting Heart Rate | `HKQuantityTypeIdentifierRestingHeartRate` | Y | Y (`RestingHeartRateRecord`) | Y (`/heart`) | P | Y |
| Heart Rate (current) | `HKQuantityTypeIdentifierHeartRate` | Y [AW] | Y (`HeartRateRecord`) | Y (`/heart`) | Y | Y |
| Heart Rate Variability (SDNN) | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Y [AW] | Y (`HeartRateVariabilityRmssdRecord`) [A14] | Y (`/hrv`) | P | Y |
| VO2 Max | `HKQuantityTypeIdentifierVO2Max` | Y [AW] | Y (`Vo2MaxRecord`) [A14] | Y (estimated) | N | Y |
| Cardio Fitness Score | `HKQuantityTypeIdentifierVO2Max` | Y [AW] | P | P | N | Y |
| Blood Pressure (systolic) | `HKQuantityTypeIdentifierBloodPressureSystolic` | Y (manual/cuff) | Y (`BloodPressureRecord`) | N | N | Y |
| Blood Pressure (diastolic) | `HKQuantityTypeIdentifierBloodPressureDiastolic` | Y (manual/cuff) | Y (`BloodPressureRecord`) | N | N | Y |
| ECG / Atrial Fibrillation | `HKDataTypeIdentifierElectrocardiogram` | Y [AW] | N | N | N | N |
| Workout Heart Rate Zones | `HKQuantityTypeIdentifierHeartRate` (during workout) | Y [AW] | Y (`ExerciseSessionRecord`) | Y | N | Y |
| Peripheral Perfusion Index | N/A in HealthKit | N | N | N | P | N |

---

### 3.2 Metabolic System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Active Energy Burned | `HKQuantityTypeIdentifierActiveEnergyBurned` | Y | Y (`ActiveCaloriesBurnedRecord`) | Y (`/activities`) | N | Y |
| Basal Energy Burned | `HKQuantityTypeIdentifierBasalEnergyBurned` | Y | Y (`BasalMetabolicRateRecord`) | Y (estimated) | N | Y |
| Step Count | `HKQuantityTypeIdentifierStepCount` | Y | Y (`StepsRecord`) | Y (`/activities/steps`) | N | Y |
| Distance Walking/Running | `HKQuantityTypeIdentifierDistanceWalkingRunning` | Y | Y (`DistanceRecord`) | Y (`/activities/distance`) | N | Y |
| Blood Glucose | `HKQuantityTypeIdentifierBloodGlucose` | Y (CGM/manual) | Y (`BloodGlucoseRecord`) | N | N | Y |
| Dietary Carbohydrates | `HKQuantityTypeIdentifierDietaryCarbohydrates` | Y (manual/app) | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |
| Dietary Protein | `HKQuantityTypeIdentifierDietaryProtein` | Y | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |
| Dietary Fat | `HKQuantityTypeIdentifierDietaryFat` | Y | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |
| Body Mass | `HKQuantityTypeIdentifierBodyMass` | Y | Y (`WeightRecord`) | Y (`/body/weight`) | N | Y |
| Body Fat Percentage | `HKQuantityTypeIdentifierBodyFatPercentage` | Y | Y (`BodyFatRecord`) | Y (`/body/fat`) | N | Y |
| BMI | `HKQuantityTypeIdentifierBodyMassIndex` | Y | Y (`BmiRecord`) | Y (derived) | N | Y |
| Lean Body Mass | `HKQuantityTypeIdentifierLeanBodyMass` | Y | N | N | N | Y |
| Waist Circumference | `HKQuantityTypeIdentifierWaistCircumference` | Y | N | N | N | Y |
| Insulin Delivery | `HKQuantityTypeIdentifierInsulinDelivery` | Y | N | N | N | Y |
| Water Intake | `HKQuantityTypeIdentifierDietaryWater` | Y | Y (`HydrationRecord`) | Y (`/foods/water`) | N | Y |

---

### 3.3 Sleep Architecture System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Total Sleep Time | `HKCategoryTypeIdentifierSleepAnalysis` | Y [AW preferred] | Y (`SleepSessionRecord`) [A14] | Y (`/sleep`) | N | Y |
| Time in Bed | `HKCategoryTypeIdentifierSleepAnalysis` | Y | Y (`SleepSessionRecord`) [A14] | Y (`/sleep`) | N | Y |
| Sleep Stages (REM) | `HKCategoryValueSleepAnalysisAsleepREM` | Y [AW] | Y (`SleepStageRecord`) [A14] | Y (`/sleep`) | N | N |
| Sleep Stages (Deep/SWS) | `HKCategoryValueSleepAnalysisAsleepDeep` | Y [AW] | Y (`SleepStageRecord`) [A14] | Y (`/sleep`) | N | N |
| Sleep Stages (Light) | `HKCategoryValueSleepAnalysisAsleepCore` | Y [AW] | Y (`SleepStageRecord`) [A14] | Y (`/sleep`) | N | N |
| Wake After Sleep Onset | Derived from `HKCategoryTypeIdentifierSleepAnalysis` | P | P | Y (`/sleep`) | N | N |
| Sleep Onset Latency | Derived from `HKCategoryTypeIdentifierSleepAnalysis` | P | P | Y (`/sleep`) | N | Y |
| Sleep Efficiency | Derived metric | P | P | Y (`/sleep`) | N | N |
| Respiratory Rate (sleep) | `HKQuantityTypeIdentifierRespiratoryRate` | Y [AW] | Y (`RespiratoryRateRecord`) [A14] | Y (Fitbit Sense/Versa 3+) | N | N |
| Blood Oxygen (SpO2, sleep) | `HKQuantityTypeIdentifierOxygenSaturation` | Y [AW] | Y (`OxygenSaturationRecord`) [A14] | Y (Fitbit Sense/Versa 3+) | N | N |
| Snoring Detection | N/A in HealthKit | N | N | N | N | Y (app) |
| Heart Rate During Sleep | `HKQuantityTypeIdentifierHeartRate` | Y [AW] | Y [A14] | Y | N | N |
| HRV During Sleep | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Y [AW] | Y [A14] | Y (`/hrv`) | N | N |

**Note:** Sleep stage data on Apple Watch requires watchOS 9+ (Series 4 or newer). Sleep stages in Health Connect require Android 14+ and a compatible app (e.g., Samsung Health, Fitbit) writing stage-level data.

---

### 3.4 Recovery Capacity System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| HRV (SDNN, resting) | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Y [AW] | Y [A14] | Y (`/hrv`) | P | Y |
| Resting Heart Rate Trend | `HKQuantityTypeIdentifierRestingHeartRate` | Y | Y | Y | P | Y |
| Skin Temperature | `HKQuantityTypeIdentifierAppleSleepingWristTemperature` | Y [AW, watchOS 9+] | N | Y (Fitbit Sense/Versa 3+ only) | N | N |
| Blood Oxygen (SpO2) | `HKQuantityTypeIdentifierOxygenSaturation` | Y [AW] | Y [A14] | Y (Fitbit Sense/Versa 3+) | N | Y |
| Respiratory Rate | `HKQuantityTypeIdentifierRespiratoryRate` | Y [AW] | Y [A14] | Y (Fitbit Sense+) | N | N |
| Workout Recovery HR | Derived from `HKQuantityTypeIdentifierHeartRate` | P [AW] | P | N | N | Y |
| Exercise Load / Strain | Derived metric (ATL/CTL) | P | P | N | N | Y |
| Perceived Exertion (RPE) | N/A | N | N | N | N | Y |
| Muscle Soreness | N/A | N | N | N | N | Y |
| Readiness Score | N/A in HealthKit | N | N | N | N | Y (derived) |

**Note:** `HKQuantityTypeIdentifierAppleSleepingWristTemperature` is available only on Apple Watch Series 8+ and Ultra. Fitbit skin temperature is available on Fitbit Sense, Sense 2, Versa 3, and Versa 4 only.

---

### 3.5 Cognitive Performance System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| Mindful Minutes | `HKCategoryTypeIdentifierMindfulSession` | Y | N | N | N | Y |
| Mood / Mental State | N/A in HealthKit | N | N | N | N | Y |
| Perceived Stress Level | N/A in HealthKit | N | N | N | N | Y |
| Reaction Time | N/A in HealthKit | N | N | N | N | Y (in-app test) |
| Cognitive Fatigue | N/A in HealthKit | N | N | N | N | Y (in-app test) |
| Screen Time | N/A in HealthKit | N | N | N | N | Y (iOS Screen Time API — separate) |
| Audio Exposure | `HKQuantityTypeIdentifierEnvironmentalAudioExposure` | Y | N | N | N | N |
| Sleep-Cognition Correlation | Derived | P | P | P | N | P |
| Alcohol Consumption | `HKQuantityTypeIdentifierNumberOfAlcoholicBeverages` | Y | N | N | N | Y |
| Caffeine Intake | `HKQuantityTypeIdentifierDietaryCaffeine` | Y | Y (`NutritionRecord`) | Y (`/foods`) | N | Y |

**Note:** Cognitive data is the weakest category for passive device collection. The majority of cognitive metrics require in-app assessments or manual entry. Future integrations could include Oura Ring (via unofficial API) or WHOOP for readiness/strain scores.

---

### 3.6 Longevity Index System

| Data Point | HealthKit Identifier | Apple HealthKit | Google Health Connect | Fitbit API | Camera PPG | Manual |
|---|---|---|---|---|---|---|
| VO2 Max | `HKQuantityTypeIdentifierVO2Max` | Y [AW] | Y [A14] | Y (estimated) | N | Y |
| Grip Strength | N/A in HealthKit | N | N | N | N | Y |
| Gait Speed | `HKQuantityTypeIdentifierWalkingSpeed` | Y | N | N | N | Y |
| Six-Minute Walk Test | Derived from `HKQuantityTypeIdentifierDistanceWalkingRunning` | P | P | P | N | Y |
| Standing Time | `HKQuantityTypeIdentifierAppleStandTime` | Y [AW] | N | N | N | N |
| Low Heart Rate Events | `HKCategoryTypeIdentifierLowHeartRateEvent` | Y [AW] | N | N | N | N |
| High Heart Rate Events | `HKCategoryTypeIdentifierHighHeartRateEvent` | Y [AW] | N | N | N | N |
| Irregular Rhythm Notifications | `HKCategoryTypeIdentifierIrregularHeartRhythmEvent` | Y [AW] | N | N | N | N |
| Walking Heart Rate Average | `HKQuantityTypeIdentifierWalkingHeartRateAverage` | Y [AW] | N | N | N | N |
| Stair Climbing Speed | `HKQuantityTypeIdentifierStairAscentSpeed` | Y [AW] | N | N | N | N |
| Double Support Percentage | `HKQuantityTypeIdentifierWalkingDoubleSupportPercentage` | Y | N | N | N | N |
| Walking Asymmetry | `HKQuantityTypeIdentifierWalkingAsymmetryPercentage` | Y | N | N | N | N |
| Apple Fitness Age (Cardio) | Derived from VO2 Max | P [AW] | P | P | N | P |

---

## 4. Permission & Consent Flows

### 4.1 Apple HealthKit (iOS)

#### 4.1.1 Info.plist Keys

The following keys are required in `ios/[AppName]/Info.plist`. With react-native-health and the config plugin, these are automatically injected during `expo prebuild`. Verify their presence after prebuild.

```xml
<!-- Required: Explain why the app reads health data -->
<key>NSHealthShareUsageDescription</key>
<string>Champions Longevity Dashboard reads your health data to calculate your six performance scores and track your longevity metrics over time.</string>

<!-- Required: Explain why the app writes health data (if applicable) -->
<key>NSHealthUpdateUsageDescription</key>
<string>Champions Longevity Dashboard may write mindfulness sessions and manual health entries to Apple Health so your data stays in sync.</string>

<!-- Required for HealthKit entitlement -->
<key>com.apple.developer.healthkit</key>
<true/>

<!-- Required for background delivery (if used) -->
<key>com.apple.developer.healthkit.background-delivery</key>
<true/>
```

#### 4.1.2 Entitlements File

The `ios/[AppName]/[AppName].entitlements` file must include:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.developer.healthkit</key>
  <true/>
  <key>com.apple.developer.healthkit.background-delivery</key>
  <true/>
</dict>
</plist>
```

This entitlement must also be enabled in the Apple Developer Portal under the app's identifier capabilities.

#### 4.1.3 Permission Request Code (React Native)

```typescript
import AppleHealthKit, {
  HealthKitPermissions,
  HealthPermission,
} from 'react-native-health';

const HEALTHKIT_PERMISSIONS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.RestingHeartRate,
      AppleHealthKit.Constants.Permissions.HeartRateVariability,
      AppleHealthKit.Constants.Permissions.VO2Max,
      AppleHealthKit.Constants.Permissions.OxygenSaturation,
      AppleHealthKit.Constants.Permissions.RespiratoryRate,
      AppleHealthKit.Constants.Permissions.SleepAnalysis,
      AppleHealthKit.Constants.Permissions.Steps,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      AppleHealthKit.Constants.Permissions.BasalEnergyBurned,
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.BodyFatPercentage,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
      AppleHealthKit.Constants.Permissions.BloodPressureDiastolic,
      AppleHealthKit.Constants.Permissions.BloodPressureSystolic,
      AppleHealthKit.Constants.Permissions.MindfulSession,
      AppleHealthKit.Constants.Permissions.WalkingSpeed,
      AppleHealthKit.Constants.Permissions.StairAscentSpeed,
      AppleHealthKit.Constants.Permissions.WalkingHeartRateAverage,
      AppleHealthKit.Constants.Permissions.AppleStandTime,
      AppleHealthKit.Constants.Permissions.EnvironmentalAudioExposure,
      AppleHealthKit.Constants.Permissions.Electrocardiogram,
    ],
    write: [
      AppleHealthKit.Constants.Permissions.MindfulSession,
      AppleHealthKit.Constants.Permissions.BodyMass,
      AppleHealthKit.Constants.Permissions.BloodGlucose,
    ],
  },
};

export async function requestHealthKitPermissions(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(HEALTHKIT_PERMISSIONS, (error: string) => {
      if (error) {
        console.error('HealthKit initialization error:', error);
        reject(new Error(error));
        return;
      }
      resolve(true);
    });
  });
}
```

**Important UX note:** Apple does not allow the app to know which specific permissions the user granted or denied. The permission sheet is shown once; subsequent calls to `initHealthKit` do not re-show the sheet. Always gracefully handle the case where data returns empty (user may have denied that specific type).

---

### 4.2 Google Health Connect (Android)

#### 4.2.1 AndroidManifest.xml Permissions

```xml
<!-- In android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <!-- Health Connect permissions — each data type requires its own permission -->
  <uses-permission android:name="android.permission.health.READ_HEART_RATE"/>
  <uses-permission android:name="android.permission.health.READ_RESTING_HEART_RATE"/>
  <uses-permission android:name="android.permission.health.READ_HEART_RATE_VARIABILITY"/>
  <uses-permission android:name="android.permission.health.READ_OXYGEN_SATURATION"/>
  <uses-permission android:name="android.permission.health.READ_RESPIRATORY_RATE"/>
  <uses-permission android:name="android.permission.health.READ_SLEEP"/>
  <uses-permission android:name="android.permission.health.READ_STEPS"/>
  <uses-permission android:name="android.permission.health.READ_ACTIVE_CALORIES_BURNED"/>
  <uses-permission android:name="android.permission.health.READ_BASAL_METABOLIC_RATE"/>
  <uses-permission android:name="android.permission.health.READ_WEIGHT"/>
  <uses-permission android:name="android.permission.health.READ_BODY_FAT"/>
  <uses-permission android:name="android.permission.health.READ_BLOOD_GLUCOSE"/>
  <uses-permission android:name="android.permission.health.READ_BLOOD_PRESSURE"/>
  <uses-permission android:name="android.permission.health.READ_NUTRITION"/>
  <uses-permission android:name="android.permission.health.READ_HYDRATION"/>
  <uses-permission android:name="android.permission.health.READ_VO2_MAX"/>
  <uses-permission android:name="android.permission.health.READ_DISTANCE"/>
  <uses-permission android:name="android.permission.health.READ_EXERCISE"/>

  <!-- Write permissions (if needed) -->
  <uses-permission android:name="android.permission.health.WRITE_WEIGHT"/>
  <uses-permission android:name="android.permission.health.WRITE_BLOOD_GLUCOSE"/>
  <uses-permission android:name="android.permission.health.WRITE_NUTRITION"/>

  <application ...>

    <!-- Required: Activity to handle Health Connect permission rationale -->
    <activity
      android:name=".HealthConnectPermissionRationaleActivity"
      android:exported="true">
      <intent-filter>
        <action android:name="androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE"/>
      </intent-filter>
    </activity>

    <!-- Required: Privacy Policy link shown in Health Connect UI -->
    <meta-data
      android:name="health_connect_privacy_policy_url"
      android:value="https://championshealth.app/privacy"/>

  </application>
</manifest>
```

#### 4.2.2 Health Connect Permission Request Code

```typescript
import {
  initialize,
  requestPermission,
  Permission,
} from 'react-native-health-connect';

const HEALTH_CONNECT_PERMISSIONS: Permission[] = [
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'HeartRateVariabilityRmssd' },
  { accessType: 'read', recordType: 'OxygenSaturation' },
  { accessType: 'read', recordType: 'RespiratoryRate' },
  { accessType: 'read', recordType: 'SleepSession' },
  { accessType: 'read', recordType: 'Steps' },
  { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
  { accessType: 'read', recordType: 'BasalMetabolicRate' },
  { accessType: 'read', recordType: 'Weight' },
  { accessType: 'read', recordType: 'BodyFat' },
  { accessType: 'read', recordType: 'BloodGlucose' },
  { accessType: 'read', recordType: 'BloodPressure' },
  { accessType: 'read', recordType: 'Nutrition' },
  { accessType: 'read', recordType: 'Hydration' },
  { accessType: 'read', recordType: 'Vo2Max' },
  { accessType: 'read', recordType: 'Distance' },
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'write', recordType: 'Weight' },
];

export async function requestHealthConnectPermissions(): Promise<boolean> {
  // Initialize Health Connect SDK
  const isInitialized = await initialize();
  if (!isInitialized) {
    // Health Connect not installed — prompt user to install from Play Store
    // On Android 14+, Health Connect is built-in; initialization always returns true
    console.warn('Health Connect is not available on this device/Android version');
    return false;
  }

  const grantedPermissions = await requestPermission(HEALTH_CONNECT_PERMISSIONS);
  
  // grantedPermissions is an array of Permission objects that were granted
  const readHeartRateGranted = grantedPermissions.some(
    (p) => p.recordType === 'HeartRate' && p.accessType === 'read'
  );

  return grantedPermissions.length > 0;
}
```

**Android version matrix:**

| Android Version | Health Connect Status | Sleep Stages | SpO2 | Notes |
|---|---|---|---|---|
| Android 9-12 (API 28-32) | Install from Play Store | N | N | Limited data type support |
| Android 13 (API 33) | Install from Play Store | Y | Y | Most types available |
| Android 14+ (API 34) | Built into OS | Y | Y | Full support, no install needed |

#### 4.2.3 Play Store Requirements

To publish an app using Health Connect on the Play Store, developers must:

1. Complete the Health Connect permission declaration form in Play Console.
2. Include a link to a privacy policy that explicitly mentions each permission used.
3. Implement the `ACTION_SHOW_PERMISSIONS_RATIONALE` activity (see manifest above).
4. Not use Health Connect data for advertising or selling to third parties.

---

### 4.3 Fitbit OAuth2 Scopes

Fitbit uses OAuth2 Authorization Code flow with PKCE. Scopes are requested during the authorization redirect. The following scopes are needed for Champions Longevity Dashboard:

| Scope | Data Accessible |
|---|---|
| `activity` | Steps, distance, floors, active minutes, exercise logs |
| `heartrate` | Resting heart rate, heart rate time series, heart rate zones |
| `sleep` | Sleep logs, sleep stages, sleep summary |
| `weight` | Body weight, BMI, body fat percentage logs |
| `nutrition` | Food logs, water logs, calories consumed |
| `oxygen_saturation` | SpO2 daily summary and intraday (Sense/Versa 3+ only) |
| `respiratory_rate` | Breathing rate during sleep (Sense/Versa 3+ only) |
| `temperature` | Skin temperature deviation during sleep (Sense/Versa 3+ only) |
| `heartrate_variability` | HRV during sleep (Sense/Versa 3+ only) |
| `cardio_fitness` | Cardio fitness score (VO2 Max estimate) |
| `profile` | User's display name, age, gender (for score normalization) |

**Authorization URL format:**

```
https://www.fitbit.com/oauth2/authorize
  ?response_type=code
  &client_id={CLIENT_ID}
  &redirect_uri={REDIRECT_URI}
  &scope=activity+heartrate+sleep+weight+nutrition+oxygen_saturation+respiratory_rate+temperature+heartrate_variability+cardio_fitness+profile
  &code_challenge={CODE_CHALLENGE}
  &code_challenge_method=S256
  &state={STATE}
```

---

## 5. Fitbit Web API — OAuth2 and Key Endpoints

### 5.1 OAuth2 Flow via Supabase Edge Function

The Fitbit OAuth2 Authorization Code + PKCE flow must be handled server-side. The React Native app initiates the flow using `expo-web-browser` to open the Fitbit authorization page, and the Supabase Edge Function handles the callback, token exchange, and storage.

```
Mobile App                    Supabase Edge Function              Fitbit API
    |                                    |                              |
    |-- 1. Generate PKCE code_verifier --|                              |
    |   and code_challenge               |                              |
    |                                    |                              |
    |-- 2. Open Fitbit auth URL -------->|                              |
    |   (via expo-web-browser)           |                              |
    |                                    |                              |
    |                                    |-- 3. User logs in, grants -->|
    |                                    |   permissions                |
    |                                    |                              |
    |<-- 4. Redirect to app scheme ------|                              |
    |   with auth code                   |                              |
    |                                    |                              |
    |-- 5. Send code + code_verifier --> |                              |
    |   to Edge Function                 |                              |
    |                                    |-- 6. POST token exchange --->|
    |                                    |   (code + client_secret)     |
    |                                    |                              |
    |                                    |<-- 7. access_token,          |
    |                                    |   refresh_token, expires_in  |
    |                                    |                              |
    |                                    |-- 8. Store tokens encrypted  |
    |                                    |   in Supabase DB             |
    |                                    |                              |
    |<-- 9. Return success to app -------|                              |
```

#### 5.1.1 Supabase Edge Function: Token Exchange

```typescript
// supabase/functions/fitbit-auth/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FITBIT_CLIENT_ID = Deno.env.get('FITBIT_CLIENT_ID')!;
const FITBIT_CLIENT_SECRET = Deno.env.get('FITBIT_CLIENT_SECRET')!;
const FITBIT_REDIRECT_URI = Deno.env.get('FITBIT_REDIRECT_URI')!;

serve(async (req: Request) => {
  const { code, code_verifier, user_id } = await req.json();

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: FITBIT_REDIRECT_URI,
      code_verifier,
    }),
  });

  if (!tokenResponse.ok) {
    return new Response(
      JSON.stringify({ error: 'Token exchange failed' }),
      { status: 400 }
    );
  }

  const tokens = await tokenResponse.json();
  // tokens: { access_token, refresh_token, expires_in, token_type, scope, user_id }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Store tokens encrypted — never store in plain text in production
  await supabase.from('fitbit_credentials').upsert({
    user_id,
    fitbit_user_id: tokens.user_id,
    access_token: tokens.access_token, // encrypt with Supabase Vault in production
    refresh_token: tokens.refresh_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    scopes: tokens.scope,
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
});
```

#### 5.1.2 Token Refresh Logic

Fitbit access tokens expire after 8 hours. Refresh tokens are valid for 8 hours or until used (rolling). The Edge Function must check expiry before each API call:

```typescript
async function getFreshFitbitToken(userId: string, supabase: SupabaseClient): Promise<string> {
  const { data: creds } = await supabase
    .from('fitbit_credentials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (new Date(creds.expires_at) > new Date(Date.now() + 60_000)) {
    return creds.access_token; // Still valid for > 1 minute
  }

  // Refresh the token
  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${FITBIT_CLIENT_ID}:${FITBIT_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: creds.refresh_token,
    }),
  });

  const newTokens = await response.json();

  await supabase.from('fitbit_credentials').update({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString(),
  }).eq('user_id', userId);

  return newTokens.access_token;
}
```

---

### 5.2 Key Fitbit API Endpoints

All requests use `Authorization: Bearer {access_token}`. Base URL: `https://api.fitbit.com`

| System | Endpoint | Response Key Fields |
|---|---|---|
| Heart Rate (daily summary) | `GET /1/user/-/activities/heart/date/{date}/1d.json` | `restingHeartRate`, `heartRateZones` |
| Heart Rate (intraday) [PA] | `GET /1/user/-/activities/heart/date/{date}/1d/1min.json` | `dataset[].value`, `dataset[].time` |
| HRV (daily) | `GET /1/user/-/hrv/date/{date}.json` | `hrv[].value.dailyRmssd`, `hrv[].value.deepRmssd` |
| Sleep (summary) | `GET /1.2/user/-/sleep/date/{date}.json` | `summary.stages`, `summary.totalMinutesAsleep` |
| Sleep (date range) | `GET /1.2/user/-/sleep/date/{startDate}/{endDate}.json` | Array of sleep logs |
| SpO2 (daily) | `GET /1/user/-/spo2/date/{date}.json` | `value.avg`, `value.min`, `value.max` |
| SpO2 (intraday) [PA] | `GET /1/user/-/spo2/date/{date}/all.json` | `minutes[].minute`, `minutes[].value` |
| Breathing Rate (sleep) | `GET /1/user/-/br/date/{date}.json` | `br[].value.breathingRate` |
| Skin Temperature | `GET /1/user/-/temp/skin/date/{date}.json` | `tempSkin[].value.nightlyRelative` |
| Steps (daily) | `GET /1/user/-/activities/steps/date/{date}/1d.json` | `activities-steps[].value` |
| Active Calories | `GET /1/user/-/activities/calories/date/{date}/1d.json` | `activities-calories[].value` |
| Body Weight | `GET /1/user/-/body/log/weight/date/{date}.json` | `weight[].weight`, `weight[].bmi`, `weight[].fat` |
| Cardio Fitness (VO2 Max) | `GET /1/user/-/cardioscore/date/{date}.json` | `cardioScore[].value.vo2Max` |
| Food Log | `GET /1/user/-/foods/log/date/{date}.json` | `foods[].nutritionalValues` |
| Water Log | `GET /1/user/-/foods/log/water/date/{date}.json` | `water[].amount` |
| Profile | `GET /1/user/-/profile.json` | `user.age`, `user.gender`, `user.height` |

**[PA]** = Requires Fitbit Partner API access (free to apply, but requires Fitbit/Google approval)

---

### 5.3 Rate Limits

| Limit Type | Limit | Notes |
|---|---|---|
| Per-user hourly limit | 150 requests/hour per user | Resets at the top of each hour UTC |
| App-level limit | 3,500 requests/hour total across all users | Rarely hit in early-stage apps |
| Intraday data limit [PA] | Same as standard; requires Partner access | Apply at dev.fitbit.com |
| Subscription limit | 1 subscription per user per collection type | Used for push notifications |

**Rate limit headers returned with every response:**

```
Fitbit-Rate-Limit-Limit: 150
Fitbit-Rate-Limit-Remaining: 143
Fitbit-Rate-Limit-Reset: 1234 (seconds until reset)
```

The Supabase Edge Function must check `Fitbit-Rate-Limit-Remaining` before each request and implement exponential backoff if approaching the limit.

---

### 5.4 Fitbit Subscriptions API (Webhooks)

For near-real-time data updates, register a subscription per user. Fitbit will POST to the Edge Function endpoint when new data is available (typically within 10-30 minutes of sync).

**Register a subscription:**

```
POST https://api.fitbit.com/1/user/-/activities.json
Authorization: Bearer {access_token}
```

**Subscription types:** `activities`, `body`, `foods`, `sleep`, `userRevokedAccess`

**Webhook payload verification:** Fitbit sends a `X-Fitbit-Signature` header using HMAC-SHA1 with the client secret. Always verify this signature in the Edge Function before processing.

---

## 6. Data Sync Architecture

### 6.1 Sync Strategy Overview

Three sync patterns are used depending on data source and user action:

| Pattern | Trigger | Latency | Battery Impact | Best For |
|---|---|---|---|---|
| On-Demand Pull | User opens app or taps refresh | Seconds | Low (single burst) | HealthKit, Health Connect, Fitbit |
| Background Fetch | OS-scheduled app wake (iOS) or WorkManager (Android) | 15 min - hours | Medium | HealthKit summary data |
| Server-Side Cron | Supabase scheduled function | Configurable (e.g., every 30 min) | None (server) | Fitbit API, historical backfill |

---

### 6.2 On-Demand Sync (Primary Pattern)

Used when the user opens the app or navigates to a dashboard. Pull the last 24-48 hours of data from HealthKit / Health Connect and the last sync date from Fitbit via the Edge Function.

```typescript
// hooks/useHealthSync.ts
import { useCallback } from 'react';
import { requestHealthKitPermissions, fetchHealthKitData } from '../services/healthkit';
import { fetchFitbitDataViaEdgeFunction } from '../services/fitbit';
import { supabase } from '../lib/supabase';

export function useHealthSync() {
  const syncAll = useCallback(async (userId: string) => {
    const lastSync = await getLastSyncTimestamp(userId);
    const now = new Date();

    // Run in parallel — HealthKit and Fitbit are independent
    const [healthKitData, fitbitData] = await Promise.allSettled([
      fetchHealthKitData({ startDate: lastSync, endDate: now }),
      fetchFitbitDataViaEdgeFunction({ userId, startDate: lastSync, endDate: now }),
    ]);

    // Upsert to Supabase, handling partial failures gracefully
    await upsertBiometricData(userId, healthKitData, fitbitData);
    await updateLastSyncTimestamp(userId, now);
  }, []);

  return { syncAll };
}
```

---

### 6.3 Background Fetch (iOS — HealthKit Observer Queries)

For continuous updates without user interaction, register `HKObserverQuery` for key metrics. iOS will wake the app in the background when new data arrives (typically when Apple Watch syncs).

```typescript
// This must be called during app initialization, not on-demand
import AppleHealthKit from 'react-native-health';

export function registerHealthKitBackgroundObservers() {
  // Background delivery must be enabled per data type
  AppleHealthKit.enableBackgroundDelivery(
    {
      type: AppleHealthKit.Constants.Permissions.HeartRateVariability,
      frequency: AppleHealthKit.Constants.Frequencies.Immediate,
    },
    (error, result) => {
      if (error) console.error('Background delivery registration error:', error);
      else console.log('HRV background delivery enabled:', result);
    }
  );

  AppleHealthKit.enableBackgroundDelivery(
    {
      type: AppleHealthKit.Constants.Permissions.SleepAnalysis,
      frequency: AppleHealthKit.Constants.Frequencies.Daily,
    },
    (error, result) => {
      if (error) console.error('Background delivery registration error:', error);
    }
  );
}
```

**Important:** Background delivery requires the `com.apple.developer.healthkit.background-delivery` entitlement. Apple limits how frequently the OS will wake the app based on the data type's update frequency. Frequency options: `Immediate`, `Hourly`, `Daily`, `Weekly`.

---

### 6.4 Server-Side Cron (Fitbit via Supabase)

Fitbit data is pulled on a schedule by a Supabase Edge Function invoked via Supabase's `pg_cron` extension or an external cron service (e.g., GitHub Actions, Supabase Dashboard scheduled functions).

```sql
-- In Supabase SQL Editor: schedule Fitbit sync every 30 minutes
select cron.schedule(
  'fitbit-sync-job',
  '*/30 * * * *',
  $$
  select net.http_post(
    url := 'https://{project-ref}.supabase.co/functions/v1/fitbit-sync',
    headers := '{"Authorization": "Bearer {SUPABASE_SERVICE_ROLE_KEY}", "Content-Type": "application/json"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  );
  $$
);
```

The `fitbit-sync` Edge Function queries all users with valid (non-expired, non-revoked) Fitbit credentials and fetches yesterday's and today's data for each. It respects the per-user rate limit by processing users sequentially with a delay between each.

---

### 6.5 Battery & Rate Limit Considerations

| Concern | Mitigation |
|---|---|
| HealthKit battery drain | Use `enableBackgroundDelivery` sparingly; only register for high-value types (HRV, sleep, resting HR). Query date ranges, not individual data points. |
| Health Connect battery drain | Use WorkManager with `NetworkType.CONNECTED` and periodic constraints (minimum 15 min interval). |
| Fitbit rate limit (150/user/hr) | Batch fetch: one call per data category covering a date range rather than per-day calls. Cache results in Supabase. Implement `Retry-After` handling. |
| Redundant syncs | Track `last_synced_at` per data source per user in Supabase. Skip sync if last sync was < 15 minutes ago. |
| App Store background refresh | iOS may restrict background fetch frequency for apps that users rarely open. Prefer foreground on-demand sync as the primary pattern. |
| Fitbit webhook deduplication | Fitbit may send duplicate subscription notifications. Use idempotent upserts in the database keyed on `(user_id, data_type, timestamp)`. |

---

## 7. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CHAMPIONS LONGEVITY DASHBOARD                            │
│                    React Native (Expo + expo-dev-client)                    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
          ┌─────────▼──────┐ ┌─────▼──────┐ ┌────▼──────────┐
          │  iOS Device     │ │ Android     │ │  Camera PPG   │
          │                 │ │ Device      │ │  (In-App)     │
          │  react-native-  │ │             │ │               │
          │  health         │ │ react-      │ │  Vision       │
          │  (HealthKit)    │ │ native-     │ │  Camera /     │
          │                 │ │ health-     │ │  expo-camera  │
          │  HKQuantityType │ │ connect     │ │               │
          │  HKCategoryType │ │ (Health     │ │  Resting HR   │
          │  HKWorkoutType  │ │  Connect)   │ │  HRV estimate │
          └────────┬────────┘ └─────┬──────┘ └───────┬───────┘
                   │                │                  │
          ┌────────▼────────────────▼──────────────────▼───────┐
          │              DATA AGGREGATION LAYER                  │
          │         (TypeScript service layer in app)            │
          │                                                      │
          │  • Normalize units (ml → oz, kg → lbs, etc.)        │
          │  • Merge duplicate readings from multiple sources    │
          │  • Apply source priority: HealthKit > Fitbit > Manual│
          │  • Handle missing data / interpolation               │
          └─────────────────────────┬───────────────────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │         SUPABASE               │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │  PostgreSQL Database      │  │
                    │  │  • biometric_readings     │  │
                    │  │  • sleep_sessions         │  │
                    │  │  • performance_scores     │  │
                    │  │  • fitbit_credentials     │  │
                    │  │  • sync_metadata          │  │
                    │  └──────────────────────────┘  │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │  Edge Functions           │  │
                    │  │  • fitbit-auth            │  │◄─── Fitbit OAuth2
                    │  │  • fitbit-sync            │  │     Callback
                    │  │  • fitbit-webhook         │  │
                    │  │  • score-calculator       │  │
                    │  └──────────────────────────┘  │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │  pg_cron                  │  │
                    │  │  • Fitbit sync every 30m  │  │
                    │  │  • Score recalc daily     │  │
                    │  │  • Data cleanup weekly    │  │
                    │  └──────────────────────────┘  │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────▼───────────────┐
                    │        FITBIT WEB API          │
                    │  api.fitbit.com                │
                    │                                │
                    │  • OAuth2 (server-side only)   │
                    │  • /heart, /sleep, /hrv        │
                    │  • /activities, /body          │
                    │  • /spo2, /br, /temp/skin      │
                    │  • Subscriptions (webhooks)    │
                    │                                │
                    │  Rate limit: 150 req/user/hr   │
                    └───────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW (Sync Paths)                              │
│                                                                             │
│  [A] ON-DEMAND (User opens app):                                            │
│      App → HealthKit/Health Connect → Normalize → Supabase DB               │
│      App → Supabase Edge Function → Fitbit API → Supabase DB                │
│                                                                             │
│  [B] BACKGROUND (iOS Observer Query):                                       │
│      HealthKit update → OS wakes app → Fetch delta → Supabase DB            │
│                                                                             │
│  [C] SERVER CRON (Every 30 min):                                            │
│      pg_cron → Edge Function → Fitbit API (all users) → Supabase DB        │
│                                                                             │
│  [D] WEBHOOK (Fitbit Subscription push):                                    │
│      Fitbit → fitbit-webhook Edge Function → Verify HMAC → Supabase DB     │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCORE CALCULATION ENGINE                                 │
│                    (Supabase Edge Function / scheduled)                     │
│                                                                             │
│  Raw Biometric Data → Normalization → Percentile Scoring → Composite Score │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐  ┌───────────┐ │
│  │ Cardiovascular   │  │ Metabolic    │  │ Sleep Arch.   │  │ Recovery  │ │
│  │ Score (0-100)    │  │ Score (0-100)│  │ Score (0-100) │  │ (0-100)   │ │
│  └────────┬─────────┘  └──────┬───────┘  └──────┬────────┘  └─────┬─────┘ │
│           │                   │                  │                  │       │
│  ┌────────▼─────────┐  ┌──────▼───────────────────▼───────────────▼─────┐ │
│  │ Cognitive        │  │              LONGEVITY INDEX                    │ │
│  │ Score (0-100)    ├─►│              Weighted composite of all scores   │ │
│  └──────────────────┘  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Library Recommendation

### 8.1 Primary Recommendation

| Platform | Library | Version | Rationale |
|---|---|---|---|
| iOS (HealthKit) | `react-native-health` | v1.x | Most mature, widest data type coverage, Expo dev client compatible, MIT license, 2,000+ stars, active maintenance |
| Android (Health Connect) | `react-native-health-connect` | v3.x | Only production-ready Health Connect library for React Native, New Architecture support, active maintenance |
| Fitbit | No React Native library | — | Server-side via Supabase Edge Function is the only secure approach; no client-side library is appropriate |
| Camera PPG | `expo-camera` + custom signal processing | — | Native camera access for rPPG; process RGB channel variance to estimate heart rate |

### 8.2 Justification Details

**Why `react-native-health` over alternatives:**

- `@kingstinct/react-native-healthkit` is excellent for TypeScript but has less community documentation and fewer examples for the complex data types needed (ECG, gait metrics, sleep stages with stage values).
- `react-native-healthkit` (different package) is outdated and unmaintained.
- `react-native-health` has the most comprehensive coverage of `HKQuantityTypeIdentifier*` constants, including all the longevity-specific metrics like `WalkingSpeed`, `StairAscentSpeed`, `WalkingDoubleSupportPercentage`.

**Why `react-native-health-connect` over alternatives:**

- It is the only actively maintained Health Connect library for React Native as of 2026.
- v3.x adds New Architecture (TurboModules) support, making it forward-compatible.
- The alternative of using `@capacitor/health` is not applicable to React Native.

**Why server-side for Fitbit:**

- Embedding OAuth2 `client_secret` in a mobile app binary violates both Apple App Store guidelines and Google Play policies.
- Supabase Edge Functions (Deno runtime) provide a secure, scalable, and cost-effective server layer with no separate backend infrastructure needed.
- Server-side polling also allows data sync even when the user has not opened the app recently.

### 8.3 Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| react-native-health not updated for New Architecture | Medium | Monitor repo; consider migrating to `@kingstinct/react-native-healthkit` if needed |
| Health Connect data gaps on Android < 14 | High | Clearly communicate data availability in onboarding UI; prompt users on Android 9-13 to install Health Connect from Play Store |
| Fitbit API deprecation (Google acquisition) | Low-Medium | Abstract Fitbit behind a data source interface; adding alternative (e.g., Garmin Connect) later should require only a new Edge Function |
| Fitbit rate limits exceeded during peak sync | Low | Implement request queue with rate limit header awareness; use webhooks instead of polling as primary mechanism |
| HealthKit permission UX confusion | Medium | Use a custom pre-permission screen explaining exactly what will be requested and why before invoking the HealthKit sheet |

---

## 9. Phase 1 vs Phase 2 Data Availability Summary

### 9.1 Phase 1 (MVP — Target: Launch)

**Scope:** iOS only, HealthKit + Manual Entry

| System | Phase 1 Data Points | Source | Score Completeness |
|---|---|---|---|
| Cardiovascular | Resting HR, HRV (SDNN), VO2 Max, Heart Rate Zones | HealthKit [AW required for HRV/VO2] | ~70% (iPhone-only users get ~40%) |
| Metabolic | Steps, Active Calories, Body Weight, BMI, Body Fat % | HealthKit | ~75% |
| Sleep Architecture | Total Sleep, Time in Bed, Sleep Stages (REM/Deep/Light) | HealthKit [AW required for stages] | ~60% (iPhone-only: ~30%) |
| Recovery Capacity | HRV, Resting HR, SpO2, Respiratory Rate | HealthKit [AW required for SpO2/RR] | ~55% |
| Cognitive | Mindful Sessions, Manual mood/stress entry | HealthKit + Manual | ~40% |
| Longevity Index | VO2 Max, Gait Speed, Walking Metrics, Standing Time | HealthKit [AW required for most] | ~65% |

**Phase 1 Data Types to Implement (HealthKit):**

```
HKQuantityTypeIdentifierRestingHeartRate
HKQuantityTypeIdentifierHeartRate
HKQuantityTypeIdentifierHeartRateVariabilitySDNN
HKQuantityTypeIdentifierVO2Max
HKQuantityTypeIdentifierOxygenSaturation
HKQuantityTypeIdentifierRespiratoryRate
HKCategoryTypeIdentifierSleepAnalysis
HKQuantityTypeIdentifierStepCount
HKQuantityTypeIdentifierActiveEnergyBurned
HKQuantityTypeIdentifierBasalEnergyBurned
HKQuantityTypeIdentifierBodyMass
HKQuantityTypeIdentifierBodyFatPercentage
HKQuantityTypeIdentifierBodyMassIndex
HKQuantityTypeIdentifierWalkingSpeed
HKQuantityTypeIdentifierAppleStandTime
HKQuantityTypeIdentifierWalkingHeartRateAverage
HKQuantityTypeIdentifierWalkingDoubleSupportPercentage
HKCategoryTypeIdentifierMindfulSession
```

---

### 9.2 Phase 2 (Post-Launch — Target: 3-6 months post-launch)

**Scope:** Android (Health Connect), Fitbit API, Camera PPG, expanded iOS data types

| Addition | New Data Enabled | Systems Improved |
|---|---|---|
| Health Connect (Android) | All Android users gain parity with iOS HealthKit users | All 6 systems |
| Fitbit API | Skin temperature, Fitbit-specific sleep details, HRV (Sense users), SpO2 time series | Sleep, Recovery, Cardiovascular |
| Camera PPG | Resting HR and crude HRV estimate for non-wearable users | Cardiovascular, Recovery |
| Blood Glucose (CGM sync) | Continuous glucose data via HealthKit or manual | Metabolic |
| Nutrition logging | Macronutrient and caloric data via HealthKit or manual | Metabolic, Longevity Index |
| ECG integration | AFib detection and rhythm analysis | Cardiovascular, Longevity Index |
| Garmin Connect API | Additional wearable data source for Garmin users | All 6 systems |

**Phase 2 Additional HealthKit Types:**

```
HKDataTypeIdentifierElectrocardiogram
HKQuantityTypeIdentifierBloodGlucose
HKQuantityTypeIdentifierDietaryCarbohydrates
HKQuantityTypeIdentifierDietaryProtein
HKQuantityTypeIdentifierDietaryFat
HKQuantityTypeIdentifierDietaryWater
HKQuantityTypeIdentifierDietaryCaffeine
HKQuantityTypeIdentifierBloodPressureSystolic
HKQuantityTypeIdentifierBloodPressureDiastolic
HKQuantityTypeIdentifierAppleSleepingWristTemperature
HKQuantityTypeIdentifierStairAscentSpeed
HKQuantityTypeIdentifierWalkingAsymmetryPercentage
HKQuantityTypeIdentifierLeanBodyMass
HKCategoryTypeIdentifierLowHeartRateEvent
HKCategoryTypeIdentifierHighHeartRateEvent
HKCategoryTypeIdentifierIrregularHeartRhythmEvent
HKQuantityTypeIdentifierEnvironmentalAudioExposure
HKQuantityTypeIdentifierNumberOfAlcoholicBeverages
```

---

### 9.3 User Experience Tier Summary

| User Profile | Device | Phase 1 Score Completeness | Phase 2 Score Completeness |
|---|---|---|---|
| iPhone + Apple Watch Series 8+ | iOS | ~85% | ~95% |
| iPhone + Apple Watch Series 4-7 | iOS | ~75% | ~85% |
| iPhone only (no Watch) | iOS | ~40% | ~55% |
| Android + Fitbit Sense/Versa 3+ | Android | — (Phase 2) | ~80% |
| Android + other Fitbit | Android | — (Phase 2) | ~65% |
| Android only (Health Connect) | Android | — (Phase 2) | ~60% |
| No wearable (manual + Camera PPG) | Any | ~25% | ~35% |

---

## Appendix A: Dependency Installation Summary

```bash
# Phase 1 dependencies
npx expo install react-native-health
npx expo install expo-web-browser     # For Fitbit OAuth2 redirect
npx expo install @supabase/supabase-js
npx expo install expo-secure-store    # Store tokens securely on device

# Phase 2 additions
npx expo install react-native-health-connect
npx expo install expo-camera          # For Camera PPG
```

**`package.json` peer dependency notes:**

- `react-native-health` requires `react-native >= 0.60`
- `react-native-health-connect` requires `react-native >= 0.71` for New Architecture support
- Both are incompatible with Expo Go — require `expo-dev-client` builds

---

## Appendix B: Supabase Database Schema (Core Tables)

```sql
-- Fitbit OAuth credentials (encrypt access_token and refresh_token in production)
CREATE TABLE fitbit_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fitbit_user_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  scopes TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Raw biometric readings (source-agnostic)
CREATE TABLE biometric_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,          -- e.g., 'resting_heart_rate', 'hrv_sdnn'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,               -- e.g., 'bpm', 'ms', 'ml/kg/min'
  source TEXT NOT NULL,             -- 'healthkit', 'health_connect', 'fitbit', 'manual', 'camera_ppg'
  recorded_at TIMESTAMPTZ NOT NULL, -- When the measurement was taken
  synced_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB,                   -- Source-specific extra fields
  UNIQUE(user_id, data_type, source, recorded_at)
);

-- Sleep sessions
CREATE TABLE sleep_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  total_sleep_minutes INTEGER,
  rem_minutes INTEGER,
  deep_minutes INTEGER,
  light_minutes INTEGER,
  awake_minutes INTEGER,
  sleep_efficiency NUMERIC,
  metadata JSONB,
  UNIQUE(user_id, source, start_time)
);

-- Sync metadata
CREATE TABLE sync_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL,             -- 'healthkit', 'health_connect', 'fitbit'
  last_synced_at TIMESTAMPTZ,
  last_sync_status TEXT,            -- 'success', 'error', 'partial'
  error_message TEXT,
  UNIQUE(user_id, source)
);
```

---

*End of Document — Device Integration Research v1.0*
*Champions Longevity Dashboard / Longevity Project*
*Generated: 2026-05-22*

---

*Document prepared using: GitHub repo analysis, wireframe review, clinical literature, and tech stack deep-dive.*  
*Single source of truth — covers product, clinical, engineering, and infrastructure.*  
*Next review: After Phase 1 mobile screens are complete. Chief Physician sign-off required before scoring engine ships.*

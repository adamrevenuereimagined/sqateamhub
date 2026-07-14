# Product Requirements Document (PRD)

## SQA BD Team Hub

**Version:** 1.0  
**Date:** July 2026  
**Status:** Production

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Goals & Objectives](#3-goals--objectives)
4. [Target Users & Personas](#4-target-users--personas)
5. [User Stories](#5-user-stories)
6. [Feature Specifications](#6-feature-specifications)
7. [Screen-by-Screen Requirements](#7-screen-by-screen-requirements)
8. [Data Model](#8-data-model)
9. [Security & Access Control](#9-security--access-control)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Technology Stack](#11-technology-stack)
12. [Future Roadmap](#12-future-roadmap)

---

## 1. Executive Summary

The **SQA BD Team Hub** is an internal web application for SQA's Business Development (BD) team. It streamlines weekly reporting, performance tracking, and team meeting preparation by replacing fragmented spreadsheets and docs with a single structured system.

Sales reps and BDRs submit a weekly report every Thursday covering activity metrics, pipeline movement, deal updates, goals, and personal check-ins. An executive admin views a consolidated team dashboard with aggregated metrics, per-rep drill-downs, trend graphs, and tools for managing weeks and activity targets.

The application eliminates duplicate data entry (previously reps filled out both a 1:1 tracker and a BD weekly form separately), creates a single source of truth for weekly updates, and gives leadership real-time visibility into team performance.

---

## 2. Problem Statement

Before this application, the BD team faced several operational challenges:

- **Duplicate data entry.** Reps filled out a 1:1 tracker form and a separate BD Weekly form each week, with overlapping fields (activity metrics, deals, goals). This created redundant work and data inconsistency.
- **No single source of truth.** Weekly updates lived in scattered spreadsheets, Google Docs, and email threads. There was no central repository to review historical performance.
- **Manual aggregation.** The executive had to manually compile individual rep submissions into a team-wide view for the weekly BD meeting, which was time-consuming and error-prone.
- **No trend visibility.** Without structured historical data, reps and leadership could not easily track performance trends over the quarter.
- **Goal tracking was ad-hoc.** Weekly goals were not systematically carried forward or reviewed, making accountability inconsistent.
- **No activity targets.** Reps had no defined weekly targets for prospecting activities, making it hard to benchmark performance.

---

## 3. Goals & Objectives

### Primary Goals

| # | Goal | Success Metric |
|---|------|----------------|
| G1 | Eliminate duplicate weekly data entry | Reps complete one form per week instead of two |
| G2 | Provide real-time team performance visibility | Executive dashboard auto-refreshes when reps submit |
| G3 | Enable systematic goal carry-forward and review | 100% of submitted goals are reviewed the following week |
| G4 | Track performance trends across the quarter | Trend graphs render for all submitted weeks |
| G5 | Set and compare against activity targets | All active reps have configured weekly targets |

### Secondary Goals

- Reduce time spent preparing for the weekly BD team meeting
- Create a historical archive of weekly performance for coaching and reviews
- Surface blockers and support needs early
- Track personal well-being (energy level, self-care) as a leading indicator

---

## 4. Target Users & Personas

### 4.1 Executive (Admin)

**Role label in UI:** "Executive"  
**Database role:** `admin`

- The BD team leader (e.g., the VP or Director of BD)
- Needs a consolidated, real-time view of the entire team's weekly performance
- Manages week cycles (creating weeks, activating, archiving)
- Sets and manages per-rep activity targets and quarterly quotas
- Reviews each rep's submission in detail
- Generates an executive summary for the weekly team meeting
- Requires password-protected login

### 4.2 Sales Rep

**Role label in UI:** "Sales Rep"  
**Database role:** `rep`

- Full-cycle sales representatives with a quarterly revenue quota
- Submits a weekly report every Thursday covering:
  - Wins & momentum
  - Activity metrics (cold calls, emails, LinkedIn messages, videos, DM connects, meetings booked, discovery calls, opportunities advanced)
  - Performance snapshot (pipeline coverage, MTD/QTD revenue, average deal size, deals won)
  - Pipeline & deals (advancing, stalling, new, closing opportunities)
  - Face-to-face meetings (upcoming, held last week, pipeline tentative)
  - Call review
  - Blockers & support needed
  - Goals (review last week's, set next week's)
  - Personal check-in (self-care, energy level, manager support)
- Views a personal dashboard with KPI cards and a performance trend graph

### 4.3 BDR (Business Development Representative)

**Role label in UI:** "BDR"  
**Database role:** `bdr`

- BDRs focused on top-of-funnel activity (creating opportunities, not closing revenue)
- Submits a weekly report with BDR-specific metrics:
  - SAOs (Sales Accepted Opportunities) MTD and QTD
  - Opportunities created this week
  - Pipeline created this week
  - Activity metrics (same as Sales Rep)
  - Call review, blockers, goals, personal check-in (same as Sales Rep)
- Views a personal dashboard with BDR-specific KPI cards (SAOs MTD, SAOs QTD, Opps Created, Pipeline Created)

---

## 5. User Stories

### Authentication & Onboarding

| ID | Story |
|----|-------|
| US-01 | As a user, I can select my name from a list of active team members to log in. |
| US-02 | As an executive, I must enter a password to access the admin dashboard. |
| US-03 | As a user, I can sign out from any screen. |
| US-04 | As a user, my role determines which screens and features I can access. |

### Rep Dashboard

| ID | Story |
|----|-------|
| US-10 | As a sales rep, I see KPI cards showing my quarterly quota, MTD revenue, QTD revenue, QTD % to quota, and pipeline coverage. |
| US-11 | As a BDR, I see KPI cards showing my SAOs MTD, SAOs QTD, opportunities created this week, and pipeline created this week. |
| US-12 | As a rep, I see a performance trend graph that I can toggle between QTD Revenue, MTD Revenue, Pipeline, Deals Won, and Deals Advancing. |
| US-13 | As a rep, I can select a week and open a new weekly report. |
| US-14 | As a rep, I can select a previously submitted week and edit my submission. |
| US-15 | As a rep, if no weeks are available, I see a message directing me to contact my admin. |

### Weekly Submission (Sales Rep)

| ID | Story |
|----|-------|
| US-20 | As a sales rep, I can record wins and what's working well. |
| US-21 | As a sales rep, I can log my weekly activity metrics with target indicators showing whether I'm on track. |
| US-22 | As a sales rep, I can enter my pipeline coverage ratio, MTD revenue, QTD revenue, average deal size, and deals won this week. |
| US-23 | As a sales rep, I can add multiple deals that are advancing (deal name, amount, next stage, next step). |
| US-24 | As a sales rep, I can add multiple deals that are stalling (deal name, why stuck, my plan, help needed). |
| US-25 | As a sales rep, I can add new deals (company name, deal source, potential revenue). |
| US-26 | As a sales rep, I can add closing opportunities (company/deal, value, close date, confidence/blockers). |
| US-27 | As a sales rep, I can log upcoming face-to-face meetings (client/prospect, dates, location, purpose/prep). |
| US-28 | As a sales rep, I can log F2F meetings held last week and mark whether the goal was met. |
| US-29 | As a sales rep, I can log tentative F2F meetings in the pipeline (client/prospect, deal/opportunity, tentative timeframe, confirmation plan). |
| US-30 | As a sales rep, I can provide a call review link and focus area. |
| US-31 | As a sales rep, I can describe blockers and support needed, including specific deal blockers and support requests. |
| US-32 | As a sales rep, I can review last week's goals (text, achieved status: yes/partial/no, notes) and set new goals for next week. |
| US-33 | As a sales rep, I can complete a personal check-in (self-care, energy level: high/medium/low, manager support needed). |
| US-34 | As a sales rep, I can save my submission as a draft (status: in_progress) or submit it (status: submitted). |
| US-35 | As a sales rep, my previous week's goals automatically carry forward for review in the current week. |

### Weekly Submission (BDR)

| ID | Story |
|----|-------|
| US-40 | As a BDR, I can record wins and what's working well. |
| US-41 | As a BDR, I can log my SAOs MTD, SAOs QTD, opportunities created this week, and pipeline created this week. |
| US-42 | As a BDR, I can log my weekly activity metrics with target indicators. |
| US-43 | As a BDR, I can provide a call review link and focus area. |
| US-44 | As a BDR, I can describe blockers and support needed. |
| US-45 | As a BDR, I can review last week's goals and set new goals for next week. |
| US-46 | As a BDR, I can complete a personal check-in. |
| US-47 | As a BDR, I can save as draft or submit. |

### Admin Dashboard

| ID | Story |
|----|-------|
| US-50 | As an executive, I see a team-wide scoreboard with MTD/QTD targets vs. actuals, deals closed this week, and team pipeline coverage. |
| US-51 | As an executive, I see aggregated MTD and QTD activity metrics for the entire team with week-over-week comparison. |
| US-52 | As an executive, I can expand each rep's submission to see their full weekly report. |
| US-53 | As an executive, I see each rep's activity metrics compared against their individual targets with visual indicators. |
| US-54 | As an executive, I see a team-wide performance trend graph with selectable metrics. |
| US-55 | As an executive, the dashboard auto-refreshes in real-time when reps submit or update their reports. |
| US-56 | As an executive, I can generate an AI-style executive summary of the week's team performance. |
| US-57 | As an executive, I can copy the executive summary to clipboard for use in meeting notes. |
| US-58 | As an executive, I see submission status indicators (submitted, in progress, not started) for each rep. |
| US-59 | As an executive, I can see the last-refreshed timestamp. |

### Week Management

| ID | Story |
|----|-------|
| US-60 | As an executive, I can create new weeks by specifying a start date and an end date (must be a Friday). |
| US-61 | As an executive, I can set a week as active (deactivating all others). |
| US-62 | As an executive, I can archive/close a week. |
| US-63 | As an executive, I see a list of existing weeks sorted by most recent first. |

### Targets Management

| ID | Story |
|----|-------|
| US-70 | As an executive, I can set activity targets for all reps at once (cold calls, LinkedIn messages, videos, DM connects, meetings booked, discovery calls, opportunities advanced, pipeline value). |
| US-71 | As an executive, I can set targets for individual reps. |
| US-72 | As an executive, I can set quarterly quotas (in dollars) for each rep. |
| US-73 | As an executive, I can toggle between "all reps" and "individual" target modes. |

---

## 6. Feature Specifications

### 6.1 Authentication

| Attribute | Detail |
|-----------|--------|
| **Login method** | User selection from dropdown of active team members |
| **Admin protection** | Password required for executive login (hardcoded: `SQAExec2!`) |
| **Session persistence** | Selected user ID stored in `localStorage`; cleared on sign out and on page load |
| **No traditional auth** | No email/password Supabase Auth; login is based on selecting a user profile from the `users` table |
| **Inactive users** | Only `is_active = true` users appear in the login dropdown |

### 6.2 Weekly Submission Form (Sales Rep)

The form is organized into the following sections:

#### Section 1: Wins & Momentum
- **Wins** — Dynamic list of free-text win entries (add/remove rows)
- **What's working well** — Free-text textarea
- **Positive feedback** — Free-text textarea

#### Section 2: Activity Metrics
Each metric has a numeric input with a visual target indicator (green check / red dot / amber) comparing the entered value against the rep's configured target:

| Metric | Unit | Target Field |
|--------|------|-------------|
| Cold Calls | count | `target_cold_calls` |
| Emails | count | (no target) |
| LinkedIn Messages | count | `target_li_messages` |
| Videos | count | `target_videos` |
| Decision Maker Connects | count | `target_dm_connects` |
| Meetings Booked | count | `target_meetings_booked` |
| Discovery Calls | count | `target_discovery_calls` |
| Opportunities Advanced | count | `target_opportunities_advanced` |

#### Section 3: Performance Snapshot
- **Pipeline Coverage Ratio** — Currency input
- **Revenue MTD** — Currency input
- **Revenue QTD** — Currency input
- **Average Deal Size** — Currency input
- **Deals Won This Week** — Numeric input

#### Section 4: Pipeline & Deals

**4A: Deals Advancing** — Repeatable rows:
- Deal name (text)
- Deal amount (currency)
- Next stage (text)
- Next step (text)

**4B: Deals Stalling** — Repeatable rows:
- Deal name (text)
- Why stuck (text)
- Your plan (text)
- Help needed (text)

**4C: New Deals** — Repeatable rows:
- Company name (text)
- Deal source (text)
- Potential revenue (currency)

**4D: Closing Opportunities** — Repeatable rows:
- Company/deal (text)
- Value (currency)
- Close date (date)
- Confidence/blockers (text)

#### Section 5: Face-to-Face Meetings

**5A: Upcoming F2F Meetings** — Repeatable rows:
- Client/prospect (text)
- Dates (text)
- Where (text)
- Purpose/prep (text)

**5B: F2F Meetings Held Last Week** — Repeatable rows:
- Client/prospect (text)
- Dates (text)
- Where (text)
- Purpose/prep (text)
- Goal met (yes/no/not set)

**5C: F2F Pipeline (Tentative)** — Repeatable rows:
- Client/prospect (text)
- Deal/opportunity (text)
- Tentative timeframe (text)
- Confirmation plan (text)

**5D: Previous Week's F2F Meeting Outcomes** — Auto-loaded from last week's upcoming meetings:
- Client/prospect (text)
- Dates (text)
- Where (text)
- Goal/outcome (text)
- Goal met (boolean)
- Notes (text)

#### Section 6: Call Review
- **Call review link** — URL/text input
- **Call review focus** — Free-text textarea

#### Section 7: Blockers & Support
- **Blockers / help needed** — Free-text textarea
- **Deal blockers** — Dynamic list of free-text entries
- **Support needed** — Dynamic list of free-text entries

#### Section 8: Goals
- **Last week's goals review** — Auto-loaded from previous week's submission:
  - Goal text (read-only)
  - Achieved status (yes / partial / no)
  - Review notes (text)
- **Next week's goals** — Dynamic list of free-text goal entries (carried forward to next week)

#### Section 9: Personal Check-In
- **Self-care** — Free-text textarea
- **Energy level** — Select: High / Medium / Low
- **Manager support** — Free-text textarea

#### Save & Submit
- **Save Draft** — Persists form with status `in_progress`; shows toast notification
- **Submit** — Persists form with status `submitted`, sets `submitted_at` timestamp; shows toast notification
- **Back** — Returns to dashboard without saving

### 6.3 Weekly Submission Form (BDR)

The BDR form is a simplified version of the Sales Rep form:

#### Section 1: Wins & Momentum (same as Sales Rep)

#### Section 2: BDR Performance Metrics
- **SAOs MTD** — Numeric input
- **SAOs QTD** — Numeric input
- **Opportunities Created This Week** — Numeric input
- **Pipeline Created This Week** — Currency input

#### Section 3: Activity Metrics (same as Sales Rep, with target indicators)

#### Section 4: Call Review (same as Sales Rep)

#### Section 5: Blockers & Support (same as Sales Rep)

#### Section 6: Goals (same as Sales Rep — carry-forward and review)

#### Section 7: Personal Check-In (same as Sales Rep)

#### Save & Submit (same as Sales Rep)

### 6.4 Rep Dashboard

| Element | Sales Rep | BDR |
|---------|-----------|-----|
| KPI Cards | Quarterly Quota, MTD Revenue, QTD Revenue, QTD % to Quota (with progress bar), Pipeline (with quota coverage ratio) | SAOs MTD, SAOs QTD, Opps Created (this week), Pipeline Created (this week) |
| Trend Graph | Toggle: QTD Revenue, MTD Revenue, Pipeline, Deals Won, Deals Advancing | Same |
| New Report Card | Week selector + "Open Report" button | Week selector + "Open Report" button |
| Edit Report Card | Submitted week selector + "Edit Submission" button | Submitted week selector + "Edit Submission" button |

**Empty states:**
- No weeks available: "Contact your admin to set up weeks for this quarter."
- No submitted reports: "Submit your first weekly report to see it here."
- No submissions yet: KPI cards show "—" with "Submit a report to track" helper text.

### 6.5 Admin Dashboard

#### Team Scoreboard (top section)
- **Team MTD Target** vs. **Team MTD Actual** (with progress bar)
- **Team QTD Target** vs. **Team QTD Actual** (with progress bar)
- **Deals Closed This Week** (count)
- **Team Pipeline Coverage** (currency)

#### Aggregated Activity Metrics
- MTD and QTD aggregates for: cold calls, emails, LinkedIn messages, videos, DM connects, meetings booked, discovery calls, opportunities advanced
- Week-over-week comparison (current week vs. previous week) with trend arrows (up/down/flat)

#### Team Performance Trend Graph
- Toggle between: QTD Revenue, MTD Revenue, Pipeline, Deals Won, Deals Advancing
- Shows all reps' aggregated data across the quarter

#### Per-Rep Submission Cards (expandable)
Each rep shows:
- Name, role badge, submission status badge (Submitted / In Progress / Not Started)
- Revenue MTD, QTD, Pipeline, Deals Won summary
- Expand button to reveal full submission details:
  - Activity metrics vs. individual targets (with visual indicators)
  - Wins
  - Deals advancing, stalling, new, closing
  - F2F meetings
  - Call review
  - Blockers & support
  - Goals (last week review + next week goals)
  - Personal check-in

#### Executive Summary
- Click "Generate Executive Summary" to produce a text summary of the week's team performance
- Copy-to-clipboard button
- Modal display

#### Real-Time Updates
- Subscribes to Supabase `postgres_changes` on the `weekly_submissions` table
- Auto-refreshes dashboard data when any rep submits or updates
- Displays "Last refreshed" timestamp with a manual refresh button

#### Admin Actions
- **Manage Weeks** button — Opens Week Management modal
- **Manage Targets** button — Opens Targets Management modal

### 6.6 Week Management

| Feature | Detail |
|---------|--------|
| List weeks | Shows up to 20 most recent weeks, sorted by start date descending |
| Create week | Pick start date and end date (end date must be a Friday); new week is created with status `active` |
| Activate week | Sets one week to `active` and all others to `inactive` |
| Archive/close week | Sets week status to `archived` (with confirmation dialog) |
| Validation | End date must be a Friday; both dates required |

### 6.7 Targets Management

| Feature | Detail |
|---------|--------|
| Mode toggle | "All Reps" (apply to everyone) or "Individual" (per-rep) |
| Activity targets | Cold Calls (default 50), LinkedIn Messages (50), Videos (10), DM Connects (15), Meetings Booked (5), Discovery Calls (3), Opportunities Advanced (2), Pipeline Value (0) |
| Quarterly quota | Per-rep currency input for quarterly revenue quota |
| Save | Persists to `weekly_activity_targets` table and `users.quarterly_quota` |
| Rep list | Shows all active users with role `rep` or `bdr` |

### 6.8 Analytics Dashboard (available to admin)

| Feature | Detail |
|---------|--------|
| Rep selector | Dropdown to select any active sales rep |
| Weekly data table | Shows up to N weeks (default 8, configurable) of: cold calls, LI messages, videos, DM connects, meetings booked, discovery calls, opportunities advanced, pipeline coverage, revenue MTD, revenue QTD |
| Target comparison | Each metric compared against the rep's configured target with visual indicator |
| Week range control | Adjustable number of weeks to display |

### 6.9 UI Components & Design System

The application uses a custom design system with the following primitives:

| Component | Description |
|-----------|-------------|
| `Button` | Primary, secondary, danger variants; full-width option; trailing icon support |
| `Card` | Container with configurable padding (`sm`, `md`, `lg`); shadow and hover states |
| `Modal` | Overlay dialog with backdrop blur; used for week management, targets, confirmations |
| `ConfirmDialog` | Confirmation modal with async confirm/deny pattern |
| `Toast` | Notification system with success/error variants; auto-dismiss; provider-based |
| `CurrencyInput` | Formatted currency input with prefix `$` and tabular numbers |

**Design principles:**
- 8px spacing system
- Brand color palette (primary blue, accent emerald) with neutral slate tones
- Responsive: mobile to desktop breakpoints (sm, md, lg)
- Sticky navigation bar with backdrop blur
- Fade-in animations on screen transitions
- Hover states on all interactive elements
- Loading spinners with brand-colored animation
- Empty states with helpful guidance text

---

## 7. Screen-by-Screen Requirements

### 7.1 Login Screen

- Full-screen gradient background (`from-slate-50 via-white to-brand-50`)
- SQA logo + "BD Team Hub" title
- User selection dropdown (active users, sorted by role descending then name)
- Password field (visible only for admin users; required)
- "Sign In" button
- Loading state: spinner with "Connecting to database..." text
- Error state: database connection error message with retry button

### 7.2 Layout (Shared)

- Sticky top navigation bar (white/90 with backdrop blur)
- Left: SQA logo + "BD Team Hub" + Dashboard nav button (rep only)
- Right: User name + role badge + avatar initials + sign-out icon button
- Main content area: `max-w-7xl` centered with 8px vertical padding
- Mobile: brand text hidden, nav buttons hidden on small screens

### 7.3 Rep Dashboard

- Header: "Welcome back, [first name]" with subtitle
- KPI card grid (2 cols mobile, 5 cols desktop for reps; 4 cols for BDR)
- Performance trend graph card (if submissions exist) with metric toggle pills
- Two action cards side by side:
  - "Enter Weekly Report" — week selector + open button
  - "Edit Previous Submission" — submitted week selector + edit button

### 7.4 Weekly Submission Form

- Back button at top
- Week date range displayed
- All sections rendered in a single scrollable page
- Section headers with icons
- Repeatable row sections with add/remove buttons
- Target indicators next to activity metrics
- Previous week's data auto-loaded where applicable (goals, F2F meetings)
- Sticky bottom action bar with "Save Draft" and "Submit" buttons

### 7.5 Admin Dashboard

- Header with current week selector and admin action buttons (Manage Weeks, Manage Targets)
- Team scoreboard cards (4 cards in a grid)
- Aggregated metrics section with MTD/QTD toggle and trend arrows
- Team performance trend graph card
- Rep submission list with expandable cards
- Executive summary button (opens modal)
- Real-time refresh indicator

### 7.6 Week Management Modal

- List of weeks with status badges
- Create new week form (start date, end date inputs + create button)
- Per-week actions: Activate, Archive
- Validation error display

### 7.7 Targets Management Modal

- Mode toggle: All Reps / Individual
- Activity target inputs with default values
- Per-rep quarterly quota inputs
- Save button with toast feedback

---

## 8. Data Model

### 8.1 `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default `gen_random_uuid()` | Unique user ID |
| `email` | text | UNIQUE, NOT NULL | User email |
| `name` | text | NOT NULL | Full name |
| `role` | text | NOT NULL, CHECK in (`admin`, `rep`, `bdr`) | User role |
| `quarterly_quota` | numeric | default 0 | Quarterly revenue quota |
| `is_active` | boolean | default true | Active status |
| `created_at` | timestamptz | default now() | Creation timestamp |

### 8.2 `weeks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Unique week ID |
| `week_number` | integer | NOT NULL | Week number in year |
| `year` | integer | NOT NULL | Year |
| `start_date` | date | NOT NULL | Monday of the week |
| `end_date` | date | NOT NULL | Friday (or Sunday) of the week |
| `status` | text | NOT NULL, CHECK in (`active`, `inactive`, `archived`) | Week status |
| `created_at` | timestamptz | default now() | Creation timestamp |
| | | UNIQUE(`year`, `week_number`) | No duplicate weeks |

### 8.3 `weekly_submissions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Unique submission ID |
| `user_id` | uuid | FK → `users(id)`, NOT NULL | Submitting rep |
| `week_id` | uuid | FK → `weeks(id)`, NOT NULL | Week reference |
| `status` | text | CHECK in (`not_started`, `in_progress`, `submitted`) | Submission status |
| `submitted_at` | timestamptz | nullable | Submission timestamp |
| `wins` | text[] | default `[]` | List of wins |
| `whats_working_well` | text | | What's working well |
| `positive_feedback` | text | | Positive feedback |
| `cold_calls` | integer | default 0 | Cold call count |
| `emails` | integer | default 0 | Email count |
| `li_messages` | integer | default 0 | LinkedIn message count |
| `videos` | integer | default 0 | Video count |
| `decision_maker_connects` | integer | default 0 | DM connect count |
| `meetings_booked` | integer | default 0 | Meetings booked |
| `discovery_calls` | integer | default 0 | Discovery call count |
| `opportunities_advanced` | integer | default 0 | Opps advanced |
| `pipeline_coverage_ratio` | numeric | default 0 | Pipeline coverage |
| `revenue_mtd` | numeric | default 0 | Revenue MTD |
| `revenue_qtd` | numeric | default 0 | Revenue QTD |
| `average_deal_size` | numeric | default 0 | Avg deal size |
| `deals_won_this_week` | integer | default 0 | Deals won |
| `deals_advancing` | jsonb | default `[]` | Deals advancing array |
| `deals_stalling` | jsonb | default `[]` | Deals stalling array |
| `new_deals` | jsonb | default `[]` | New deals array |
| `closing_opportunities` | jsonb | default `[]` | Closing opps array |
| `f2f_meetings` | jsonb | default `[]` | Upcoming F2F meetings |
| `f2f_meetings_held_last_week` | jsonb | default `[]` | F2F held last week |
| `f2f_meetings_pipeline_tentative` | jsonb | default `[]` | Tentative F2F pipeline |
| `previous_week_f2f_meetings_outcome` | jsonb | default `[]` | Previous week F2F outcomes |
| `call_review_link` | text | | Call review URL |
| `call_review_focus` | text | | Call review focus |
| `blockers_help` | text | | Blockers description |
| `deal_blockers` | text[] | default `[]` | Deal blocker list |
| `support_needed` | text[] | default `[]` | Support needed list |
| `self_care` | text | | Self-care notes |
| `energy_level` | text | CHECK in (`high`, `medium`, `low`), default `medium` | Energy level |
| `manager_support` | text | | Manager support notes |
| `created_at` | timestamptz | default now() | Creation timestamp |
| `updated_at` | timestamptz | default now() | Last update timestamp |
| | | UNIQUE(`user_id`, `week_id`) | One submission per rep per week |

**BDR-specific columns (added via migrations):**
| Column | Type | Description |
|--------|------|-------------|
| `sales_accepted_opps_mtd` | integer | SAOs MTD |
| `sales_accepted_opps_qtd` | integer | SAOs QTD |
| `opps_created_this_week` | integer | Opportunities created this week |
| `pipeline_created_this_week` | numeric | Pipeline created this week |
| `deals_advancing_this_week` | integer | Count of deals advancing |

### 8.4 `weekly_goals`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Unique goal ID |
| `meeting_id` | uuid | FK → `bd_weekly_meetings(id)` | Meeting reference (legacy) |
| `user_id` | uuid | FK → `users(id)`, NOT NULL | Owning rep |
| `week_id` | uuid | FK → `weeks(id)` | Week reference |
| `goal_text` | text | NOT NULL | Goal description |
| `achieved` | text | CHECK in (`yes`, `partial`, `no`), nullable | Achievement status |
| `notes` | text | default '' | Review notes |
| `sort_order` | integer | default 0 | Display order |
| `created_at` | timestamptz | default now() | Creation timestamp |

### 8.5 `weekly_activity_targets`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | Unique target ID |
| `user_id` | uuid | FK → `users(id)`, NOT NULL | Rep reference |
| `target_cold_calls` | integer | default 50 | Cold call target |
| `target_li_messages` | integer | default 50 | LinkedIn message target |
| `target_videos` | integer | default 10 | Video target |
| `target_dm_connects` | integer | default 15 | DM connect target |
| `target_meetings_booked` | integer | default 5 | Meetings booked target |
| `target_discovery_calls` | integer | default 3 | Discovery call target |
| `target_opportunities_advanced` | integer | default 2 | Opps advanced target |
| `target_pipeline_value` | numeric | default 0 | Pipeline value target |
| `created_at` | timestamptz | default now() | Creation timestamp |
| `updated_at` | timestamptz | default now() | Last update timestamp |
| | | UNIQUE(`user_id`) | One target set per rep |

### 8.6 Legacy Tables (from initial schema, superseded by `weekly_submissions`)

The following tables were created in the initial schema but were superseded by the unified `weekly_submissions` table in a later migration:

- `one_on_one_submissions` — Replaced by `weekly_submissions`
- `commitments` — Replaced by `submission_commitments`
- `bd_weekly_meetings` — Admin-only meeting agenda data (still referenced by `weekly_goals.meeting_id`)
- `bd_weekly_rep_data` — Replaced by `weekly_submissions`

### 8.7 JSONB Data Shapes

**Deals Advancing:**
```json
{
  "dealName": "Acme Corp - Expansion",
  "dealAmount": 50000,
  "nextStage": "Proposal",
  "nextStep": "Send revised quote by Tuesday"
}
```

**Deals Stalling:**
```json
{
  "dealName": "Globex - Renewal",
  "whyStuck": "No response from economic buyer",
  "yourPlan": "Loop in champion for intro",
  "helpNeeded": "Executive assist on email"
}
```

**New Deals:**
```json
{
  "companyName": "Initech",
  "dealSource": "Cold Call",
  "potentialRevenue": 75000
}
```

**Closing Opportunities:**
```json
{
  "companyDeal": "Umbrella Corp - Q3",
  "value": 120000,
  "closeDate": "2026-07-31",
  "confidenceBlockers": "80% confident, waiting on legal review"
}
```

**F2F Meetings:**
```json
{
  "clientProspect": "Wayne Enterprises",
  "dates": "Jul 16-17",
  "where": "Gotham City",
  "purposePrep": "Discovery + demo of enterprise tier"
}
```

---

## 9. Security & Access Control

### 9.1 Authentication Model

The application uses a **profile-selection-based auth model** rather than traditional Supabase email/password auth:

- Users are pre-seeded in the `users` table by an admin
- Login is performed by selecting a user from the dropdown
- Admin login requires a password (`SQAExec2!`)
- No JWT tokens or Supabase Auth sessions are used
- The selected user ID is stored in `localStorage` for session persistence

### 9.2 Row Level Security (RLS)

RLS was initially enabled on all tables in the original schema. After the unified `weekly_submissions` migration, RLS was **disabled** on `weekly_submissions` and `submission_commitments` to support the demo-mode authentication pattern (no real Supabase Auth sessions).

**Original RLS policies (still on legacy tables):**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | All authenticated (active only) | Admin only | Admin only | — |
| `weeks` | All authenticated | Admin only | Admin only | Admin only |
| `one_on_one_submissions` | Own + admin | Own only | Own + admin | — |
| `commitments` | Via accessible 1:1 | Via accessible 1:1 | Via accessible 1:1 | Via accessible 1:1 |
| `bd_weekly_meetings` | All authenticated | Admin only | Admin only | Admin only |
| `bd_weekly_rep_data` | All authenticated | Own + admin | Own + admin | — |
| `weekly_goals` | All authenticated | Own + admin | Own + admin | Own + admin |

**Current state:**
- `weekly_submissions` — RLS disabled (publicly accessible via anon key)
- `submission_commitments` — RLS disabled
- `weekly_activity_targets` — Anon access allowed (for demo mode)

### 9.3 Front-End Access Control

| Role | Dashboard | Weekly Form | Admin Dashboard |
|------|-----------|-------------|-----------------|
| `admin` | Redirected to Admin Dashboard | N/A | Full access |
| `rep` | Rep Dashboard (sales rep KPIs) | Sales Rep form | No access |
| `bdr` | Rep Dashboard (BDR KPIs) | BDR form | No access |

---

## 10. Non-Functional Requirements

### 10.1 Performance

- Dashboard data loads within 2 seconds on a typical connection
- Form saves complete within 1 second
- Real-time subscription updates reflect within 2 seconds of a submission change
- Trend graphs render smoothly with up to 13 weeks of data

### 10.2 Responsiveness

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 640px) | Single column layouts, KPI cards in 2-col grid, nav text hidden |
| Tablet (640–1024px) | 2-column action cards, KPI cards in 4-5 col grid |
| Desktop (> 1024px) | Full multi-column layouts, max-width 1280px centered |

### 10.3 Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- No Internet Explorer support required

### 10.4 Availability

- Hosted on Bolt with Supabase backend
- Supabase free-tier auto-pause after inactivity (acceptable for internal tool)

### 10.5 Data Retention

- All weekly submissions are retained indefinitely (no automated deletion)
- Archived weeks remain viewable but are excluded from active dropdowns

---

## 11. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend framework** | React | 18.3.1 |
| **Language** | TypeScript | 5.5.x |
| **Build tool** | Vite | 5.4.x |
| **Styling** | Tailwind CSS | 3.4.x |
| **Icons** | lucide-react | 0.344.x |
| **Backend / database** | Supabase (PostgreSQL) | — |
| **Client SDK** | @supabase/supabase-js | 2.57.x |
| **PostCSS** | autoprefixer + tailwindcss | — |
| **Linting** | ESLint + typescript-eslint | 9.x / 8.x |

### Project Structure

```
src/
├── App.tsx                    # Root component, routing, auth gate
├── main.tsx                   # React entry point
├── index.css                  # Tailwind directives + global styles
├── contexts/
│   └── AuthContext.tsx        # Auth provider, user state, role helpers
├── lib/
│   ├── supabase.ts            # Supabase client + type definitions
│   ├── dateUtils.ts           # Date parsing/formatting utilities
│   └── formatters.ts          # Currency/number formatting utilities
├── components/
│   ├── Login.tsx              # Login screen (user selection)
│   ├── Layout.tsx             # Shared nav + layout wrapper
│   ├── RepDashboard.tsx       # Rep/BDR dashboard with KPIs + trends
│   ├── AdminDashboard.tsx     # Executive team dashboard
│   ├── WeeklySubmissionForm.tsx  # Sales Rep weekly form (1847 lines)
│   ├── BdrSubmissionForm.tsx  # BDR weekly form
│   ├── AnalyticsDashboard.tsx # Per-rep analytics with target comparison
│   ├── WeekManagement.tsx     # Week CRUD modal
│   ├── TargetsManagement.tsx  # Activity target + quota management modal
│   ├── MetricsTrendGraph.tsx  # Reusable trend graph component
│   ├── CurrencyInput.tsx      # Currency-formatted input component
│   └── ui/
│       ├── Button.tsx         # Button primitive
│       ├── Card.tsx           # Card container primitive
│       ├── Modal.tsx          # Modal/dialog primitive
│       ├── ConfirmDialog.tsx  # Confirmation dialog primitive
│       ├── Toast.tsx          # Toast notification system
│       └── index.ts           # UI barrel export
└── supabase/
    └── migrations/
        └── (28 migration files)
```

---

## 12. Future Roadmap

### Short-Term (Next Quarter)

| Priority | Feature | Description |
|----------|---------|-------------|
| P1 | **True authentication** | Replace profile-selection login with Supabase email/password auth; issue JWT sessions |
| P1 | **Re-enable RLS** | Once real auth is in place, re-enable RLS on `weekly_submissions` with proper `auth.uid()` ownership policies |
| P2 | **Export to CSV/PDF** | Allow executives to export the team dashboard or individual rep submissions |
| P2 | **Email reminders** | Automated Thursday reminder emails to reps who haven't submitted |
| P3 | **Quarterly rollover** | Automated week creation at the start of each quarter |

### Medium-Term

| Priority | Feature | Description |
|----------|---------|-------------|
| P2 | **Historical comparison** | Quarter-over-quarter and year-over-year performance comparisons |
| P2 | **Coaching notes** | Allow exec to attach private coaching notes to each rep's submission |
| P3 | **Mobile app** | Native mobile app for on-the-go submission entry |
| P3 | **CRM integration** | Auto-populate pipeline/deal data from Salesforce or HubSpot |

### Long-Term

| Priority | Feature | Description |
|----------|---------|-------------|
| P3 | **Predictive analytics** | AI-powered quota attainment forecasting based on pipeline and activity trends |
| P3 | **Team benchmarking** | Anonymous peer benchmarks ("you're in the top quartile for cold calls") |
| P4 | **Multi-team support** | Support multiple BD teams with separate dashboards and execs |

---

## Appendix A: Migration History

| Date | Migration | Summary |
|------|-----------|---------|
| 2026-02-12 | `create_sqa_bd_hub_schema` | Initial schema: users, weeks, one_on_one_submissions, commitments, bd_weekly_meetings, bd_weekly_rep_data, weekly_goals |
| 2026-02-12 | `setup_demo_auth_users_fixed` | Seed demo users |
| 2026-02-12 | `fix_auth_rls_policies` | Fix RLS policies for demo auth |
| 2026-02-12 | `setup_auth_trigger_and_function` | Auth trigger setup |
| 2026-02-12 | `create_demo_users_function` | Demo user creation function |
| 2026-02-12 | `create_unified_weekly_submissions` | Consolidate 1:1 + BD weekly into `weekly_submissions` |
| 2026-02-12 | `add_weekly_activity_targets` | Add `weekly_activity_targets` table |
| 2026-02-13 | `rename_pipeline_coverage_to_pipeline_value` | Rename target column |
| 2026-02-13 | `add_weekly_goals_columns` | Add columns to weekly_goals |
| 2026-02-13 | `fix_weekly_goals_meeting_id_and_delete_policy` | Fix FK + delete policy |
| 2026-02-19 | `fix_weekly_activity_targets_rls` | Fix RLS on targets |
| 2026-02-19 | `fix_security_issues_comprehensive` | Comprehensive security fixes |
| 2026-02-20 | `fix_weekly_goals_admin_insert_policy` | Admin insert policy |
| 2026-02-20 | `fix_weekly_goals_admin_update_delete_policies` | Admin update/delete policies |
| 2026-02-20 | `fix_weekly_goals_update_policy_with_check` | WITH CHECK clause |
| 2026-02-20 | `fix_weekly_goals_rls_for_demo_mode` | Demo mode RLS |
| 2026-02-20 | `allow_anon_access_to_weekly_goals` | Anon access for demo |
| 2026-03-06 | `add_deals_won_this_week_column` | Add deals_won_this_week |
| 2026-03-12 | `add_deals_won_this_week_to_submissions` | Add to weekly_submissions |
| 2026-03-20 | `add_previous_week_meetings_goals_tracking` | Previous week meeting/goal tracking |
| 2026-04-03 | `fix_deals_won_this_week_incorrect_data` | Data fix |
| 2026-04-03 | `add_f2f_meetings_held_last_week` | F2F held last week field |
| 2026-04-21 | `add_bdr_role_and_olivia` | Add BDR role + demo BDR user |
| 2026-05-15 | `add_f2f_meetings_pipeline_tentative` | Tentative F2F pipeline |
| 2026-05-29 | `update_olivia_role_to_rep` | Change Olivia from BDR to rep |
| 2026-05-29 | `deactivate_rocio` | Deactivate Rocio |
| 2026-06-26 | `deactivate_jason_w` | Deactivate Jason W |
| 2026-07-02 | `add_q3_2026_weeks` | Seed Q3 2026 weeks |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **BD** | Business Development |
| **BDR** | Business Development Representative (top-of-funnel role) |
| **MTD** | Month-to-Date |
| **QTD** | Quarter-to-Date |
| **SAO** | Sales Accepted Opportunity (an opportunity that the sales team has accepted from BDR) |
| **Pipeline Coverage** | Total pipeline value divided by remaining quota |
| **F2F** | Face-to-Face meeting |
| **SPICED** | Sales methodology: Situation, Pain, Impact, Critical Event, Decision |
| **1:1** | One-on-one meeting between rep and manager |
| **KPI** | Key Performance Indicator |
| **RLS** | Row Level Security (PostgreSQL feature) |

---

*End of Document*

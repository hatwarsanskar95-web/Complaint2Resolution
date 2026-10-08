# Complaint2Resolution — Master Task Tracker

> **Tagline**: "Don't Just Register Complaints. Drive Them to Verified Resolution."  
> **Source of Truth**: `resolution.prd.pdf` & `IMPLEMENTATION_PLAN.md`  
> **Rule**: Checkbox `[x]` is marked ONLY after implementation is complete, tested, and acceptance criteria are satisfied.

---

## Phase 0 — Project & Codebase Audit

- [x] Read complete 98-page PRD (`resolution.prd.pdf`)
- [x] Inspect existing project folder structure and dependencies
- [x] Inspect existing database schema (`supabase/schema.sql`)
- [x] Inspect existing authentication, middleware, and route protection
- [x] Inspect existing citizen pages, officer pages, and API routes
- [x] Inspect Gemini integration (`src/app/api/complaints/analyze/route.ts`)
- [x] Identify functional baselines, gaps, and technical risks
- [x] Create `IMPLEMENTATION_PLAN.md` in project root
- [x] Create `task.md` in project root

---

## Phase 1 — Project Foundation, Dependencies & Environment Verification ✅ COMPLETED

- [x] [P0] Verify Next.js 16 App Router configuration and Tailwind CSS v4 setup
- [x] [P0] Create centralized environment validation helper (`src/lib/config.ts`)
- [x] [P0] Validate Supabase client and server configuration (`src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`)
- [x] [P0] Validate Google GenAI SDK configuration and test server-side initialization
- [x] [P1] Add health check endpoint (`/api/health`) verifying database and AI readiness
- [x] [P0] Verify zero client-side exposure of `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`

---

## Phase 2 — Database Schema Finalization, Triggers & RLS Policies ✅ COMPLETED

- [x] [P0] Refine and verify custom ENUM types (`user_role`, `priority_level`, `complaint_status`)
- [x] [P0] Finalize `profiles`, `departments`, `department_categories`, and `officer_departments` tables
- [x] [P0] Finalize `complaints` table with permanent ID, location, priority, and SLA fields
- [x] [P0] Finalize `complaint_images`, `complaint_ai_analysis`, and `complaint_status_history` tables
- [x] [P0] Finalize `sla_events`, `escalations`, `resolution_submissions`, and `resolution_reports` tables
- [x] [P0] Finalize `ai_verifications`, `citizen_verifications`, `department_scores`, `notifications`, and `audit_logs` tables
- [x] [P0] Implement `handle_new_user()` trigger for automatic profile synchronization
- [x] [P0] Implement `generate_complaint_id()` trigger for permanent format `CR-YYYY-XXXXXX` with concurrency locks
- [x] [P0] Implement `log_status_transition()` trigger for automatic chronological audit logging
- [x] [P0] Configure Row Level Security (RLS) policies for all 4 roles (Citizen, Officer, Dept Admin, Super Admin)
- [x] [P0] Align TypeScript definitions in `src/lib/types.ts` with database schema

---

## Phase 3 — Admin & Department Admin Authentication ✅ COMPLETED

- [x] [P0] Create Admin login page at `src/app/admin/login/page.tsx`
- [x] [P0] Implement server-side role verification restricting access to `dept_admin` and `super_admin`
- [x] [P0] Add role-based redirect logic in middleware for `/admin/*` routes
- [x] [P0] Implement flash error messages for unauthorized access attempts
- [x] [P0] Implement secure Admin sign-out action and session cleanup
- [x] [P0] Test admin login with valid admin credentials and invalid/citizen credentials

---

## Phase 3.1 — Authentication & Private Portals Update ✅ COMPLETED

- [x] [P0] Remove Officer Login link from public homepage navigation
- [x] [P0] Remove Admin Portal link from public homepage navigation
- [x] [P0] Add Register (signup) link to homepage nav as citizen CTA
- [x] [P0] Remove "Other portals" links (Officer/Admin) from citizen login page
- [x] [P0] Verify `/officer/login` still accessible directly (private, not publicly linked)
- [x] [P0] Verify `/admin/login` still accessible directly (private, not publicly linked)
- [x] [P0] Confirm middleware still enforces role-based protection on all private routes
- [x] [P0] Confirm Supabase RLS still enforces department isolation for officers
- [x] [P0] TypeScript check passes (`npx tsc --noEmit` exit code 0)


---

## Phase 4 — Admin Panel Foundation & Layout ✅ COMPLETED

- [x] [P0] Create responsive Admin layout at `src/app/admin/layout.tsx`
- [x] [P0] Build Admin sidebar navigation with role-aware tabs (Central Authority vs Dept Admin)
- [x] [P0] Build Admin header with admin profile badge, active department indicator, and notifications
- [x] [P0] Build Admin dashboard shell at `src/app/admin/dashboard/page.tsx`
- [x] [P1] Add responsive mobile drawer for admin sidebar on smaller viewports
- [x] [P1] Implement smooth route transition animations and active link styling

---

## Phase 4.1 — Site-Wide Professional Animation & Motion System ✅ COMPLETED

- [x] [P0] Build reusable motion primitives in `src/components/ui/motion.tsx` (`<FadeIn>`, `<StaggerContainer>`, `<StaggerItem>`, `<AnimatedNumber>`, `<ModalWrapper>`, `<AiProcessingIndicator>`)
- [x] [P0] Implement shimmer gradient skeleton loaders (`<SkeletonCard>`, `<SkeletonMetric>`, `<SkeletonRow>`)
- [x] [P0] Integrate interactive motion across Citizen, Officer, and Admin dashboards
- [x] [P1] Add spring physics, button press feedback, and glassmorphic micro-interactions in `src/app/globals.css`
- [x] [P0] Verify zero performance degradation and clean exit/entry unmounting

---

## Phase 4.2 — Global In-App Toast System & WebGL Background Integration ✅ COMPLETED

- [x] [P0] Create unified global toast notification system in `src/context/ToastContext.tsx`
- [x] [P0] Mount `ToastProvider` at root `src/app/layout.tsx` for site-wide accessibility
- [x] [P0] Provide standalone `toast` singleton (`toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`, `toast.loading()`, `toast.update()`, `toast.dismiss()`)
- [x] [P0] Support live operational state transitions (e.g. Loading $\rightarrow$ Success / Error)
- [x] [P0] Completely eliminate all browser-native `alert()`, `confirm()`, and `prompt()` calls from `src/`
- [x] [P0] Replace alerts in Citizen reporting, Officer login, Admin login, Password Reset, and Citizen auth
- [x] [P0] Build React Bits `<Galaxy />` interactive WebGL shader in `src/components/ui/Galaxy.tsx` and `Galaxy.css`
- [x] [P0] Integrate Galaxy component into homepage Section 4 ("Ready to Transform Your Community?") spanning through the Get Started button
- [x] [P0] TypeScript checks pass with 0 errors (`npx tsc --noEmit`)

---

## Phase 5 — Department & Category Management (Admin) ✅ COMPLETED

- [x] [P0] Create Department management page at `src/app/admin/departments/page.tsx`
- [x] [P0] Build Department list view showing code, name, active officers, and open complaint count
- [x] [P0] Build Department creation and editing modal with code validation (e.g. `WATER`, `ROADS`)
- [x] [P0] Build Category & Subcategory management table per department
- [x] [P0] Configure default SLA hours per subcategory (e.g. Water Leak: 48h, Streetlight: 24h)
- [x] [P0] Create API endpoints `/api/admin/departments` (GET, POST, PATCH, DELETE)
- [x] [P0] Test dynamic department and category creation and verify database cascade

---

## Phase 6 — Officer Management & Department Assignment (Admin) ✅ COMPLETED

- [x] [P0] Create Officer management page at `src/app/admin/officers/page.tsx`
- [x] [P0] Build internal officer account creation form using Supabase service role client
- [x] [P0] Implement department assignment and reassignment selector for officers
- [x] [P0] Build Officer roster table showing name, email, department, active load, and SLA rate
- [x] [P0] Create API endpoints `/api/admin/officers` (GET, POST, PATCH, DELETE)
- [x] [P0] Test officer provisioning and verify officer can sign in at `/officer/login`

---

## Phase 7 — Citizen Authentication & Profile Enhancement ✅ COMPLETED

- [x] [P0] Verify citizen public registration at `src/app/signup/page.tsx`
- [x] [P0] Verify citizen login at `src/app/login/page.tsx` and session redirection
- [x] [P1] Build Citizen profile page at `src/app/citizen/profile/page.tsx`
- [x] [P1] Display citizen complaint summary statistics on profile page
- [x] [P1] Implement profile update action for contact information
- [x] [P0] Test citizen registration, login, profile view, and logout flows

---

## Phase 8 — Citizen Dashboard & Navigation ✅ COMPLETED

- [x] [P0] Enhance Citizen dashboard at `src/app/citizen/dashboard/page.tsx`
- [x] [P0] Display summary metric cards (Total, Active, Needs Action, Resolved)
- [x] [P0] Build prominent "Action Required" banner for complaints awaiting verification
- [x] [P0] Build complaint card list with permanent ID, status badge, priority, and SLA bar
- [x] [P1] Add filter tabs (All, Active, Verification Required, Closed) and search bar
- [x] [P1] Build empty states with quick "Report a Civic Issue" CTA
- [x] [P0] Test citizen dashboard across multiple complaint statuses

---

## Phase 9 — Complaint Submission (Photo + Geolocation + Description Validation) ✅ COMPLETED

- [x] [P0] Enhance complaint submission wizard at `src/app/citizen/report/page.tsx`
- [x] [P0] Enforce Mandatory Input 1: Photo upload/camera capture with client format validation
- [x] [P0] Enforce Mandatory Input 2: GPS Geolocation + Reverse Geocoding to address
- [x] [P0] Implement interactive map pin picker for manual GPS adjustment
- [x] [P0] Enforce Mandatory Input 3: Description field with minimum character limit
- [x] [P0] Block form submission if ANY of the 3 mandatory inputs are missing
- [x] [P0] Upload photo to Supabase Storage `complaint-images` bucket
- [x] [P0] Add submission preview card summarizing photo, map pin, and description
- [x] [P0] Test validation blocking on missing inputs and verify successful upload

---

## Phase 10 — Server-Side Gemini Multimodal Complaint Analysis Engine ✅ COMPLETED

- [x] [P0] Refactor server-side Gemini route at `src/app/api/complaints/analyze/route.ts`
- [x] [P0] Implement multimodal prompt analyzing uploaded image + citizen description
- [x] [P0] Enforce structured JSON output using Zod schema validation
- [x] [P0] Extract: Category, Subcategory, Department, Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), Summary, Recommended Action steps, Suggested SLA hours, Confidence score
- [x] [P0] Implement retry mechanism on Gemini failure and exponential backoff
- [x] [P0] Implement fallback handling: save complaint with `AI_PROCESSING_FAILED` if retry fails
- [x] [P0] Persist complete AI analysis to `complaint_ai_analysis` table
- [x] [P0] Test multimodal analysis with sample images (Pothole, Water Leak, Streetlight)

---

## Phase 11 — Smart Department Routing & Fallback Queue ✅ COMPLETED

- [x] [P0] Implement Smart Routing Service (`src/lib/services/routingService.ts`)
- [x] [P0] Auto-route high-confidence complaints ($\ge 0.70$) to department and set status `RECEIVED`
- [x] [P0] Route low-confidence complaints ($< 0.70$) to Human Review queue with status `SUBMITTED`
- [x] [P0] Calculate and assign SLA deadline based on priority (Critical: 6h, High: 24h, Medium: 48h, Low: 72h)
- [x] [P0] Atomically update complaint record with department, SLA, and initial status
- [x] [P0] Record status transition in `complaint_status_history`
- [x] [P0] Test auto-routing for high-confidence input and fallback for ambiguous input

---

## Phase 12 — Citizen Complaint Details, Status Timeline & Tracking ✅ COMPLETED

- [x] [P0] Enhance Citizen Complaint detail page at `src/app/citizen/complaints/[id]/page.tsx`
- [x] [P0] Clearly separate "Citizen Provided Information" from "AI Generated Information"
- [x] [P0] Build Chronological Visual Timeline component displaying all transition events
- [x] [P0] Display interactive SLA timer bar with color status (Green, Yellow, Orange, Red)
- [x] [P0] Create public tracking page at `src/app/track/page.tsx` searchable by `CR-YYYY-XXXXXX`
- [x] [P0] Create public tracking API `/api/complaints/track/[permanentId]` (safe public fields only)
- [x] [P0] Test detail page rendering and public tracking lookup by permanent ID

---

## Phase 13 — Official Complaint PDF Generation Service ✅ COMPLETED

- [x] [P0] Enhance PDF generation service at `src/app/api/complaints/[id]/pdf/route.ts`
- [x] [P0] Add official municipal header banner and report title
- [x] [P0] Render Section 1: Core Identifiers (Permanent ID `CR-YYYY-XXXXXX`, Status, Priority, Timestamp)
- [x] [P0] Render Section 2: Citizen Provided Information (Photo thumbnail, Address, GPS Coords, Description)
- [x] [P0] Render Section 3: AI Generated Analysis (Department, Category, Summary, Action Steps, SLA)
- [x] [P0] Render Section 4: Resolution & Verification sign-off placeholder
- [x] [P0] Add "Download Official PDF" button with loading spinner in citizen and officer views
- [x] [P0] Test PDF generation, formatting, and file download across devices

---

## Phase 14 — AI Action Brief & Officer Workspace Preparation ✅ COMPLETED

- [x] [P0] Build AI Action Brief component (`src/components/officer/AiActionBrief.tsx`)
- [x] [P0] Display summary, priority badge, department, SLA countdown, and required actions checklist
- [x] [P0] Build Officer 3-column workspace layout structure:
  - Left: Official PDF viewer, Original Citizen Photo (with zoom modal), Location Map, Citizen Description
  - Right: AI Action Brief, SLA Timer, Status Selector, Required Evidence Checklist
  - Bottom: Chronological Timeline, Evidence Locker, Resolution Submission Section
- [x] [P0] Test workspace responsiveness and evidence layout rendering

---

## Phase 15 — Officer Authentication & Department Authorization ✅ COMPLETED

- [x] [P0] Enhance Officer login at `src/app/officer/login/page.tsx`
- [x] [P0] Resolve officer's assigned department from `officer_departments` table
- [x] [P0] Implement server-side department check in `src/app/officer/layout.tsx`
- [x] [P0] Display active department badge in officer navigation bar
- [x] [P0] Block officer access to complaints outside assigned department (403 Forbidden)
- [x] [P0] Test cross-department authorization restrictions

---

## Phase 16 — Officer Dashboard & Filtered Queue Management ✅ COMPLETED

- [x] [P0] Upgrade Officer Dashboard at `src/app/officer/dashboard/page.tsx`
- [x] [P0] Build Queue Tab 1: `New` (`RECEIVED` — unassigned department complaints)
- [x] [P0] Build Queue Tab 2: `Assigned` (`ASSIGNED` — claimed by current officer)
- [x] [P0] Build Queue Tab 3: `In Progress` (`IN_PROGRESS`, `REOPENED` — active work)
- [x] [P0] Build Queue Tab 4: `Near SLA` ($<25\%$ SLA time remaining)
- [x] [P0] Build Queue Tab 5: `SLA Breached` (Overdue complaints)
- [x] [P0] Build Queue Tab 6: `Pending Verification` (`RESOLUTION_SUBMITTED`, `AI_VERIFICATION`, `CITIZEN_VERIFICATION`)
- [x] [P0] Build Queue Tab 7: `Closed` (`CLOSED`)
- [x] [P0] Add "Claim Complaint" button directly on cards in the New queue
- [x] [P1] Add category filter dropdown and search bar
- [x] [P0] Test tab switching, count badge accuracy, and SLA deadline ordering

---

## Phase 17 — Officer Complaint Handling & Status Lifecycle State Machine ✅ COMPLETED

- [x] [P0] Create Officer Complaint detail page at `src/app/officer/complaints/[id]/page.tsx`
- [x] [P0] Build Status Action Bar enforcing valid state machine transitions:
  - `RECEIVED` $\rightarrow$ `[ Accept & Assign to Me ]` $\rightarrow$ `ASSIGNED`
  - `ASSIGNED` $\rightarrow$ `[ Start Work ]` $\rightarrow$ `IN_PROGRESS`
  - `IN_PROGRESS` / `REOPENED` $\rightarrow$ `[ Submit Resolution Evidence ]`
- [x] [P0] Create Status Transition API `/api/officer/complaints/[id]/status` (POST)
- [x] [P0] Log every transition to `complaint_status_history` with officer ID and notes
- [x] [P0] Verify citizen view updates in real-time when officer claims and starts work

---

## Phase 18 — SLA Engine, Countdown System & Warning Thresholds ✅ COMPLETED

- [x] [P0] Build centralized SLA Service (`src/lib/services/slaService.ts`)
- [x] [P0] Implement SLA calculation rules based on priority (Critical: 6h, High: 24h, Medium: 48h, Low: 72h)
- [x] [P0] Build Live SLA Countdown component with dynamic color states:
  - 0–50% elapsed $\rightarrow$ Green (`normal`)
  - 50–75% elapsed $\rightarrow$ Yellow (`reminder`)
  - 75–90% elapsed $\rightarrow$ Orange (`warning`)
  - 90–100% elapsed $\rightarrow$ Red (`critical`)
  - $\ge 100\%$ elapsed $\rightarrow$ Flashing Red (`breached`)
- [x] [P0] Log threshold transition records in `sla_events` table (reminder, warning, critical_warning, breach)
- [x] [P0] Test countdown behavior across all 5 color thresholds

---

## Phase 19 — SLA Breach Detection & Automated Escalation Hierarchy ✅ COMPLETED

- [x] [P0] Implement Escalation Service (`src/lib/services/escalationService.ts`)
- [x] [P0] Implement breach detection trigger when `sla_deadline < NOW()` on unresolved tickets
- [x] [P0] Implement automated escalation hierarchy: Level 1 (Supervisor) $\rightarrow$ Level 2 (Dept Admin) $\rightarrow$ Level 3 (Central Authority)
- [x] [P0] Insert escalation records in `escalations` table with delay duration and reason
- [x] [P0] Build Admin Escalation Monitor page at `src/app/admin/escalations/page.tsx`
- [x] [P0] Display prominent escalation badges on breached complaints in all views
- [x] [P0] Test simulated SLA breach and verify automated escalation record creation

---

## Phase 20 — Resolution Evidence Collection (Before/After Photos & Action Notes) ✅ COMPLETED

- [x] [P0] Create Officer Resolution Submission page at `src/app/officer/complaints/[id]/resolve/page.tsx`
- [x] [P0] Enforce Mandatory Field 1: Action Taken note (operational description of work done)
- [x] [P0] Enforce Mandatory Field 2: Before Photo upload (site before/during fix)
- [x] [P0] Enforce Mandatory Field 3: After Photo upload (site after completed fix)
- [x] [P0] Block submission if any of the 3 evidence fields are missing
- [x] [P0] Upload proof photos to `resolution-evidence` storage bucket
- [x] [P0] Save submission record to `resolution_submissions` table
- [x] [P0] Create API endpoint `/api/officer/complaints/[id]/resolve` (POST)
- [x] [P0] Transition status to `RESOLUTION_SUBMITTED`

---

## Phase 21 — AI Resolution Report Generation & Officer Confirmation ✅ COMPLETED

- [x] [P0] Create AI Resolution Report API at `/api/complaints/[id]/generate-resolution-report` (POST)
- [x] [P0] Pass complaint context + officer action note + photos to Gemini to draft formal municipal report
- [x] [P0] Display generated report in editable officer review card
- [x] [P0] Allow officer to review, edit, and confirm resolution text
- [x] [P0] Require officer confirmation click before advancing to AI verification
- [x] [P0] Save finalized report in `resolution_reports` table
- [x] [P0] Test AI report generation, officer editing, and confirmation submission

---

## Phase 22 — AI Multimodal Resolution Verification Service ✅ COMPLETED

- [x] [P0] Build AI Verification Service (`src/lib/services/aiVerificationService.ts`)
- [x] [P0] Create API endpoint `/api/complaints/[id]/verify-resolution` (POST)
- [x] [P0] Gemini compares: Original Photo vs Officer Before Photo vs Officer After Photo + Descriptions
- [x] [P0] Return structured verdict: `RESOLUTION_CONSISTENT`, `POTENTIALLY_UNRESOLVED`, or `HUMAN_REVIEW_REQUIRED` with confidence score and explanation
- [x] [P0] Enforce PRD rule: Never claim "100% verified"; state "Evidence appears consistent with resolution"
- [x] [P0] Save verification outcome in `ai_verifications` table
- [x] [P0] State transition: If consistent $\rightarrow$ `CITIZEN_VERIFICATION`; If inconsistent/low confidence $\rightarrow$ `HUMAN_REVIEW_REQUIRED`
- [x] [P0] Test verification with matching resolution photos vs mismatched photos

---

## Phase 23 — Citizen Resolution Verification Portal (Confirm / Dispute) ✅ COMPLETED

- [x] [P0] Create Citizen Verification page at `src/app/citizen/complaints/[id]/verify/page.tsx`
- [x] [P0] Display side-by-side comparison of Original Photo, Officer Before Photo, and Officer After Photo
- [x] [P0] Display Officer Action Taken, AI Resolution Report, and resolution timestamp
- [x] [P0] Implement Primary Button: `[ YES — ISSUE RESOLVED ]`
- [x] [P0] On confirmation: transition status to `CLOSED` and prompt optional 5-star rating and comment
- [x] [P0] Save citizen confirmation record in `citizen_verifications` table
- [x] [P0] Create confirmation API `/api/citizen/complaints/[id]/confirm-resolution` (POST)
- [x] [P0] Test citizen confirmation flow and verify complaint closes

---

## Phase 24 — Citizen Dispute Workflow with Mandatory Current Photo ✅ COMPLETED

- [x] [P0] Implement Dispute Trigger when citizen clicks `[ NO — ISSUE STILL EXISTS ]`
- [x] [P0] Open Dispute Submission Modal on verification page
- [x] [P0] Enforce Mandatory Input: Current Photo showing unresolved condition
- [x] [P0] Input: Dispute reason text description
- [x] [P0] Block dispute submission if current photo is missing with clear error message
- [x] [P0] Upload dispute photo to `complaint-images` bucket with `image_type = 'dispute'`
- [x] [P0] Save dispute record in `citizen_verifications` (`is_satisfied = false`)
- [x] [P0] Create Dispute API `/api/citizen/complaints/[id]/dispute` (POST)
- [x] [P0] Transition status to `DISPUTED` and trigger AI Dispute Analysis

---

## Phase 25 — AI Dispute Analysis & Complaint Reopening (Same CR-ID Preservation) ✅ COMPLETED

- [x] [P0] Implement Dispute Analysis Service (`src/lib/services/disputeService.ts`)
- [x] [P0] Create API endpoint `/api/complaints/[id]/analyze-dispute` (POST)
- [x] [P0] Gemini evaluates 4 inputs: Original Photo, Officer Proof, Citizen Current Photo, and Descriptions
- [x] [P0] **Outcome 1**: If Issue Appears Unresolved $\rightarrow$ Reopen **SAME** complaint (`CR-YYYY-XXXXXX`), transition `REOPENED` $\rightarrow$ `IN_PROGRESS`, notify officer
- [x] [P0] **Outcome 2**: If Issue Appears Resolved $\rightarrow$ Do NOT reopen, show explanation, retain option for supervisor review
- [x] [P0] **Outcome 3**: If Low AI Confidence $\rightarrow$ Set status `HUMAN_REVIEW_REQUIRED`, route to Supervisor Review Queue
- [x] [P0] Enforce strict invariant: NEVER generate a new complaint ID for a reopened complaint
- [x] [P0] Test dispute reopening with unresolved photo proof and verify SAME `CR-YYYY-XXXXXX` is retained

---

## Phase 26 — Human Review Queue for Low-Confidence AI & Escalated Disputes ✅ COMPLETED

- [x] [P0] Create Human Review Queue page at `src/app/admin/complaints/review/page.tsx`
- [x] [P0] Display complaints flagged with `HUMAN_REVIEW_REQUIRED` or ambiguous routing
- [x] [P0] Build Split-Screen Evidence Inspection workspace:
  - Left: Original photo, location, citizen description
  - Center: Officer before/after proof, resolution report, dispute photo & notes
  - Right: AI confidence breakdown, AI reasoning, decision controls
- [x] [P0] Decision Action 1: `[ Confirm Resolution & Close ]` $\rightarrow$ Set status `CLOSED` with supervisor notes
- [x] [P0] Decision Action 2: `[ Reopen & Reassign ]` $\rightarrow$ Set status `REOPENED` $\rightarrow$ `IN_PROGRESS`
- [x] [P0] Decision Action 3: `[ Manual Route ]` $\rightarrow$ Assign department and set status `RECEIVED`
- [x] [P0] Create API `/api/admin/complaints/[id]/human-review` (POST) and log to `audit_logs`
- [x] [P0] Test human review supervisor override actions

---

## Phase 27 — Admin Complaint Monitoring, Advanced Filtering & Audit Logs ✅ COMPLETED

- [x] [P0] Build Admin Complaint Monitoring Center at `src/app/admin/complaints/page.tsx`
- [x] [P0] Implement instant search by Permanent ID (`CR-2026-XXXXXX`), address, or keyword
- [x] [P0] Implement status filter chips (All, Pending Routing, In Progress, Near SLA, SLA Breached, Disputed, Reopened, Closed)
- [x] [P0] Implement multi-select dropdowns for Department and Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`)
- [x] [P0] Build paginated data table with sorting by SLA deadline, date, priority
- [x] [P0] Build Complaint Quick-Inspect Drawer showing complete timeline and audit logs
- [x] [P0] Create API endpoint `/api/admin/complaints` (GET) with pagination and query filters
- [x] [P0] Test multi-filter combinations and verify fast query response

---

## Phase 28 — Admin Executive Dashboard & Real-Time KPI Metrics ✅ COMPLETED

- [x] [P0] Build Executive Admin Dashboard at `src/app/admin/dashboard/page.tsx`
- [x] [P0] Implement KPI Cards: Total Complaints, Resolution Rate %, Active Tickets, SLA Breaches, Escalations, Reopen Rate %, Avg Resolution Time
- [x] [P0] Build Live SLA Urgency Alert Banner highlighting tickets nearing breach ($<2$h) or already breached
- [x] [P0] Build Recent Escalations Feed showing live escalated tickets with department breakdown
- [x] [P0] Build Department Workload Progress bars comparing open load across all municipal departments
- [x] [P0] Create API endpoint `/api/admin/metrics/overview` (GET)
- [x] [P0] Test KPI metrics aggregation against database records

---

## Phase 29 — Department Performance Scoring Algorithm & Monthly Analytics ✅ COMPLETED

- [x] [P0] Implement Performance Scoring Algorithm (`src/lib/services/analyticsService.ts`):
  $$\text{Score} = 100 - (30 \times \text{Breach Rate}) - (25 \times \text{Reopen Rate}) - (20 \times \text{Escalation Rate}) + (15 \times \text{Resolution Rate}) + (10 \times \frac{\text{Rating}}{5})$$
- [x] [P0] Build Department Analytics page at `src/app/admin/(portal)/analytics/page.tsx`
- [x] [P0] Build Department Leaderboard ranking departments from 0 to 100 (e.g. Water: 92, Sanitation: 87, Roads: 74, Electrical: 66)
- [x] [P0] Build Monthly Volume & SLA Trend charts (filed vs resolved vs breached over time)
- [x] [P0] Build Officer Performance breakdown table (Assigned, Resolved, SLA Compliance %, Avg Time)
- [x] [P0] Create API endpoint `/api/admin/analytics/department-scores` (GET)
- [x] [P0] Test scoring algorithm calculation and leaderboard rendering

---

## Phase 30 — Recurring Issue Detection & Complaint Clustering ✅ COMPLETED

- [x] [P1] Build Recurring Issue Detection Service (`src/lib/services/recurringIssueService.ts`)
- [x] [P1] Implement geographic and category clustering query (e.g. $\ge 3$ complaints within 500m in 30 days)
- [x] [P1] Prompt Gemini to analyze cluster and generate root-cause hypothesis and preventive advice
- [x] [P1] Persist cluster insights in `complaint_clusters` table
- [x] [P1] Build Recurring Issues tab in Admin Analytics displaying issue cards and ward locations
- [x] [P1] Test recurring issue detection with clustered sample complaints

---

## Phase 31 — Duplicate Complaint Detection System ✅ COMPLETED

- [x] [P1] Build Duplicate Detection Service (`src/lib/services/duplicateDetectionService.ts`)
- [x] [P1] Query open complaints within 200m in same category upon new submission
- [x] [P1] Prompt Gemini to compare photo and text similarity against candidate complaints
- [x] [P1] If duplicate confirmed: notify citizen about existing tracked complaint (`CR-2026-XXXXXX`)
- [x] [P1] Test duplicate detection with identical sample submissions

---

## Phase 32 — In-App Notification System & Real-Time Alerts ✅ COMPLETED

- [x] [P0] Build Notification Service (`src/lib/services/notificationService.ts`)
- [x] [P0] Create Header Notification Bell component (`src/components/notifications/NotificationBell.tsx`)
- [x] [P0] Integrate notification bell in Citizen, Officer, and Admin navigation headers
- [x] [P0] Trigger automated notifications on all major lifecycle events (Assigned, Work Started, Resolution Submitted, Verification Required, Reopened, SLA Breach)
- [x] [P0] Create Notification API endpoints `/api/notifications` (GET, PATCH)
- [x] [P0] Test notification delivery, unread counter, and mark-as-read action

---

## Phase 33 — Security, RLS & Authorization Hardening Audit ✅ COMPLETED

- [x] [P0] Audit and verify Supabase RLS policies across all 18 tables
- [x] [P0] Verify Citizen cannot query or access other citizens' complaints
- [x] [P0] Verify Officer cannot query or modify complaints outside assigned department
- [x] [P0] Verify Department Admin cannot access other departments' restricted settings
- [x] [P0] Verify all Storage buckets enforce size limits ($\le 10\text{MB}$) and allowed MIME types
- [x] [P0] Audit all API route handlers for strict session and role validation
- [x] [P0] Verify zero client bundle exposure of `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY`
- [x] [P0] Run automated authorization penetration tests

---

## Phase 34 — End-to-End Workflow Integration & Interactive Flow Testing ✅ COMPLETED

- [x] [P0] Test Complete Journey 1: Citizen Submission $\rightarrow$ AI Analysis $\rightarrow$ Auto Routing $\rightarrow$ `CR-2026-XXXXXX` Generated
- [x] [P0] Test Complete Journey 2: Officer Dashboard $\rightarrow$ Claim Complaint $\rightarrow$ Start Work $\rightarrow$ SLA Timer Active
- [x] [P0] Test Complete Journey 3: Officer Resolution $\rightarrow$ Before/After Upload $\rightarrow$ AI Report $\rightarrow$ AI Verification
- [x] [P0] Test Complete Journey 4: Citizen Verification $\rightarrow$ Confirm YES $\rightarrow$ Ticket CLOSED $\rightarrow$ Rating Saved
- [x] [P0] Test Complete Journey 5: Citizen Verification $\rightarrow$ Dispute NO $\rightarrow$ Mandatory Photo $\rightarrow$ AI Dispute $\rightarrow$ Reopen SAME CR-ID
- [x] [P0] Test Complete Journey 6: SLA Breach Trigger $\rightarrow$ Level 1/2/3 Escalation $\rightarrow$ Admin Dashboard Update
- [x] [P0] Verify chronological audit timeline and notification consistency throughout entire flow

---

## Phase 35 — UI/UX Government-Grade Aesthetic Polish & Animation System ✅ COMPLETED

- [x] [P1] Refine global design tokens in `src/app/globals.css` (Government-grade dark theme, crisp borders, button & card micro-interactions)
- [x] [P1] Add loading skeleton states for complaint lists, dashboards, and detail views (`src/components/ui/motion.tsx`)
- [x] [P1] Implement accessible empty states and interactive toast / alert notifications
- [x] [P1] Verify responsive mobile layout for Citizen portal with animated mobile drawer & backdrop blur
- [x] [P1] Verify responsive desktop layout for Officer workspace and Admin data tables with smooth transitions
- [x] [P1] Add subtle micro-animations for status badges, SLA countdowns, and tab transitions
- [x] [P1] Ensure 100% compliance with `prefers-reduced-motion` for accessibility

---

## Phase 36 — Realistic Demo Data Seeding & Hackathon Presentation Script ✅ COMPLETED

- [x] [P0] Create demo database seeding script (`src/lib/seedDemoData.ts`)
- [x] [P0] Seed 5 Demo Accounts:
  - Citizen: `citizen@demo.in` / `Password123!`
  - Officer (Water): `officer.water@demo.in` / `Password123!`
  - Officer (Roads): `officer.roads@demo.in` / `Password123!`
  - Dept Admin: `admin.water@demo.in` / `Password123!`
  - Super Admin: `superadmin@demo.in` / `Password123!`
- [x] [P0] Seed realistic complaints across all lifecycle states (New, In Progress, SLA Breached, Awaiting Verification, Reopened, Closed)
- [x] [P0] Seed Department Performance Scores for leaderboard (Water: 92, Sanitation: 87, Roads: 74, Electrical: 66)
- [x] [P0] Add Demo Quick-Login credentials helper buttons on login pages (`src/components/auth/QuickLoginButtons.tsx`)
- [x] [P0] Verify 3-minute hackathon presentation demo script execution

---

## Phase 37 — Production Build Verification & Vercel Deployment Readiness ✅ COMPLETED

- [x] [P0] Execute `npm run build` and resolve all TypeScript and ESLint warnings
- [x] [P0] Verify production environment variables and Supabase connection
- [x] [P0] Verify Gemini API quota and production error handling
- [x] [P0] Verify page metadata, title tags, favicon, and SEO descriptions
- [x] [P0] Execute final production smoke test on deployed environment

---
*End of Master Task Tracker — ALL PHASES 0 TO 37 ARE 100% COMPLETED & VERIFIED!*

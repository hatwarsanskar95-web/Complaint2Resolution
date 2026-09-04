# COMPLAINT2RESOLUTION — MASTER IMPLEMENTATION PLAN
**Platform**: AI-Powered Civic Complaint & Accountability Engine  
**Theme**: SIH 2026 — Smart Automation  
**Primary Source of Truth**: `resolution.prd.pdf` (Master PRD)  
**Date**: September 2026  

---

## Executive Architectural Summary

**Complaint2Resolution** is not a basic complaint CRUD ticketing system. It is an automated civic accountability loop that bridges citizen reporting with verified municipal resolution through:
1. **Mandatory Photographic & Geolocation Evidence**: Enforced on initial submission and during dispute resolution.
2. **Multimodal Gemini AI Engine**: Server-side image + text understanding for categorization, severity scoring, departmental routing, action briefing, resolution drafting, and before/after verification.
3. **Automated SLA Engine & Multi-Tier Escalation**: Backend-enforced SLA timers with warning states and automated hierarchical escalation upon breach.
4. **Evidence-Based Resolution & Two-Tier Verification**: Dual verification by Gemini AI and the reporting Citizen before closure.
5. **Strict Complaint Identity Preservation**: Preserving the permanent `CR-YYYY-XXXXXX` complaint ID and chronological audit timeline across disputes and reopens.
6. **Administrative Transparency & Department Performance Scoring**: Objective metrics for municipal accountability without payroll automation.

---

## Master Phase Breakdown

---

### Phase 0 — Project & Codebase Audit

#### Objective
Audit the entire repository against the 98-page Master PRD, inspect the existing Next.js 16 + Supabase codebase, identify functional baselines, gaps, technical debt, and establish the development foundation.

#### PRD Requirements Covered
- PRD Section 1–11: Project Scope, Core Problem, Architecture, Role Separation, Platform Boundaries.
- PRD Section 100: SIH 2026 Core Requirements & Boundaries.

#### Current Implementation
- Next.js 16.3.2 (App Router), React 19.2.8, Tailwind CSS v4, TypeScript 5.
- Supabase SSR integration (`@supabase/ssr`, `@supabase/supabase-js`).
- Google GenAI SDK (`@google/genai` v2.18.0).
- jsPDF (`jspdf` v4.2.1) installed for PDF generation.
- Initial baseline exists for Citizen report form, basic AI analyze route, officer dashboard shell, and citizen dashboard.
- Database schema draft exists in `supabase/schema.sql`.

#### Required Implementation
- Formalize audit findings into `IMPLEMENTATION_PLAN.md` and `task.md` in root directory.
- Establish strict role-based access invariants and coding rules.

#### Database Changes
- None (Inspection only).

#### Backend/API Changes
- None (Inspection only).

#### Frontend Changes
- None (Inspection only).

#### AI Changes
- Verify `@google/genai` API keys and multimodal capabilities.

#### Security Considerations
- Ensure no API keys or service role secrets are exposed to client bundles.

#### Dependencies
- None.

#### Testing
- Verify Next.js dev server starts and builds cleanly.

#### Acceptance Criteria
- Full audit report delivered with complete gap analysis.

#### Definition of Done
- `IMPLEMENTATION_PLAN.md` and `task.md` committed and verified in project root.

---

### Phase 1 — Project Foundation, Dependencies & Environment Verification

#### Objective
Ensure all required runtime dependencies, environment variables, Supabase connections, and Gemini API keys are verified and correctly configured.

#### PRD Requirements Covered
- PRD Section 6: Technology Stack.
- PRD Section 72 & 76: Gemini Server-side Architecture and Secret Protection.

#### Current Implementation
- `package.json` contains Next.js 16, React 19, `@google/genai`, `@supabase/ssr`, `lucide-react`, `jspdf`, `framer-motion`.
- `.env.local.example` contains placeholders for Supabase URL, Anon Key, Service Role Key, and Gemini API Key.

#### Required Implementation
- Validate environment variable loaders with fallback error messaging.
- Create shared configuration utility (`src/lib/config.ts`) asserting required server-side env vars at startup.
- Validate Supabase client/server helper exports.

#### Database Changes
- None.

#### Backend/API Changes
- Add environment configuration check in `src/lib/config.ts`.

#### Frontend Changes
- None.

#### AI Changes
- Initialize singleton Google Gen AI client with server-side validation.

#### Security Considerations
- Ensure `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are strictly server-only.

#### Dependencies
- Phase 0.

#### Testing
- Run test environment validation script.

#### Acceptance Criteria
- Server-side environment loads without missing key errors.

#### Definition of Done
- Configuration helper active; zero secret exposure in browser network inspection.

---

### Phase 2 — Database Schema Finalization, Triggers & RLS Policies

#### Objective
Finalize the Supabase PostgreSQL database schema with all tables, constraints, ENUMs, automated triggers for permanent Complaint ID generation (`CR-YYYY-XXXXXX`), status history audit logging, and strict Row Level Security (RLS) policies for all 4 roles.

#### PRD Requirements Covered
- PRD Section 8, 10, 19, 33, 67, 68, 69: Roles, Permanent ID `CR-YYYY-XXXXXX`, Status State Machine, RLS rules, Core Tables.

#### Current Implementation
- `supabase/schema.sql` contains initial tables: `profiles`, `departments`, `department_categories`, `officer_departments`, `complaints`, `complaint_images`, `complaint_ai_analysis`, `complaint_status_history`, `sla_events`, `escalations`, `resolution_submissions`, `ai_verifications`, `citizen_verifications`, `department_scores`, `notifications`, `audit_logs`.
- Triggers for `handle_new_user()`, `generate_complaint_id()`, `log_status_transition()`.

#### Required Implementation
- Verify and refine ENUMs (`user_role`: `citizen`, `officer`, `dept_admin`, `super_admin`; `complaint_status`: `SUBMITTED`, `RECEIVED`, `ASSIGNED`, `IN_PROGRESS`, `RESOLUTION_SUBMITTED`, `AI_VERIFICATION`, `RESOLVED`, `CITIZEN_VERIFICATION`, `CLOSED`, `DISPUTED`, `AI_DISPUTE_VERIFICATION`, `REOPENED`, `HUMAN_REVIEW_REQUIRED`).
- Ensure advisory lock in `generate_complaint_id()` handles high concurrency.
- Add `resolution_reports` and `complaint_clusters` tables if not present.
- Create comprehensive RLS policies preventing cross-department access by officers and unauthorized citizen data reads.

#### Database Changes
- Apply finalized SQL migration with all tables, constraints, foreign keys, indexes, and triggers.

#### Backend/API Changes
- Update TypeScript types in `src/lib/types.ts` to mirror exact schema definitions.

#### Frontend Changes
- None.

#### AI Changes
- None.

#### Security Considerations
- RLS enabled on 100% of public tables. Service role client used only for server-side background orchestration.

#### Dependencies
- Phase 1.

#### Testing
- Execute SQL migration in Supabase SQL editor; test trigger execution for ID generation and status history logging.

#### Acceptance Criteria
- Inserting a complaint automatically assigns `CR-2026-XXXXXX` and creates initial status history record.

#### Definition of Done
- SQL schema fully applied and verified; TypeScript types 100% aligned.

---

### Phase 3 — Admin & Department Admin Authentication

#### Objective
Implement internal authentication for Department Admins and Central Authority (Super Admin) at `/admin/login`, with server-side role validation and automatic dashboard routing.

#### PRD Requirements Covered
- PRD Section 8, 9, 10, 13: Role separation, internal admin accounts, no public signup for admin roles, `/admin/login` page.

#### Current Implementation
- `/admin/login` does not exist.
- Middleware has route check for `/admin` redirecting to `/admin/login`.

#### Required Implementation
- Build `/admin/login` page with secure email/password form, state loading, and error handling.
- Enforce server-side role verification: allow only `dept_admin` and `super_admin`.
- Redirect citizens and officers to their respective portals with clear flash notifications.
- Implement secure logout action for administrative sessions.

#### Database Changes
- Ensure `profiles` table has `role` field checked during session validation.

#### Backend/API Changes
- Add auth action / route for admin session verification.

#### Frontend Changes
- Create `src/app/admin/login/page.tsx` with professional government-grade dark UI styling.

#### AI Changes
- None.

#### Security Considerations
- Block public signup for admin roles. Server-side middleware and layout guards must reject non-admin JWTs.

#### Dependencies
- Phase 2.

#### Testing
- Attempt login with citizen credentials (must be rejected); attempt login with admin credentials (must route to `/admin/dashboard`).

#### Acceptance Criteria
- Non-admin users cannot access `/admin/*` routes under any circumstance.

#### Definition of Done
- `/admin/login` functional, tested, and guarded by middleware and server layout.

---

### Phase 4 — Admin Panel Foundation & Layout

#### Objective
Build the master Admin layout shell with responsive sidebar, header, role switcher indicator (Department Admin vs Central Authority), breadcrumbs, and live system status banner.

#### PRD Requirements Covered
- PRD Section 11, 57, 58, 66, 79, 80, 83: Admin navigation structure, workspace layout, responsive desktop-first design.

#### Current Implementation
- No admin layout exists in `src/app/admin`.

#### Required Implementation
- Create `src/app/admin/layout.tsx` with:
  - Sidebar: Dashboard, Departments, Officers, Complaints Queue, Escalations, Analytics, Settings.
  - Role-aware navigation: Central Authority sees all tabs; Department Admin sees only their assigned department tabs.
  - Header: Current admin badge, department indicator, notification trigger, logout button.
- Create dashboard shell page at `src/app/admin/dashboard/page.tsx`.

#### Database Changes
- None.

#### Backend/API Changes
- Add helper to resolve admin context and department scope.

#### Frontend Changes
- Create `src/app/admin/layout.tsx` and `src/app/admin/dashboard/page.tsx`.
- Include active route highlighting and smooth micro-animations.

#### AI Changes
- None.

#### Security Considerations
- Server-side layout verification of admin role before rendering children.

#### Dependencies
- Phase 3.

#### Testing
- Test responsive layout on mobile, tablet, and desktop viewports.

#### Acceptance Criteria
- Clean, responsive navigation shell with distinct visual indicators for Central Admin vs Dept Admin.

#### Definition of Done
- Admin shell responsive, accessible, and connected to Supabase auth context.

---

### Phase 5 — Department & Category Management (Admin)

#### Objective
Implement Central Admin interfaces and APIs for managing municipal departments (Water, Sanitation, Roads, Electrical, Drainage, Parks) and their corresponding categories, subcategories, and default SLA hours.

#### PRD Requirements Covered
- PRD Section 11, 15, 23, 67: Department workspaces, configurable categories, subcategories, SLA baselines.

#### Current Implementation
- `departments` and `department_categories` tables defined in `schema.sql`. No UI or API routes exist.

#### Required Implementation
- Create `/admin/departments` page for Central Authority.
- List all departments with active officer count, open complaint count, and health indicator.
- Modal/form to create or edit departments and assign department code (e.g. `WATER`, `ROADS`).
- Manage subcategories and default SLA durations (e.g., Water Leakage: 48h; Broken Streetlight: 24h).

#### Database Changes
- None (schema ready).

#### Backend/API Changes
- Create API routes `/api/admin/departments` (GET, POST) and `/api/admin/departments/[id]` (PATCH, DELETE).

#### Frontend Changes
- Build `src/app/admin/departments/page.tsx` with department cards, category breakdown, and edit dialogs.

#### AI Changes
- Provide standard category/department list to Gemini prompt configuration.

#### Security Considerations
- Only `super_admin` can create or delete departments; `dept_admin` can view their department rules.

#### Dependencies
- Phase 4.

#### Testing
- Create a test department with custom categories; verify database persistence and category cascade.

#### Acceptance Criteria
- Central admin can add/edit departments and category SLAs dynamically.

#### Definition of Done
- CRUD operations for departments and categories complete and tested.

---

### Phase 6 — Officer Management & Department Assignment (Admin)

#### Objective
Implement the Officer management system allowing Central Authority and Department Admins to create internal officer accounts, assign them to departments, view workloads, and manage active status.

#### PRD Requirements Covered
- PRD Section 8, 12, 57, 61, 67: Internal officer creation, department binding, officer performance monitoring.

#### Current Implementation
- `officer_departments` table exists in schema. No UI or API routes exist.

#### Required Implementation
- Build `/admin/officers` page.
- Allow Department Admin and Super Admin to invite/create officer profiles with initial credentials.
- Link officer to specific department via `officer_departments`.
- Display officer roster: Name, email, assigned department, active complaints count, resolved count, SLA compliance rate.
- Allow reassigning officers to different departments.

#### Database Changes
- None (uses `profiles` with role `officer` and `officer_departments`).

#### Backend/API Changes
- Create `/api/admin/officers` (GET, POST) using Supabase service role client to create auth users without public signup.

#### Frontend Changes
- Build `src/app/admin/officers/page.tsx` with searchable officer table, workload badges, and creation modal.

#### AI Changes
- None.

#### Security Considerations
- Prevent public signup for officers. Restrict officer creation to authorized admins via secure server action/API.

#### Dependencies
- Phase 5.

#### Testing
- Admin creates an officer; officer logs in at `/officer/login` and sees only their department queue.

#### Acceptance Criteria
- Officers can be created and bound to departments; cannot be created via public signup.

#### Definition of Done
- Officer provisioning flow working end-to-end with verified login.

---

### Phase 7 — Citizen Authentication & Profile Enhancement

#### Objective
Polish the Citizen registration, login, session persistence, and profile view at `/signup`, `/login`, and `/citizen/profile`, ensuring seamless onboarding without unnecessary friction.

#### PRD Requirements Covered
- PRD Section 8, 9, 11, 12, 63, 66, 67: Simple citizen signup/login, role metadata, citizen profile.

#### Current Implementation
- `src/app/login/page.tsx` and `src/app/signup/page.tsx` functional with Supabase email/password.
- Middleware redirects logged-in citizens to `/citizen/dashboard`.

#### Required Implementation
- Add `/citizen/profile` page allowing citizens to view account details, total complaints filed, and update contact info.
- Add password recovery/reset placeholder flow.
- Add session auto-refresh handling in citizen layout.

#### Database Changes
- None.

#### Backend/API Changes
- Profile update server action.

#### Frontend Changes
- Create `src/app/citizen/profile/page.tsx`.
- Enhance header navigation in `src/app/citizen/layout.tsx` with user avatar, name, and logout.

#### AI Changes
- None.

#### Security Considerations
- Enforce citizen profile RLS so citizens cannot modify role metadata to escalate privileges.

#### Dependencies
- Phase 2.

#### Testing
- Register new citizen, verify profile creation in `profiles` table, test login and profile view.

#### Acceptance Criteria
- Citizen registration creates profile with `citizen` role; profile is accessible.

#### Definition of Done
- Citizen auth and profile view complete, verified, and secure.

---

### Phase 8 — Citizen Dashboard & Navigation

#### Objective
Implement the Citizen Dashboard displaying complaint statistics (Total, Active, Awaiting Verification, Resolved, Reopened), quick action buttons, and searchable complaint cards.

#### PRD Requirements Covered
- PRD Section 12, 55, 66, 81: Citizen dashboard, complaint status cards, action alerts.

#### Current Implementation
- `src/app/citizen/dashboard/page.tsx` displays basic stats and list of citizen complaints.

#### Required Implementation
- Enhance dashboard cards to display: Permanent ID, category, subcategory, address, current status badge, SLA countdown bar, and date.
- Add "Action Required" prominent banner when complaints are in `CITIZEN_VERIFICATION` status with direct link to verify.
- Add tab filtering: All, In Progress, Action Required, Resolved/Closed.
- Implement empty states with "Report a Civic Issue" CTA.

#### Database Changes
- None.

#### Backend/API Changes
- Optimized Supabase query with status grouping.

#### Frontend Changes
- Update `src/app/citizen/dashboard/page.tsx` with interactive filter tabs, search bar, and enhanced cards.

#### AI Changes
- None.

#### Security Considerations
- Query strictly scoped to `auth.uid() = citizen_id`.

#### Dependencies
- Phase 7.

#### Testing
- Verify dashboard filters complaints correctly across multiple statuses.

#### Acceptance Criteria
- Dashboard reflects real-time status and highlights complaints requiring citizen action.

#### Definition of Done
- Citizen dashboard UI polished, responsive, and connected to live database.

---

### Phase 9 — Complaint Submission (Photo + Geolocation + Description Validation)

#### Objective
Build the citizen complaint submission workflow at `/citizen/report` strictly enforcing the 3 mandatory inputs: Photo (Camera capture or gallery upload), Location (GPS coordinates + reverse geocoded address + interactive map picker), and Description (with minimum length).

#### PRD Requirements Covered
- PRD Section 4, 5, 13, 14, 15, 16, 17, 18, 81: 3 Mandatory inputs, validation rules, photo storage upload, submission prevention if missing.

#### Current Implementation
- `src/app/citizen/report/page.tsx` exists with 3-step wizard (Photo, Location, Description) and basic geolocation.

#### Required Implementation
- Enforce strict client & server validation: If photo, location, or description is missing, reject submission.
- Add interactive Leaflet / OpenStreetMap pin picker so citizens can fine-tune GPS location manually if GPS is inaccurate.
- Add client-side image compression and format validation before uploading to `complaint-images` bucket in Supabase Storage.
- Add character counter for description (min 15 characters).
- Add submission review preview step showing photo thumbnail, map pin, and description summary before final submit.

#### Database Changes
- Ensure `complaint-images` storage bucket exists with appropriate size limits (e.g., max 10MB).

#### Backend/API Changes
- Ensure server-side validation in submission endpoint rejects incomplete payloads.

#### Frontend Changes
- Enhance `src/app/citizen/report/page.tsx` with interactive map picker, live preview card, and progress indicator.

#### AI Changes
- Prepare image buffer and prompt payload for immediate downstream AI analysis.

#### Security Considerations
- Restrict upload file types to JPEG, PNG, WEBP. Sanitize file names.

#### Dependencies
- Phase 8.

#### Testing
- Attempt submission with missing photo, missing GPS, or short description (must be blocked). Submit complete data (must succeed).

#### Acceptance Criteria
- Complaint cannot be submitted without all 3 mandatory inputs.

#### Definition of Done
- Submission form validated, storage upload verified, interactive map picker working.

---

### Phase 10 — Server-Side Gemini Multimodal Complaint Analysis Engine

#### Objective
Implement the server-side Gemini AI engine that analyzes the uploaded complaint photo and citizen description to extract category, subcategory, recommended department, priority level, 1-2 sentence executive summary, practical recommended action steps, suggested SLA hours, and confidence score.

#### PRD Requirements Covered
- PRD Section 7, 20, 21, 22, 23, 25, 26, 27, 72, 73, 74, 94: Multimodal analysis, structured JSON output, schema validation, retry mechanism, fallback handling.

#### Current Implementation
- `src/app/api/complaints/analyze/route.ts` calls `gemini-2.0-flash` with image base64 and description.

#### Required Implementation
- Upgrade prompt to enforce exact JSON schema validation with Zod.
- Configure prompt with comprehensive municipal domain context (Water, Sanitation, Roads, Electrical, Drainage, Parks).
- Implement robust retry logic: If Gemini call fails or returns non-JSON, retry once with exponential backoff; if repeated failure, set `AI_PROCESSING_FAILED` and flag for human review without losing the complaint.
- Store full AI analysis in `complaint_ai_analysis` table and link to complaint record.
- Priority evaluation based on public safety, severity, disruption, and duration.

#### Database Changes
- Ensure `complaint_ai_analysis` fields support structured `recommended_actions` (JSONB) and `raw_response`.

#### Backend/API Changes
- Refactor `src/app/api/complaints/analyze/route.ts` with Zod schema parser and structured error handling.

#### Frontend Changes
- Update report submission loading state with animated step progress ("Analyzing photo with Gemini AI...", "Routing to department...", "Generating Complaint ID...").

#### AI Changes
- Enforce strict JSON output mode via system instructions and temperature tuning (0.2 for deterministic classification).

#### Security Considerations
- `GEMINI_API_KEY` never sent to frontend; all AI processing happens inside Next.js route handler.

#### Dependencies
- Phase 9.

#### Testing
- Test with sample pothole, water leak, and broken streetlight photos; verify returned JSON matches schema and stores correctly.

#### Acceptance Criteria
- Gemini reliably returns structured JSON with category, priority, summary, recommended actions, and confidence.

#### Definition of Done
- Multimodal analysis route tested with multiple image types, error fallback verified, schema validated.

---

### Phase 11 — Smart Department Routing & Fallback Queue

#### Objective
Implement the smart routing engine that combines Gemini's department recommendation with configured department rules and confidence thresholds to assign the complaint to the correct department queue, or route to a human review queue if confidence is low.

#### PRD Requirements Covered
- PRD Section 11, 24, 33, 34, 73: Smart routing, confidence thresholds, fallback to human review, status transition to `RECEIVED`.

#### Current Implementation
- Basic string matching against department names in `analyze/route.ts`.

#### Required Implementation
- Routing Decision Matrix:
  - If AI confidence $\ge 0.70$ and recommended department exists $\rightarrow$ Auto-route to department, set status `RECEIVED`.
  - If AI confidence $< 0.70$ or department ambiguous $\rightarrow$ Set status `SUBMITTED`, flag `needs_human_review = true`, route to Central Admin / Supervisor routing queue.
- Calculate SLA deadline based on assigned priority:
  - `CRITICAL`: 6 hours
  - `HIGH`: 24 hours
  - `MEDIUM`: 48 hours
  - `LOW`: 72 hours
- Record initial status transition in `complaint_status_history`.

#### Database Changes
- Ensure `complaints.department_id`, `status`, `sla_start_time`, `sla_deadline` are updated atomically.

#### Backend/API Changes
- Add routing helper function `src/lib/services/routingService.ts`.

#### Frontend Changes
- Display assigned department and routing badge in complaint preview.

#### AI Changes
- Fine-tune prompt to include available department codes and category taxonomy.

#### Security Considerations
- Prevent unauthorized department reassignment outside admin/routing workflows.

#### Dependencies
- Phase 10.

#### Testing
- Test high-confidence submission (verify auto-routed to `RECEIVED`); test ambiguous description (verify routed to review queue).

#### Acceptance Criteria
- High confidence complaints route automatically to department; low confidence routed to review queue.

#### Definition of Done
- Routing engine operational, tested across multiple departments and confidence thresholds.

---

### Phase 12 — Citizen Complaint Details, Status Timeline & Tracking

#### Objective
Build the comprehensive Citizen Complaint Detail page at `/citizen/complaints/[id]` and public tracking page at `/track` displaying permanent ID, status badge, priority, photo, location map, AI summary, SLA status, and full chronological timeline.

#### PRD Requirements Covered
- PRD Section 12, 19, 33, 56, 64, 66: Complaint detail view, chronological timeline, public tracking by ID.

#### Current Implementation
- `src/app/citizen/complaints/[id]/page.tsx` exists with basic details and SLA bar.

#### Required Implementation
- Build public tracking page `/track` allowing citizens to search by `CR-YYYY-XXXXXX` and view high-level public status timeline without login.
- Enhance `/citizen/complaints/[id]/page.tsx` with:
  - Clean separation: "Citizen Provided Information" vs "AI Generated Information".
  - Chronological visual timeline displaying timestamped events: Submitted $\rightarrow$ AI Analyzed $\rightarrow$ Department Assigned $\rightarrow$ Officer Assigned $\rightarrow$ Work Started $\rightarrow$ Resolution Submitted $\rightarrow$ Verified.
  - SLA timer with colored state indicators (Green, Yellow, Orange, Red).
  - Download Official Complaint PDF button.
  - Action banner if resolution is awaiting verification.

#### Database Changes
- Query `complaint_status_history` ordered by `created_at ASC` for the timeline.

#### Backend/API Changes
- Add public tracking API endpoint `/api/complaints/track/[permanentId]`.

#### Frontend Changes
- Build `src/app/track/page.tsx` and enhance `src/app/citizen/complaints/[id]/page.tsx`.

#### AI Changes
- None.

#### Security Considerations
- Public tracking endpoint exposes only non-sensitive data (Status, Timeline, Department, Category). Citizen personal details remain protected.

#### Dependencies
- Phase 11.

#### Testing
- Track complaint by permanent ID via public search; view full complaint detail as logged-in citizen owner.

#### Acceptance Criteria
- Detail page renders full history and SLA state; public tracking page works by ID.

#### Definition of Done
- Complaint detail and tracking pages complete, tested, and visually distinct.

---

### Phase 13 — Official Complaint PDF Generation Service

#### Objective
Implement server-side PDF generation generating an official municipal complaint report containing permanent ID, photos, GPS coordinates, citizen description, AI summary, priority, SLA deadline, and barcode/QR placeholder, strictly distinguishing citizen inputs from AI outputs.

#### PRD Requirements Covered
- PRD Section 28, 74, 75: Official complaint PDF structure, citizen vs AI labeling, server-side generation.

#### Current Implementation
- `src/app/api/complaints/[id]/pdf/route.ts` generates basic PDF via jsPDF.

#### Required Implementation
- Upgrade PDF generation layout:
  - Official municipal header banner with Government of India / Civic Authority styling.
  - Section 1: Official Identifiers (Permanent ID, Submission Timestamp, Current Status).
  - Section 2: Citizen Provided Information (Photo thumbnail, Address, GPS Coords, Full Description).
  - Section 3: AI-Generated Analysis & Routing (Assigned Department, Category, Priority, Summary, Action Steps, SLA Deadline).
  - Section 4: Resolution & Verification Block (Pre-formatted for officer sign-off).
- Embed high-resolution image rendering into PDF stream.
- Provide direct download endpoint returning proper `Content-Disposition: attachment`.

#### Database Changes
- None.

#### Backend/API Changes
- Enhance `src/app/api/complaints/[id]/pdf/route.ts` with structured styling and image embedding.

#### Frontend Changes
- Add "Download Official PDF" button with loading spinner in Citizen and Officer detail pages.

#### AI Changes
- None.

#### Security Considerations
- PDF generation verifies user authorization (Citizen owner, Department Officer, or Admin) before streaming document.

#### Dependencies
- Phase 12.

#### Testing
- Download PDF for test complaint; verify layout, citizen vs AI labeling, photo embedding, and readability.

#### Acceptance Criteria
- Clean, official, printable PDF generated server-side with zero client crashes.

#### Definition of Done
- PDF route functional, tested, and downloadable across all devices.

---

### Phase 14 — AI Action Brief & Officer Workspace Preparation

#### Objective
Implement the AI Action Brief generator and structured officer workspace layout designed to answer: "I know exactly what needs to be done."

#### PRD Requirements Covered
- PRD Section 31, 32, 82: Officer 3-column workspace (Left: PDF/Photo/Location; Right: AI Action Brief/SLA/Status; Bottom: Timeline/Evidence/Resolution).

#### Current Implementation
- AI analysis contains summary and recommended actions in DB. Officer detail page does not exist.

#### Required Implementation
- Design the structured officer complaint workspace layout:
  - **Left Column**: Official Complaint PDF viewer, Original Citizen Photo (with zoom modal), Exact Location Map, Raw Citizen Description.
  - **Right Column**: AI Action Brief card (Issue overview, Category, Priority badge, Step-by-step recommended actions, Required evidence checklist, SLA Countdown timer, Current status selector).
  - **Bottom Section**: Chronological Timeline, Evidence locker, Resolution submission form.
- Add AI Action Brief component (`src/components/officer/AiActionBrief.tsx`).

#### Database Changes
- None.

#### Backend/API Changes
- API helper to fetch complete officer complaint context with department joins.

#### Frontend Changes
- Build reusable officer workspace layout components.

#### AI Changes
- Ensure AI recommended actions provide concise, numbered operational steps.

#### Security Considerations
- Officer can only access complaints matching their assigned department ID.

#### Dependencies
- Phase 13.

#### Testing
- Render officer workspace with mock and live complaint data; verify all 3 sections load correctly.

#### Acceptance Criteria
- Workspace displays all required info in structured, intuitive 3-section layout.

#### Definition of Done
- Officer workspace layout built and ready for status transitions and resolution submission.

---

### Phase 15 — Officer Authentication & Department Authorization

#### Objective
Ensure internal officer authentication at `/officer/login` strictly enforces department permissions, prevents access to unrelated departments, and redirects officers to their department queue.

#### PRD Requirements Covered
- PRD Section 8, 9, 10, 29, 67: Officer login, internal credentials, department isolation, server-side authorization.

#### Current Implementation
- `src/app/officer/login/page.tsx` exists and verifies role.

#### Required Implementation
- Connect officer profile with `officer_departments` table to determine active department context.
- Implement server-side check in `src/app/officer/layout.tsx` verifying officer's active department assignment.
- Show assigned department name and badge in officer navigation bar.
- Provide quick profile view showing officer credentials and department assignment.

#### Database Changes
- Ensure query joins `officer_departments` and `departments`.

#### Backend/API Changes
- Add helper `getOfficerDepartmentContext()` in `src/lib/auth.ts`.

#### Frontend Changes
- Update `src/app/officer/layout.tsx` with department badge, officer status, and secure logout.

#### AI Changes
- None.

#### Security Considerations
- Reject officers attempting to view complaints belonging to another department at database and API levels.

#### Dependencies
- Phase 6, Phase 14.

#### Testing
- Log in as Water Department officer; attempt to access Sanitation complaint (must be denied with 403 Forbidden).

#### Acceptance Criteria
- Officer dashboard and routes strictly restricted to assigned department.

#### Definition of Done
- Department authorization verified and enforced across all officer routes.

---

### Phase 16 — Officer Dashboard & Filtered Queue Management

#### Objective
Build the comprehensive Officer Dashboard at `/officer/dashboard` with real-time queue tabs (New/Received, Active/In Progress, Pending Verification, Closed, SLA Breached), priority filters, and SLA countdowns.

#### PRD Requirements Covered
- PRD Section 30, 32, 66, 82: Officer dashboard sections, complaint cards, tab counters, SLA timers.

#### Current Implementation
- `src/app/officer/dashboard/page.tsx` exists with basic tabs.

#### Required Implementation
- Upgrade dashboard tabs:
  - `New` (`RECEIVED` — unassigned/claimed)
  - `Assigned` (`ASSIGNED` — assigned to this officer)
  - `In Progress` (`IN_PROGRESS`, `REOPENED` — active work)
  - `Near SLA` (Complaints with $<25\%$ SLA remaining)
  - `SLA Breached` (Overdue complaints)
  - `Pending Verification` (`RESOLUTION_SUBMITTED`, `AI_VERIFICATION`, `CITIZEN_VERIFICATION`)
  - `Closed` (`CLOSED`)
- Add search and category filter.
- Add "Claim Complaint" quick-action button directly from the New queue.
- Display live tab badges with count of open items.

#### Database Changes
- Optimize query with composite indexes on `(department_id, status, sla_deadline)`.

#### Backend/API Changes
- Query filtered by officer's department and selected tab.

#### Frontend Changes
- Enhance `src/app/officer/dashboard/page.tsx` with responsive filters, tab badges, and alert cards.

#### AI Changes
- None.

#### Security Considerations
- Officer can only query complaints matching their department ID.

#### Dependencies
- Phase 15.

#### Testing
- Switch between queue tabs; verify complaint counts match database records and SLA ordering is correct.

#### Acceptance Criteria
- All 7 queue states accessible with accurate counts and real-time SLA badges.

#### Definition of Done
- Officer dashboard fully functional with responsive queue filtering and claim actions.

---

### Phase 17 — Officer Complaint Handling & Status Lifecycle State Machine

#### Objective
Build the complete Officer Complaint Detail page at `/officer/complaints/[id]` with status transition controls enforcing the strict lifecycle: `RECEIVED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `RESOLUTION_SUBMITTED`.

#### PRD Requirements Covered
- PRD Section 31, 33, 34, 35, 77: Status transitions, claim responsibility, start work, automatic audit trail logging.

#### Current Implementation
- No officer complaint detail page exists (`src/app/officer/complaints/[id]/page.tsx` is missing).

#### Required Implementation
- Create `src/app/officer/complaints/[id]/page.tsx`.
- Implement status transition action buttons:
  - If `RECEIVED` $\rightarrow$ Button: `[ Accept & Assign to Me ]` (Transitions to `ASSIGNED`, updates citizen).
  - If `ASSIGNED` $\rightarrow$ Button: `[ Start Work ]` (Transitions to `IN_PROGRESS`, updates citizen).
  - If `IN_PROGRESS` / `REOPENED` $\rightarrow$ Button: `[ Submit Resolution Evidence ]` (Routes to resolve modal/page).
- Automatically log every transition to `complaint_status_history` with officer profile ID and timestamp.
- Display real-time status update notifications for citizen dashboard.

#### Database Changes
- Ensure `assigned_officer_id` is updated on claim.

#### Backend/API Changes
- Create API route `/api/officer/complaints/[id]/status` (POST) validating allowed transitions.

#### Frontend Changes
- Build `src/app/officer/complaints/[id]/page.tsx` incorporating the 3-column workspace design.

#### AI Changes
- Display AI Action Brief with checklist in the right sidebar.

#### Security Considerations
- Validate that only assigned officer or department admin can trigger state transitions.

#### Dependencies
- Phase 16.

#### Testing
- Claim complaint as officer $\rightarrow$ status changes to `ASSIGNED`; click start work $\rightarrow$ status changes to `IN_PROGRESS`; verify citizen sees updated status.

#### Acceptance Criteria
- Status state machine transitions execute correctly and log to audit history.

#### Definition of Done
- Officer complaint handling page complete, tested, and linked to status API.

---

### Phase 18 — SLA Engine, Countdown System & Warning Thresholds

#### Objective
Implement the robust backend SLA calculation engine, live visual countdown component with color thresholds (Green: 0–50%, Yellow: 50–75%, Orange: 75–90%, Red: 90–100%, Flashing Red: Breached), and event trigger system.

#### PRD Requirements Covered
- PRD Section 18, 36, 37, 38, 71, 95: SLA calculation, countdown timers, reminder/warning thresholds, backend calculation.

#### Current Implementation
- Basic `getSlaStatus()` helper in `src/lib/types.ts`.

#### Required Implementation
- Create unified SLA service (`src/lib/services/slaService.ts`):
  - `calculateSlaDeadline(priority, categorySlaHours)`
  - `getDetailedSlaState(deadline, startTime)`
  - `checkSlaThresholds(complaintId)`
- Visual SLA Component:
  - 0–50% elapsed $\rightarrow$ GREEN (`normal`)
  - 50–75% elapsed $\rightarrow$ YELLOW (`reminder` — 50% reminder logged)
  - 75–90% elapsed $\rightarrow$ ORANGE (`warning` — 75% warning logged)
  - 90–100% elapsed $\rightarrow$ RED (`critical` — 90% critical warning logged)
  - $\ge 100\%$ elapsed $\rightarrow$ PULSING RED (`breached` — SLA BREACHED logged)
- Insert automatic records into `sla_events` table when thresholds cross.

#### Database Changes
- Ensure `sla_events` logs events (`reminder`, `warning`, `critical_warning`, `breach`).

#### Backend/API Changes
- Add SLA check endpoint `/api/cron/check-sla` or service method for polling/event triggers.

#### Frontend Changes
- Build reusable `<SlaCountdownTimer deadline={...} startTime={...} />` component with live ticking countdown (hh:mm:ss).

#### AI Changes
- None.

#### Security Considerations
- SLA deadlines cannot be modified by officers; only super_admin can configure category base SLA hours.

#### Dependencies
- Phase 17.

#### Testing
- Test SLA states with mock timestamps for 30%, 60%, 80%, 95%, and 110% elapsed time.

#### Acceptance Criteria
- Countdown renders correct color state and hours remaining; triggers breach state at 100%.

#### Definition of Done
- SLA engine and live countdown component operational and tested across all views.

---

### Phase 19 — SLA Breach Detection & Automated Escalation Hierarchy

#### Objective
Implement automated escalation workflow triggered when an SLA is breached, creating escalation records and escalating up the hierarchy: Assigned Officer $\rightarrow$ Department Supervisor $\rightarrow$ Department Admin $\rightarrow$ Central Authority.

#### PRD Requirements Covered
- PRD Section 36, 38, 39, 40, 57, 58, 62: SLA breach detection, escalation hierarchy, escalation records, admin visibility.

#### Current Implementation
- `escalations` table defined in schema. No automation or UI exists.

#### Required Implementation
- Implement escalation service `src/lib/services/escalationService.ts`:
  - When `sla_deadline < NOW()` and status is not `RESOLVED`/`CLOSED`:
    - Insert record in `escalations` table (Level 1: Dept Supervisor / Level 2: Dept Admin / Level 3: Central Authority).
    - Log delay duration and breach reason.
    - Insert notification for Department Admin and Central Authority.
- Build Admin Escalation Monitor page at `/admin/escalations`.
- Display escalation badges on overdue complaints in all dashboards.

#### Database Changes
- Ensure `escalations` table records `complaint_id`, `escalation_level`, `previous_assigned_to`, `escalated_to`, `reason`, `delay_duration`.

#### Backend/API Changes
- Add `/api/admin/escalations` (GET) and escalation trigger helper.

#### Frontend Changes
- Build `src/app/admin/escalations/page.tsx` showing all active escalations, overdue time, and department accountability breakdown.

#### AI Changes
- None.

#### Security Considerations
- Escalations viewable by Department Admins (for their department) and Central Authority (system-wide).

#### Dependencies
- Phase 18.

#### Testing
- Simulate an expired SLA on a test complaint; verify escalation record is created and appears in `/admin/escalations`.

#### Acceptance Criteria
- Overdue complaints automatically register SLA breach and appear in admin escalation list.

#### Definition of Done
- Escalation engine complete, tested, and visible in admin dashboards.

---

### Phase 20 — Resolution Evidence Collection (Before/After Photos & Action Notes)

#### Objective
Build the officer resolution submission page at `/officer/complaints/[id]/resolve` strictly requiring: Action Taken description, Before Photo, and After Photo before marking work as submitted.

#### PRD Requirements Covered
- PRD Section 41, 42, 60, 82: Officer cannot simply click "RESOLVED" without evidence; mandatory Before & After photos + action note.

#### Current Implementation
- No resolution submission page exists.

#### Required Implementation
- Create `src/app/officer/complaints/[id]/resolve/page.tsx`.
- Form requiring:
  1. **Action Taken Note**: Short operational description (e.g. "Excavated pipe joint, replaced gasket, tested water pressure").
  2. **Before Photo**: Upload showing site before or during work.
  3. **After Photo**: Upload showing completed fix with clear visual proof.
- Upload photos to Supabase Storage bucket `resolution-evidence`.
- Save submission to `resolution_submissions` table.
- Transition complaint status to `RESOLUTION_SUBMITTED`.

#### Database Changes
- Ensure `resolution-evidence` storage bucket exists with upload policies for authenticated officers.

#### Backend/API Changes
- Create API route `/api/officer/complaints/[id]/resolve` (POST) validating all 3 evidence inputs.

#### Frontend Changes
- Build `src/app/officer/complaints/[id]/resolve/page.tsx` with photo preview, drag-and-drop upload, and validation.

#### AI Changes
- Prepare photos and action note for downstream AI Resolution Report generator.

#### Security Considerations
- Only the assigned officer or department admin can submit resolution for a complaint.

#### Dependencies
- Phase 19.

#### Testing
- Attempt to resolve without photos (must be blocked); upload valid Before/After photos + note (must succeed).

#### Acceptance Criteria
- Resolution cannot be submitted without Action Taken note + Before Photo + After Photo.

#### Definition of Done
- Resolution submission form verified, files stored in Supabase, submission record created.

---

### Phase 21 — AI Resolution Report Generation & Officer Confirmation

#### Objective
Implement Gemini AI generation of a formal municipal Resolution Report based on officer action notes and photos, allowing the officer to review, edit, and confirm the report before final submission.

#### PRD Requirements Covered
- PRD Section 43, 44, 54, 71, 94: AI Resolution Report generation, officer review/edit requirement, report confirmation.

#### Current Implementation
- Not implemented.

#### Required Implementation
- Build API route `/api/complaints/[id]/generate-resolution-report` (POST):
  - Send original complaint description, officer action note, and photo references to Gemini.
  - Prompt Gemini to produce a professional, official resolution statement (e.g. "The reported water leakage near XYZ College was inspected. Damaged pipeline joint was replaced and water pressure verified at 3.5 bar. Work completed satisfactorily.").
- Officer UI displays generated report in an editable textarea:
  - Officer can accept AI text or edit details.
  - Button: `[ Confirm & Submit for AI Verification ]`.
- Save final report in `resolution_reports` table.

#### Database Changes
- Ensure `resolution_reports` table exists (`id`, `complaint_id`, `officer_id`, `report_text`, `ai_generated_text`, `is_edited`, `confirmed_at`).

#### Backend/API Changes
- Add `/api/complaints/[id]/generate-resolution-report` endpoint.

#### Frontend Changes
- Integrate AI report drafting card inside the resolution workflow.

#### AI Changes
- Prompt engineering for concise, professional government resolution reports.

#### Security Considerations
- Gemini keys remain server-side.

#### Dependencies
- Phase 20.

#### Testing
- Enter short action note $\rightarrow$ click Generate AI Report $\rightarrow$ verify professional summary generated $\rightarrow$ edit text $\rightarrow$ confirm submission.

#### Acceptance Criteria
- Officer can generate, review, edit, and confirm AI resolution report before proceeding.

#### Definition of Done
- AI resolution report generator operational and confirmed by officer.

---

### Phase 22 — AI Multimodal Resolution Verification Service

#### Objective
Implement the Gemini AI multimodal verification service comparing original complaint photo/description against officer before/after photos and action report, returning: `RESOLUTION_CONSISTENT`, `POTENTIALLY_UNRESOLVED`, or `HUMAN_REVIEW_REQUIRED`.

#### PRD Requirements Covered
- PRD Section 44, 45, 64, 71, 92, 94: Multimodal verification comparing original vs before vs after, confidence score, decision-support rule (never claim 100% verified).

#### Current Implementation
- Not implemented.

#### Required Implementation
- Create verification service `src/lib/services/aiVerificationService.ts` and API `/api/complaints/[id]/verify-resolution`:
  - Fetch: Original photo, Original description, Officer Before photo, Officer After photo, Resolution report.
  - Pass multimodal images and prompt to Gemini:
    - Compare visual landmarks and damage in original photo with after photo.
    - Evaluate whether visible problem (e.g., pothole filled, garbage cleared, leak repaired) appears genuinely addressed.
    - Return JSON: `{ verdict: "RESOLUTION_CONSISTENT" | "POTENTIALLY_UNRESOLVED" | "HUMAN_REVIEW_REQUIRED", confidence: number, explanation: string }`.
  - Save verdict to `ai_verifications` table.
- State Machine Transition:
  - If `RESOLUTION_CONSISTENT` $\rightarrow$ Set status `CITIZEN_VERIFICATION` (Awaiting Citizen Confirmation).
  - If `POTENTIALLY_UNRESOLVED` or `HUMAN_REVIEW_REQUIRED` $\rightarrow$ Set status `HUMAN_REVIEW_REQUIRED`, route to Department Admin queue.

#### Database Changes
- Insert record in `ai_verifications`.

#### Backend/API Changes
- Create `/api/complaints/[id]/verify-resolution` endpoint.

#### Frontend Changes
- Display AI verification badge and explanation in officer workspace and admin audit view.

#### AI Changes
- Strict multimodal verification prompt adhering to PRD rule: "Never claim 100% verified; state evidence appears consistent with resolution."

#### Security Considerations
- AI verdict is stored in backend; cannot be tampered with by client request.

#### Dependencies
- Phase 21.

#### Testing
- Test with matched before/after photos (verify `RESOLUTION_CONSISTENT`); test with mismatched or unchanged photo (verify `POTENTIALLY_UNRESOLVED`).

#### Acceptance Criteria
- Gemini correctly compares photos and transitions complaint to citizen verification or human review.

#### Definition of Done
- Multimodal resolution verification tested, schema validated, and integrated into workflow.

---

### Phase 23 — Citizen Resolution Verification Portal (Confirm / Dispute)

#### Objective
Build the Citizen Resolution Verification interface at `/citizen/complaints/[id]/verify` showing original issue, before/after photos, officer action, resolution report, and two clear buttons: `[ YES — ISSUE RESOLVED ]` and `[ NO — ISSUE STILL EXISTS ]`.

#### PRD Requirements Covered
- PRD Section 46, 47, 48, 55, 66, 67, 81: Citizen verification screen, side-by-side photo comparison, citizen closure with optional feedback.

#### Current Implementation
- Not implemented (`/citizen/complaints/[id]/verify` does not exist).

#### Required Implementation
- Create `src/app/citizen/complaints/[id]/verify/page.tsx`:
  - Side-by-side comparison: Original Photo vs Officer Before Photo vs Officer After Photo.
  - Officer Action Taken and AI Resolution Report text.
  - Resolution Date and Officer ID badge.
  - Button 1: `[ YES — ISSUE RESOLVED ]`:
    - Updates complaint status to `CLOSED`.
    - Opens optional 5-star rating and comment dialog.
    - Saves confirmation in `citizen_verifications` table.
  - Button 2: `[ NO — ISSUE STILL EXISTS ]`:
    - Opens dispute workflow requiring mandatory photo proof.

#### Database Changes
- Insert record into `citizen_verifications` (`is_satisfied = true`, `feedback_rating`, `feedback_comment`).

#### Backend/API Changes
- Create API `/api/citizen/complaints/[id]/confirm-resolution` (POST).

#### Frontend Changes
- Build `src/app/citizen/complaints/[id]/verify/page.tsx` with side-by-side image sliders and feedback modal.

#### AI Changes
- None.

#### Security Considerations
- Only the citizen who submitted the complaint (`auth.uid() = citizen_id`) can confirm or dispute.

#### Dependencies
- Phase 22.

#### Testing
- Click `[ YES — ISSUE RESOLVED ]` $\rightarrow$ verify status changes to `CLOSED`, feedback rating is saved, and dashboard updates.

#### Acceptance Criteria
- Citizen can inspect before/after proof and confirm resolution with optional rating.

#### Definition of Done
- Citizen confirmation flow complete, verified, and transitions ticket to `CLOSED`.

---

### Phase 24 — Citizen Dispute Workflow with Mandatory Current Photo

#### Objective
Implement the Citizen Dispute submission interface triggered when citizen clicks `[ NO — ISSUE STILL EXISTS ]`, strictly requiring a new current photo showing why the issue is unresolved.

#### PRD Requirements Covered
- PRD Section 48, 49, 88: Mandatory current photo for dispute, dispute reason description, submission prevention if photo missing.

#### Current Implementation
- Not implemented.

#### Required Implementation
- In `/citizen/complaints/[id]/verify`:
  - When citizen clicks `[ NO — ISSUE STILL EXISTS ]`, open Dispute Modal.
  - Form requiring:
    1. **Current Photo (MANDATORY)**: Camera capture or upload showing the unresolved condition.
    2. **Dispute Reason (Optional/Recommended)**: Citizen explains what is still broken.
  - Strict validation: If current photo is missing $\rightarrow$ prevent submission with message: *"Please upload a current photo showing why the issue is still unresolved."*
  - Upload photo to `complaint-images` bucket with `image_type = 'dispute'`.
  - Save dispute details to `citizen_verifications` (`is_satisfied = false`, `dispute_photo_url`, `dispute_reason`).
  - Transition status to `DISPUTED` $\rightarrow$ trigger AI Dispute Analysis.

#### Database Changes
- Insert into `complaint_images` with `image_type = 'dispute'` and record in `citizen_verifications`.

#### Backend/API Changes
- Create API route `/api/citizen/complaints/[id]/dispute` (POST).

#### Frontend Changes
- Build dispute modal with camera capture, photo preview, and validation messages.

#### AI Changes
- Prepare full 4-image context for downstream AI dispute evaluation.

#### Security Considerations
- Citizen cannot dispute closed or already reopened complaints. Enforce role and state checks.

#### Dependencies
- Phase 23.

#### Testing
- Attempt dispute without photo (must fail); upload new photo + dispute description (must succeed and transition to `DISPUTED`).

#### Acceptance Criteria
- Citizen dispute requires mandatory current photo proof; rejects empty submissions.

#### Definition of Done
- Dispute submission interface and API complete, tested, and linked to AI dispute analysis.

---

### Phase 25 — AI Dispute Analysis & Complaint Reopening (Same CR-ID Preservation)

#### Objective
Implement Gemini AI dispute analysis comparing complete historical context (Original Photo + Officer Before/After + Citizen Current Photo) and handle the 3 PRD dispute outcomes, crucially reopening the SAME complaint without creating duplicates.

#### PRD Requirements Covered
- PRD Section 19, 49, 50, 51, 52, 53, 86, 88, 89: 3 Dispute outcomes, reopen SAME `CR-YYYY-XXXXXX`, preserve history, no duplicate complaints.

#### Current Implementation
- Not implemented.

#### Required Implementation
- Implement `src/lib/services/disputeService.ts` and API `/api/complaints/[id]/analyze-dispute`:
  - Gemini evaluates:
    1. Original complaint photo & description
    2. Officer before & after photos & resolution report
    3. Citizen new dispute photo & dispute text
  - **Outcome 1: ISSUE APPEARS UNRESOLVED**:
    - Reopen the **SAME** complaint ID (`CR-YYYY-XXXXXX`).
    - Transition status: `REOPENED` $\rightarrow$ `IN_PROGRESS`.
    - Reset SLA with priority duration.
    - Notify Officer and Department Admin: *"Complaint CR-YYYY-XXXXXX has been reopened due to verified citizen dispute."*
  - **Outcome 2: ISSUE APPEARS RESOLVED**:
    - Do NOT reopen.
    - Show explanation to citizen: *"The submitted evidence appears consistent with the previously reported issue having been addressed."*
    - Retain option for citizen to request Supervisor Review.
  - **Outcome 3: HUMAN_REVIEW_REQUIRED (Low AI confidence)**:
    - Set status `HUMAN_REVIEW_REQUIRED`.
    - Route to Supervisor/Admin Review Queue.

#### Database Changes
- Status updated on existing complaint record; new status history entry logged. No duplicate complaint row created.

#### Backend/API Changes
- Create `/api/complaints/[id]/analyze-dispute` endpoint.

#### Frontend Changes
- Display dispute analysis verdict banner in Citizen, Officer, and Admin complaint views.

#### AI Changes
- Multimodal prompt comparing 4 image inputs and producing structured outcome decision.

#### Security Considerations
- Strictly verify that permanent ID is preserved and no duplicate records are generated.

#### Dependencies
- Phase 24.

#### Testing
- Test dispute with genuine unresolved photo $\rightarrow$ verify complaint reopens under same `CR-YYYY-XXXXXX` and status becomes `REOPENED`/`IN_PROGRESS`.

#### Acceptance Criteria
- Same complaint ID preserved on reopen; duplicate complaints never created.

#### Definition of Done
- AI dispute analysis and reopening workflow tested and verified for all 3 outcomes.

---

### Phase 26 — Human Review Queue for Low-Confidence AI & Escalated Disputes

#### Objective
Implement the Supervisor and Department Admin Human Review Queue at `/admin/complaints/review` allowing authorized human supervisors to inspect ambiguous AI classifications, low-confidence resolution verifications, and disputed resolutions to make final binding decisions: `[ Confirm Resolution ]` or `[ Reopen Complaint ]`.

#### PRD Requirements Covered
- PRD Section 24, 28, 45, 52, 53, 55, 57: Human review queue, supervisor override, dispute arbitration.

#### Current Implementation
- Not implemented.

#### Required Implementation
- Build `/admin/complaints/review` page.
- Queue displays complaints with status `HUMAN_REVIEW_REQUIRED` or `SUBMITTED` (routing review needed).
- Split-screen Review Workspace:
  - Left: Original photo, Citizen description, Location.
  - Center: Officer before/after photos, Resolution report, Citizen dispute photo & notes.
  - Right: AI confidence score, AI reasoning, Decision controls.
- Decision Actions:
  - Button 1: `[ Confirm Resolution & Close ]` $\rightarrow$ Sets status to `CLOSED`, logs supervisor rationale.
  - Button 2: `[ Reopen & Reassign ]` $\rightarrow$ Sets status to `REOPENED` $\rightarrow$ `IN_PROGRESS`, assigns to officer.
  - Button 3: `[ Manual Route ]` $\rightarrow$ Assigns department and sets status to `RECEIVED`.

#### Database Changes
- Log review decision to `audit_logs` and `complaint_status_history`.

#### Backend/API Changes
- Create API route `/api/admin/complaints/[id]/human-review` (POST).

#### Frontend Changes
- Build `src/app/admin/complaints/review/page.tsx` with side-by-side evidence inspection.

#### AI Changes
- None.

#### Security Considerations
- Only `dept_admin` (for their department) and `super_admin` can submit human review decisions.

#### Dependencies
- Phase 25.

#### Testing
- Submit review decision as admin; verify status transitions and audit log entries.

#### Acceptance Criteria
- Admins can review all flagged complaints and make final binding decisions.

#### Definition of Done
- Human review queue functional, responsive, and tested.

---

### Phase 27 — Admin Complaint Monitoring, Advanced Filtering & Audit Logs

#### Objective
Build the master Admin Complaint Monitoring center at `/admin/complaints` with search, multi-criteria filtering (Department, Status, Priority, SLA state, Escalated, Reopened), and full chronological audit logs.

#### PRD Requirements Covered
- PRD Section 27, 57, 58, 66, 77, 83: Admin complaint monitoring, search/filter capabilities, full audit logging.

#### Current Implementation
- Not implemented.

#### Required Implementation
- Build `src/app/admin/complaints/page.tsx`:
  - Search by Complaint ID (`CR-2026-XXXXXX`), address, citizen email, or keyword.
  - Filter chips: All, Pending Routing, In Progress, Near SLA, SLA Breached, Disputed, Reopened, Closed.
  - Filter dropdowns: Department, Priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), Date range.
  - Data table with sorting by SLA deadline, creation date, priority.
  - Quick Drawer/Modal to inspect complaint details and audit history without navigating away.

#### Database Changes
- Query with flexible multi-parameter filters and pagination.

#### Backend/API Changes
- Create `/api/admin/complaints` (GET) with pagination, search, and filtering query parameters.

#### Frontend Changes
- Build `src/app/admin/complaints/page.tsx` with government-grade data table, filter bar, and audit drawer.

#### AI Changes
- None.

#### Security Considerations
- Department admins see only their department complaints; Super admin sees all.

#### Dependencies
- Phase 26.

#### Testing
- Test multi-filter combinations (e.g. Water Management + Critical + SLA Breached); verify query results.

#### Acceptance Criteria
- Admin can search, filter, and inspect any complaint and its audit log.

#### Definition of Done
- Complaint monitoring table and filtering system operational and fast.

---

### Phase 28 — Admin Executive Dashboard & Real-Time KPI Metrics

#### Objective
Build the Central Authority and Department Admin executive overview at `/admin/dashboard` featuring high-level KPI cards, live SLA breach alerts, escalation counters, and real-time system throughput.

#### PRD Requirements Covered
- PRD Section 57, 58, 60, 80, 83: Admin dashboard KPIs, system health visibility, transparent accountability without payroll deductions.

#### Current Implementation
- No admin dashboard page exists.

#### Required Implementation
- Build `src/app/admin/dashboard/page.tsx`:
  - KPI Cards: Total Complaints, Resolved Rate (%), Active in Progress, SLA Breached Count, Total Escalations, Reopen Rate (%), Avg Resolution Time (hours).
  - SLA Urgency Banner: Highlight complaints breaching in $<2$ hours or already breached.
  - Recent Escalations Feed: Real-time list of newly escalated tickets.
  - Department Workload Distribution: Visual progress bars comparing open load across Water, Sanitation, Roads, Electrical, Drainage, Parks.
  - Quick action shortcuts: Assign Officers, Review Disputes, Export Reports.

#### Database Changes
- Optimized aggregation queries for real-time dashboard counts.

#### Backend/API Changes
- Create `/api/admin/metrics/overview` (GET).

#### Frontend Changes
- Build executive KPI cards and charts in `src/app/admin/dashboard/page.tsx`.

#### AI Changes
- None.

#### Security Considerations
- Scoped to user role (Dept Admin sees department aggregations; Super Admin sees system totals).

#### Dependencies
- Phase 27.

#### Testing
- Load admin dashboard with varied test data; verify KPI totals match underlying database records.

#### Acceptance Criteria
- Executive dashboard provides immediate visibility into system bottlenecks and SLA performance.

#### Definition of Done
- Admin executive dashboard complete, responsive, and connected to live metrics.

---

### Phase 29 — Department Performance Scoring Algorithm & Monthly Analytics

#### Objective
Implement the objective Department Performance Scoring algorithm and analytics dashboard at `/admin/analytics` tracking SLA compliance, resolution rate, reopen rate, escalation rate, and citizen ratings.

#### PRD Requirements Covered
- PRD Section 56, 59, 60, 61, 66: Department Performance Score (0–100), monthly analytics, comparison rankings, transparent accountability.

#### Current Implementation
- `department_scores` table defined in schema. No calculation algorithm or UI exists.

#### Required Implementation
- Implement Performance Scoring Formula:
  $$\text{Score} = 100 - (30 \times \text{Breach Rate}) - (25 \times \text{Reopen Rate}) - (20 \times \text{Escalation Rate}) + (15 \times \text{Resolution Rate}) + (10 \times \frac{\text{Avg Rating}}{5})$$
  (Bounded between 0 and 100).
- Build `/admin/analytics` page:
  - Department Leaderboard: Ranked list of departments (e.g. Water Management: 92/100, Sanitation: 87/100, Roads: 74/100, Electrical: 66/100).
  - Monthly Volume & SLA Trends: Visual comparison charts for complaints filed vs resolved vs breached over time.
  - Officer Performance Table: Individual officer metrics (Assigned, Resolved, SLA Compliance %, Avg Time).

#### Database Changes
- Save computed scores in `department_scores` table with timestamp.

#### Backend/API Changes
- Create `/api/admin/analytics/department-scores` (GET) and calculation service.

#### Frontend Changes
- Build `src/app/admin/analytics/page.tsx` with leaderboard cards, trend charts, and metric drill-downs.

#### AI Changes
- Optional Gemini summary: "Generate executive performance insight for municipal commissioner."

#### Security Considerations
- Read-only analytics accessible to authorized admins.

#### Dependencies
- Phase 28.

#### Testing
- Run scoring algorithm on mock department data; verify scores compute accurately according to formula.

#### Acceptance Criteria
- Department score leaderboard accurately calculates and ranks departments from 0 to 100.

#### Definition of Done
- Department performance scoring and monthly analytics dashboard operational.

---

### Phase 30 — Recurring Issue Detection & Complaint Clustering

#### Objective
Implement the Gemini AI and spatial clustering engine that detects recurring infrastructure problems by grouping complaints with similar location coordinates and category within a configurable time window.

#### PRD Requirements Covered
- PRD Section 58, 62, 93, 94: Recurring issue analysis, pattern detection (e.g., 20 streetlight complaints in same ward), admin insights.

#### Current Implementation
- Not implemented.

#### Required Implementation
- Implement clustering service `src/lib/services/recurringIssueService.ts`:
  - Query complaints grouped by `(department_id, category)` within a geographic radius (e.g., within 500m) over the past 30 days.
  - If count $\ge 3$, send cluster data to Gemini:
    - Prompt Gemini to analyze recurring pattern (e.g., "5 streetlight failures reported within 200m on MG Road in 10 days $\rightarrow$ Indicates potential underground cabling failure").
    - Return structured insight: `{ cluster_name: string, root_cause_hypothesis: string, severity: string, suggested_preventive_action: string }`.
- Build Recurring Problems tab in `/admin/analytics` or `/admin/dashboard`.

#### Database Changes
- Create `complaint_clusters` table if not present (`id`, `cluster_title`, `category`, `latitude`, `longitude`, `radius_meters`, `complaint_ids`, `ai_insight`, `created_at`).

#### Backend/API Changes
- Add `/api/admin/recurring-issues` (GET, POST).

#### Frontend Changes
- Build recurring issues card list with map pin clusters and AI preventive action advice.

#### AI Changes
- Gemini pattern detection prompt analyzing multiple civic reports.

#### Security Considerations
- Server-side execution only.

#### Dependencies
- Phase 29.

#### Testing
- Seed 4 streetlight complaints within 100m; run clustering; verify AI detects recurring infrastructure issue.

#### Acceptance Criteria
- System detects geographic and category clusters and generates actionable root-cause insights.

#### Definition of Done
- Recurring issue detection engine complete, tested, and visible in admin analytics.

---

### Phase 31 — Duplicate Complaint Detection System

#### Objective
Implement the Gemini duplicate complaint detection engine comparing incoming citizen complaints against open complaints in the same geographic radius to prevent duplicate tickets while clustering citizen reports.

#### PRD Requirements Covered
- PRD Section 4, 59, 63, 94: Duplicate detection using location + category + description + image similarity.

#### Current Implementation
- Not implemented.

#### Required Implementation
- Implement `src/lib/services/duplicateDetectionService.ts`:
  - When a complaint is submitted, query active open complaints within 200 meters in the same category.
  - If candidate found, pass both descriptions and photos to Gemini.
  - Gemini returns `{ is_duplicate: boolean, confidence: number, existing_complaint_id: string }`.
  - If duplicate confirmed:
    - Link citizen to existing complaint as an additional subscriber/affected citizen.
    - Notify citizen: *"A complaint for this issue is already active (CR-2026-XXXXXX) and being tracked. You will receive live updates."*
    - Avoid creating duplicate officer tickets.

#### Database Changes
- Optional `complaint_subscribers` table to link multiple citizens to one complaint ID.

#### Backend/API Changes
- Integrate duplicate check into submission pipeline.

#### Frontend Changes
- Display duplicate notification modal during submission if high-confidence duplicate is identified.

#### AI Changes
- Gemini image and text similarity prompt for duplicate comparison.

#### Security Considerations
- Do not expose private details of other citizens when notifying about duplicate cluster.

#### Dependencies
- Phase 30.

#### Testing
- Submit two identical water leak complaints at same location; verify duplicate is detected.

#### Acceptance Criteria
- Duplicate complaints flagged or clustered without creating redundant work orders.

#### Definition of Done
- Duplicate detection service integrated and tested.

---

### Phase 32 — In-App Notification System & Real-Time Alerts

#### Objective
Implement the in-app notification system delivering timestamped alerts to Citizens (status updates, verification requests), Officers (new assignments, SLA warnings), and Admins (SLA breaches, escalations).

#### PRD Requirements Covered
- PRD Section 61, 62, 65, 68, 95: Notification rules for Citizen, Officer, and Admin.

#### Current Implementation
- `notifications` table exists in `schema.sql`. No UI bell or drawer exists.

#### Required Implementation
- Build Notification Service `src/lib/services/notificationService.ts`:
  - `sendNotification(profileId, title, message, complaintId)`
- Create Header Notification Bell component (`src/components/notifications/NotificationBell.tsx`) in all layouts (Citizen, Officer, Admin):
  - Unread badge counter.
  - Dropdown list of recent notifications with timestamps and direct links.
  - "Mark as read" button.
- Trigger automatic notifications on:
  - Complaint received, assigned, work started, resolution submitted, verification required, reopened, closed, SLA reminder, SLA breach, escalation.

#### Database Changes
- None (schema ready).

#### Backend/API Changes
- Create `/api/notifications` (GET, PATCH).

#### Frontend Changes
- Add notification bell to citizen, officer, and admin navigation headers.

#### AI Changes
- None.

#### Security Considerations
- Users can only fetch and update their own notifications (`profile_id = auth.uid()`).

#### Dependencies
- Phase 31.

#### Testing
- Trigger a status transition; verify notification appears in user's bell dropdown with correct unread count.

#### Acceptance Criteria
- Real-time notifications delivered to citizen, officer, and admin on every major lifecycle event.

#### Definition of Done
- In-app notification system complete, tested, and integrated across all portals.

---

### Phase 33 — Security, RLS & Authorization Hardening Audit

#### Objective
Conduct a comprehensive security audit verifying Supabase RLS policies, server-side route guards, API authorization, file upload limits, and preventing any leak of `GEMINI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.

#### PRD Requirements Covered
- PRD Section 8, 10, 67, 69, 70, 72, 76, 77: Supabase Auth, RLS enforcement, server authorization, credential protection.

#### Current Implementation
- Initial RLS policies in `schema.sql`; middleware route protection.

#### Required Implementation
- Audit every Supabase table RLS policy:
  - Citizen cannot read other citizens' complaints.
  - Officer cannot read or update complaints outside assigned department.
  - Department Admin cannot access other departments unless authorized.
  - Only server-side code can use `service_role`.
- Audit storage buckets:
  - Restrict uploads to authenticated users with MIME type and size limits ($\le 10\text{MB}$).
- Verify all API routes assert `auth.getUser()` and role permissions before mutating data.
- Ensure zero secrets are present in client JavaScript bundles or environment variables prefixed with `NEXT_PUBLIC_`.

#### Database Changes
- Hardened RLS policies where needed.

#### Backend/API Changes
- Add strict role assertion middleware in API routes.

#### Frontend Changes
- None.

#### AI Changes
- None.

#### Security Considerations
- Zero-trust architecture between frontend and backend.

#### Dependencies
- Phase 32.

#### Testing
- Run penetration test script: citizen attempting officer API, officer attempting cross-department API, unauthenticated user attempting file upload.

#### Acceptance Criteria
- 100% of unauthorized API and database attempts rejected with 401/403.

#### Definition of Done
- Security audit passed; all RLS policies verified active and impermeable.

---

### Phase 34 — End-to-End Workflow Integration & Interactive Flow Testing

#### Objective
Perform full end-to-end integration testing of the complete primary workflow from Citizen submission $\rightarrow$ AI analysis $\rightarrow$ Smart routing $\rightarrow$ Officer claim $\rightarrow$ Work progress $\rightarrow$ Resolution submission $\rightarrow$ AI verification $\rightarrow$ Citizen dispute $\rightarrow$ Reopen SAME complaint $\rightarrow$ Closure $\rightarrow$ Admin score update.

#### PRD Requirements Covered
- PRD Section 86, 88, 89, 93, 96, 98: Primary SIH Demo Scenario, End-to-end accountability loop.

#### Current Implementation
- Disconnected individual features.

#### Required Implementation
- Connect all modular services into a seamless end-to-end pipeline:
  1. Citizen submits Water Leakage complaint with photo and GPS.
  2. Gemini multimodal analyzes image and routes to Water Management.
  3. Complaint ID `CR-2026-XXXXXX` and official PDF generated.
  4. Officer logs in, sees complaint in `New` queue, and claims responsibility.
  5. Officer starts work $\rightarrow$ SLA timer updates citizen.
  6. Officer uploads Before & After photos with action note $\rightarrow$ Gemini drafts report.
  7. Gemini verifies resolution consistency $\rightarrow$ citizen notified.
  8. Citizen tests dispute: uploads new photo $\rightarrow$ Gemini analyzes dispute $\rightarrow$ Reopens SAME `CR-2026-XXXXXX` ticket.
  9. Officer re-resolves $\rightarrow$ Citizen confirms $\rightarrow$ Ticket `CLOSED` $\rightarrow$ Department score updates.

#### Database Changes
- None.

#### Backend/API Changes
- End-to-end pipeline verification.

#### Frontend Changes
- Smooth transitions and toast notifications across all user journeys.

#### AI Changes
- Test all prompt flows in sequence.

#### Security Considerations
- Verify authorization maintained throughout the entire multi-role journey.

#### Dependencies
- Phase 33.

#### Testing
- Execute complete multi-browser session walking through all 4 roles.

#### Acceptance Criteria
- Complete end-to-end workflow executes without a single error, preserving complaint ID and timeline throughout.

#### Definition of Done
- Full loop operational, documented, and verified.

---

### Phase 35 — UI/UX Government-Grade Aesthetic Polish & Responsive Design

#### Objective
Polish the entire application UI to deliver a modern, trustworthy, clean, government-grade visual experience across Mobile, Tablet, and Desktop viewports, avoiding excessive gradients or gaming styles while maintaining high aesthetic quality.

#### PRD Requirements Covered
- PRD Section 78, 79, 80, 81, 82, 83: UI Design style, mobile-first citizen portal, desktop-first officer/admin dashboards, error handling, loading skeletons.

#### Current Implementation
- Initial dark UI theme with Tailwind CSS.

#### Required Implementation
- Refine color palette to curated government-grade design tokens (Sleek dark theme, clean typography with Inter/Outfit, crisp borders, high-contrast readable text).
- Add loading skeletons for complaint lists, dashboards, and detail views.
- Implement accessible empty states and error toast notifications.
- Ensure 100% responsiveness on mobile (citizen complaint submission & tracking) and desktop (officer workspace & admin multi-column tables).
- Add subtle micro-animations for status badge changes and SLA countdowns.

#### Database Changes
- None.

#### Backend/API Changes
- None.

#### Frontend Changes
- Polish `src/app/globals.css`, component layouts, typography, and responsive breakpoints.

#### AI Changes
- None.

#### Security Considerations
- Ensure error messages do not reveal stack traces to users.

#### Dependencies
- Phase 34.

#### Testing
- Inspect all views on Chrome DevTools mobile viewports (iPhone, Android) and desktop screens.

#### Acceptance Criteria
- UI looks professional, authoritative, modern, and perfectly responsive.

#### Definition of Done
- Visual and responsive polish complete across all citizen, officer, and admin views.

---

### Phase 36 — Realistic Demo Data Seeding & Hackathon Presentation Script

#### Objective
Build an automated demo seeding script and presentation accounts (Citizen, Officer, Dept Admin, Super Admin) populated with realistic civic complaints across all states (Water Leak, Pothole, Streetlight, Garbage, Drainage) with SLA breaches, escalations, and dispute examples.

#### PRD Requirements Covered
- PRD Section 84, 85, 86, 87, 88, 89, 98: Demo data seeding, demo accounts, judge demo scenario preparation.

#### Current Implementation
- No dedicated seeding script.

#### Required Implementation
- Create seeding script `src/lib/seedDemoData.ts` or SQL seed script:
  - Seed Demo Accounts:
    - Citizen: `citizen@demo.in` / `Password123!`
    - Officer: `officer.water@demo.in` / `Password123!` (Water Management)
    - Officer: `officer.roads@demo.in` / `Password123!` (Roads & Public Works)
    - Dept Admin: `admin.water@demo.in` / `Password123!`
    - Super Admin: `superadmin@demo.in` / `Password123!`
  - Seed realistic complaints in each stage:
    - 1 Newly Submitted & AI-analyzed complaint.
    - 2 In Progress complaints with active SLA countdowns.
    - 1 Overdue complaint with triggered SLA Breach & Escalation record.
    - 1 Resolution Submitted complaint awaiting AI & Citizen verification.
    - 1 Disputed complaint that reopened under SAME `CR-2026-XXXXXX`.
    - 3 Closed complaints with citizen feedback ratings.
  - Seed department scores for leaderboard (Water: 92, Sanitation: 87, Roads: 74, Electrical: 66).
- Create Demo Quick-Login helper for hackathon judges/evaluators.

#### Database Changes
- Insert realistic sample rows with realistic timestamps.

#### Backend/API Changes
- Add optional `/api/admin/seed-demo` endpoint (protected by super admin / development flag).

#### Frontend Changes
- Add demo credentials banner / quick filler buttons on login pages for presentation convenience.

#### AI Changes
- Ensure seeded complaints contain rich AI summaries and recommended action arrays.

#### Security Considerations
- Demo seeding endpoint disabled in production or restricted to super_admin.

#### Dependencies
- Phase 35.

#### Testing
- Run seed script; verify all demo accounts can log in and dashboards display realistic live queues.

#### Acceptance Criteria
- One-click demo readiness showing all SIH scenarios within 3 minutes of presentation.

#### Definition of Done
- Seed script complete, tested, and demo accounts ready.

---

### Phase 37 — Production Build Verification & Vercel Deployment Readiness

#### Objective
Validate production build (`next build`), verify TypeScript compilation, test environment variables on staging/production, and ensure Vercel deployment readiness.

#### PRD Requirements Covered
- PRD Section 6, 8, 97, 99, 100: SIH-ready, deployable web application.

#### Current Implementation
- Codebase builds locally; requires final production check.

#### Required Implementation
- Execute `npm run build` and resolve any TypeScript or ESLint warnings.
- Verify production server configuration on Vercel.
- Configure production Supabase redirect URLs and Storage CORS headers.
- Conduct final smoke test on deployed environment:
  - File complaint $\rightarrow$ verify AI analysis $\rightarrow$ verify officer queue $\rightarrow$ verify resolution $\rightarrow$ verify citizen verification $\rightarrow$ verify admin score.

#### Database Changes
- Verify production indexes and database backup policies.

#### Backend/API Changes
- Production error logging and rate limiting considerations.

#### Frontend Changes
- Verify metadata, SEO tags, favicon, and title tags ("Complaint2Resolution — AI-Powered Civic Accountability").

#### AI Changes
- Verify Gemini production quota and API response latency.

#### Security Considerations
- Final check ensuring all secrets remain protected in Vercel environment variables.

#### Dependencies
- Phase 36.

#### Testing
- Run full automated build and end-to-end smoke test on production deployment URL.

#### Acceptance Criteria
- `npm run build` succeeds with zero errors; deployed application passes full smoke test.

#### Definition of Done
- Project fully deployed, tested, verified, and ready for evaluation.

---
*Complaint2Resolution Master Implementation Plan — SIH 2026*

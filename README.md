# 🏛️ COMPLAINT2RESOLUTION

> **"Don't Just Register Complaints. Drive Them to Verified Resolution."**

**Smart India Hackathon 2026**

---

## 📌 Core Identity

**Complaint2Resolution** is an AI-powered civic accountability and verified-resolution platform, **NOT** a generic complaint CRUD system.

Its core identity is defined by:
```
        AI
        +
   AUTOMATION
        +
       SLA
        +
    EVIDENCE
        +
 ACCOUNTABILITY
        +
VERIFIED RESOLUTION
```

---

## 🔄 Complete Complaint Lifecycle

```
CITIZEN
  └─ Submits: Photo + Location + Description
        │          (ALL 3 are mandatory — no exceptions)
        ▼
GEMINI AI ANALYSIS & ROUTING
  └─ Analysis: Returns recommended Category, Subcategory, Department, Priority, Summary, Action, SLA, Confidence
  └─ Routing: Backend routes based on (AI Recommendation + Configured Department Rules + Category Config + Zone)
        │
        ▼
SYSTEM
  └─ Generates: Permanent Complaint ID (e.g. CR-2026-001247)
  └─ Generates: Official Complaint PDF (distinguishing Citizen-provided from AI-generated info)
  └─ Routes to: Correct Department Queue
        │
        ▼
DEPARTMENT QUEUE
  └─ Status: SUBMITTED → RECEIVED
  └─ Assignment: Admin assigns officer OR officer claims responsibility
  └─ Status: RECEIVED → ASSIGNED
        │
        ▼
OFFICER WORKS
  └─ Status: ASSIGNED → IN_PROGRESS (Officer sees AI Action Brief + SLA Countdown)
  └─ SLA Path: Countdown tracked on backend. Breach events triggered automatically.
        │
        ▼
OFFICER RESOLUTION SUBMISSION
  └─ Must provide: Action Taken + Before Photo + After Photo
  └─ Status: RESOLUTION_SUBMITTED
        │
        ▼
GEMINI RESOLUTION VERIFICATION
  └─ Analyzes: Original Photo + Description + Before Photo + After Photo + Officer Action & Report
  └─ Verdict: RESOLUTION_CONSISTENT / POTENTIALLY_UNRESOLVED / HUMAN_REVIEW_REQUIRED
        │
        ▼
CITIZEN VERIFICATION
  └─ Citizen sees: Original Complaint, Before/After Photos, Action Taken, Resolution Report, AI Verdict
  └─ Options:
       ├─ ✅ YES — Issue Resolved  →  CLOSED
       └─ ❌ NO  — Issue Still Exists (CURRENT PHOTO mandatory)
                      │
                      ▼
              GEMINI DISPUTE ANALYSIS
              Compares complete context: Original + Before + After + Citizen Current + Text Descriptions
                      │
              ├─ ISSUE APPEARS UNRESOLVED  → REOPEN SAME CR-2026-XXXXXX (Status: REOPENED → IN_PROGRESS)
              ├─ ISSUE APPEARS RESOLVED    → Do NOT reopen. Show evidence, explanation, optional Human Review
              └─ HUMAN_REVIEW_REQUIRED     → Supervisor decides: [Confirm Resolution / Reopen Complaint]
```

---

## 👥 Roles & Access

### 1. 🧑 Citizen
- **Access**: Public signup at `/signup`, login at `/login`.
- **Permissions**: Can only access their own complaints.
- **Portal**: `/citizen/dashboard`

### 2. 👮 Officer
- **Access**: Configured internally. Login at `/officer/login`.
- **Permissions**: Restricted to complaints assigned to their department. Cannot see unrelated departments.
- **Portal**: `/officer/dashboard`

### 3. 🏢 Department Admin
- **Access**: Created by Central Authority. Login at `/admin/login`.
- **Permissions**: Full visibility and management of their department's queue and officers.
- **Portal**: `/admin/dashboard`

### 4. 🏛️ Central Authority / Super Admin
- **Access**: Configured internally. Login at `/admin/login`.
- **Permissions**: System-wide access, performance scoring, all escalations, and settings.
- **Portal**: `/admin/dashboard`

> ⚠️ **NO public role selector.** Portals are isolated at separate routes. Authorization is enforced server-side using JWT claims in Supabase.

---

## 🤖 Gemini AI Strategy

Gemini is the primary AI provider, handled completely **server-side** to keep API keys secure. 

- **Models**: Use currently available/configured multimodal Gemini models optimized for latency, image understanding, structured JSON output, and reliability.
- **JSON Outputs**: All analysis, action briefs, and verifications return structured JSON.
- **No 100% Guarantees**: Gemini provides confidence values and flags for human review instead of claiming absolute certainty.

---

## 🧭 Rules-Based & AI Department Routing

Routing is **NOT Gemini-only**. It uses a decision-support architecture:
1. **High AI Confidence**: Auto-route to the department if it matches configured routing rules.
2. **Low AI Confidence / Conflict**: Route to **Human Review / Routing Review** queue.
3. The backend remains responsible for the final routing decision.

---

## ⏱️ SLA Automation & Escalation Workflow

SLA deadlines are managed as a real backend workflow, not just a visual frontend timer:
- Deadlines are calculated on the backend and saved in the database (`sla_start_time`, `sla_duration`, `sla_deadline`).
- **Demo Defaults**:
  - `CRITICAL` = 6 hours
  - `HIGH` = 24 hours
  - `MEDIUM` = 48 hours
  - `LOW` = 72 hours
- **SLA Alert States**:
  - 0–50% → Normal
  - 50% → Reminder
  - 75% → Warning
  - 90% → Critical Warning
  - 100% → **SLA BREACHED**
- **Escalation Chain**: Triggered when a breach is recorded. The escalation is visible to supervisors and admins:
  ```
  Officer → Supervisor → Department Admin → Central Authority
  ```

---

## 🛡️ Controlled Status Transitions

Status changes are restricted and validated on the backend. Every transition is logged to `complaint_status_history` for audit and timeline visualization.

### Allowed Main Transitions
```
SUBMITTED → RECEIVED → ASSIGNED → IN_PROGRESS → RESOLUTION_SUBMITTED → AI_VERIFICATION → RESOLVED → CITIZEN_VERIFICATION → CLOSED
```

### Allowed Dispute Transitions
```
CITIZEN_VERIFICATION → DISPUTED → AI_DISPUTE_VERIFICATION → REOPENED → IN_PROGRESS
```

---

## 🛠️ Verification & Dispute Outcomes

### AI Resolution Verification States
- `RESOLUTION_CONSISTENT`: Evidence is consistent. Proceed to Citizen Verification.
- `POTENTIALLY_UNRESOLVED`: Evidence suggests incomplete work. Route to Human Review.
- `HUMAN_REVIEW_REQUIRED`: AI is uncertain. Route to Human Review.

### Citizen Dispute Analysis Complete Context
If a citizen disputes a resolution, they **must** upload a current photo. Gemini dispute analysis receives:
1. Original complaint photo & description
2. Original location & context
3. Officer before/after photos & action description
4. Officer resolution report
5. Citizen current photo & dispute text

**Outcomes**:
- **Issue Appears Unresolved**: Reopen the **same** complaint (Status: `REOPENED` -> `IN_PROGRESS`). Keep the original ID and timeline.
- **Issue Appears Resolved**: Do NOT reopen. Show verification explanation to the citizen. Option for supervisor review is retained.
- **Human Review Required**: Flagged for supervisor to manually decide (`Confirm Resolution` or `Reopen`).

---

## 📈 Performance & Accountability

- **Accountability**: No automated salary deductions or payroll integration. The system provides transparency, performance metrics, and triggers for administrative reviews.
- **Admin Dashboard**: Aggregates SLA compliance, resolution rate, reopen rate, and response times to score departments.

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js (App Router) + React + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui + Lucide React + Framer Motion |
| **Database & Auth**| Supabase PostgreSQL + Auth (JWT role metadata) |
| **Storage** | Supabase Storage (private buckets for photos and PDFs) |
| **AI** | Google Gemini API (Server-side) |
| **PDF** | Server-side PDF generation |
| **Location** | Browser Geolocation API + Reverse Geocoding |

---

## 🗄️ Database Schema

The database contains the following simplified entities:
1. **`profiles`**: System users (citizen, officer, admin, super_admin).
2. **`departments`**: Department definitions (Water, Sanitation, etc.).
3. **`department_categories`**: Category/subcategory mapping rules.
4. **`officers`**: Link profiles to specific departments.
5. **`complaints`**: Core ticket details, permanent ID, current status.
6. **`complaint_images`**: Images linked to complaints with metadata (type: original, resolution_before, resolution_after, citizen_dispute).
7. **`complaint_ai_analysis`**: Saved Gemini analysis results.
8. **`complaint_status_history`**: Audit trail of transitions.
9. **`complaint_assignments`**: Assignment logs.
10. **`sla_rules`**: SLA thresholds per department/priority.
11. **`sla_events`**: Recorded reminder, warning, and breach events.
12. **`escalations`**: Tracks active escalation levels.
13. **`resolution_submissions`**: Submissions including action taken details.
14. **`resolution_reports`**: AI-generated resolution summaries.
15. **`ai_verifications`**: Output of Gemini resolution checking.
16. **`citizen_verifications`**: Logs citizen approvals or disputes.
17. **`notifications`**: In-app user notifications.
18. **`department_scores`**: Calculated metrics for scoring.
19. **`audit_logs`**: System logs.

---

## 🎯 Implementation Priorities (SIH 3-Day Plan)

### P0 (Core Workflow - MUST WORK)
1. **Citizen Flow**: Login/signup -> Complaint submission (Photo + Geolocation + Text) -> Complaint creation with permanent ID -> PDF generation.
2. **AI Analysis & Routing**: Gemini classification -> Rule-based Routing -> Initial Queue.
3. **Officer Flow**: Dashboard queue -> AI Action Brief & SLA Countdown -> Resolution evidence upload (Action + Before/After photos) -> Resolution report.
4. **AI & Citizen Verification**: Gemini verification -> Citizen confirmation -> YES (Closed) / NO (Disputed + Mandatory photo).
5. **Dispute Resolution**: Gemini dispute check -> Reopen **SAME** complaint ID -> Update status history.
6. **Escalation & Admin**: SLA Breach detection -> Escalation creation -> Admin Dashboard update & Department scoring.

### P1 (Secondary - Build only if P0 is solid)
- In-app notification alerts
- Basic duplicate detection
- Interactive map views
- UI polish & animations

---

*Updated August 2026 as project Source of Truth.*

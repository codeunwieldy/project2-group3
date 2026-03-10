# Bellini College Class Scheduling System

A web application for managing, auditing, and reporting on Bellini College class schedules. Built with Next.js 16, Supabase (PostgreSQL), and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Database:** Supabase (PostgreSQL) with Row Level Security
- **UI:** Tailwind CSS + Radix UI primitives
- **Auth:** Supabase Auth (email + password)
- **Charts:** Recharts (room heatmap)
- **Diagrams:** Mermaid.js (live-rendered UML)
- **Export:** jsPDF + jspdf-autotable (PDF), ExcelJS (XLSX)

## Prerequisites

- Node.js 18+
- npm
- A Supabase project with migrations applied (see Database Setup)

## Getting Started

### 1. Install dependencies

```bash
cd bellini-scheduling
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Database setup

Run the SQL migrations in your Supabase SQL Editor in order:

1. `supabase/migrations/001_initial_schema.sql` -- Tables, types, triggers, indexes
2. `supabase/migrations/002_rls_policies.sql` -- Row Level Security policies
3. `supabase/migrations/003_seed_reference.sql` -- Seed data (semesters, campuses)
4. `supabase/migrations/004_audit_functions.sql` -- Audit functions, views

### 4. Import data from Excel

The Excel files (`Bellini Classes S25.xlsx` and `Bellini Classes F25.xlsx`) must be in the parent directory of `bellini-scheduling/`.

```bash
npm run import:s25    # Import Spring 2025 (118 rows)
npm run import:f25    # Import Fall 2025 (153 rows)
```

These scripts are idempotent (safe to re-run). They upsert all records using the Supabase service role key.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Build for production

```bash
npm run build
npm run start
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run import:s25` | Import Spring 2025 Excel data |
| `npm run import:f25` | Import Fall 2025 Excel data |

## Project Structure

```
bellini-scheduling/
├── src/
│   ├── app/
│   │   ├── (auth)/login/       # Login page (email + password)
│   │   ├── (auth)/callback/    # Auth callback handler
│   │   ├── (app)/              # Authenticated app pages
│   │   │   ├── dashboard/      # Role-aware dashboard
│   │   │   ├── sections/       # Section CRUD (list, create, edit, detail)
│   │   │   ├── audit/          # Audit reports (duplicates, overlaps)
│   │   │   ├── ta-management/  # TA ratio table + assignment
│   │   │   ├── enrollment/     # Semester-over-semester comparison
│   │   │   ├── rooms/          # Room list + heatmap
│   │   │   ├── instructor/     # Instructor weekly schedule
│   │   │   ├── course-search/  # Cross-semester course search
│   │   │   ├── my-assignments/ # TA self-service portal
│   │   │   ├── workload/       # Instructor workload + export
│   │   │   ├── waitlist-alerts/# Waitlist imbalance alerts
│   │   │   └── uml/           # Live UML diagrams (4 tabs)
│   │   └── api/                # REST API routes
│   ├── components/             # React components by feature
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Supabase clients, queries, export helpers
│   └── types/                  # TypeScript type definitions
├── scripts/                    # Data import scripts (ts-node)
├── supabase/
│   ├── migrations/             # SQL migration files
│   └── functions/              # Edge Functions (Deno)
└── package.json
```

## System Overview

### How It Works

1. **Data Source:** Class schedule data is imported from Excel spreadsheets (Spring 2025 and Fall 2025) into a PostgreSQL database hosted on Supabase.

2. **Authentication:** Users sign in with email and password. Each user has a role that determines which pages and features they can access. The middleware redirects unauthenticated users to the login page.

3. **Role-Based Access:** The sidebar dynamically shows only the navigation items allowed for the signed-in user's role. API routes and database queries are further protected by Row Level Security policies.

4. **Features by User Story:**
   - **Sections CRUD** -- Browse, create, edit, and delete class sections filtered by semester
   - **Audit Reports** -- Detect duplicate CRNs, room scheduling overlaps, and instructor time conflicts
   - **TA Management** -- View TA-to-student ratios, flag under-served sections, assign TAs
   - **Enrollment Comparison** -- Side-by-side Spring vs Fall enrollment with percentage change
   - **Room Heatmap** -- Visual weekly grid showing room occupancy by 30-minute time slots
   - **Instructor Schedule** -- Weekly calendar view of an instructor's sections across semesters
   - **Course Search** -- Search by subject and course number to see a course across all semesters
   - **TA Self-Service** -- TAs can view their own assignments and hours
   - **Workload Report** -- Instructor workload summary with PDF and Excel export
   - **Waitlist Alerts** -- Flag courses with high waitlist-to-enrollment ratios
   - **UML Diagrams** -- Four live-rendered Mermaid.js diagrams (ER, Use Case, Component, Class)

5. **Data Export:** The workload report can be exported as PDF or Excel from the browser. Export is handled server-side via API routes using jsPDF and ExcelJS.

## Demo Accounts

| Email | Password | Role | Features Accessible |
|---|---|---|---|
| `jscello22@gmail.com` | *(your password)* | Admin | All features |
| `chair@bellini.edu` | `Bellini2025!` | Committee Chair | Sections, Audit Reports, Workload Report, Waitlist Alerts, UML Diagrams |
| `tacoord@bellini.edu` | `Bellini2025!` | TA Coordinator | Sections, TA Management, My Assignments, Waitlist Alerts |
| `advisor@bellini.edu` | `Bellini2025!` | Dept Advisor | Enrollment Trends, Course Search |
| `facilities@bellini.edu` | `Bellini2025!` | Facilities | Room Heatmap |
| `suey-chyun.fang@bellini-unknown.edu` | `Bellini2025!` | Instructor | My Schedule (linked to real instructor data) |
| `moyosoreoluwa.ayoade@bellini-ta-placeholder.edu` | `Bellini2025!` | TA / UGTA | My Assignments (linked to real TA assignment data) |
| `studentadvisor@bellini.edu` | `Bellini2025!` | Student Advisor | Course Search |

### What Each Role Demonstrates

- **Admin** -- Full access. Use this to explore all features and manage data.
- **Committee Chair** -- Can view sections, run audit reports for scheduling conflicts, check instructor workload, review waitlist alerts, and view UML system diagrams.
- **TA Coordinator** -- Can manage TA assignments, view TA-to-student ratios, and see which sections need TA coverage.
- **Department Advisor** -- Can compare enrollment trends between semesters and search for courses across terms.
- **Facilities** -- Can view the room heatmap to identify scheduling density and room utilization.
- **Instructor** -- Sees a personalized weekly schedule showing all their assigned sections. The demo account is linked to Suey-Chyun Fang who has sections in both S25 and F25.
- **TA / UGTA** -- Sees their own TA assignments, hours, and section details. The demo account is linked to Moyosoreoluwa Ayoade.
- **Student Advisor** -- Can search for course offerings across semesters to help students plan schedules.

## Database Schema

### Core Tables

| Table | Description |
|---|---|
| `semesters` | Academic terms (S25, F25) |
| `campuses` | Campus locations |
| `subjects` | Academic subjects (COP, CIS, etc.) |
| `rooms` | Classrooms with capacity |
| `instructors` | Faculty members |
| `courses` | Course catalog entries |
| `sections` | Individual class sections (the main data table) |
| `tas` | Teaching assistants |
| `ta_assignments` | TA-to-section assignments with hours |
| `users` | App users with roles linked to Supabase Auth |
| `audit_log` | Automatic change history for sections |
| `notifications` | Email notification queue |

### Database Views

| View | Purpose |
|---|---|
| `section_ta_ratios` | TA hours per enrolled student, flags under-threshold sections |
| `enrollment_comparison` | Side-by-side S25 vs F25 enrollment with % change |
| `instructor_workload` | Per-instructor section count, enrollment, and TA hours |
| `waitlist_alerts` | Courses with waitlist exceeding 20% of enrollment |

### Audit Functions

| Function | Purpose |
|---|---|
| `get_duplicate_crns(semester_id)` | Find duplicate CRN entries |
| `get_room_overlaps(semester_id)` | Find room double-bookings |
| `get_instructor_overlaps(semester_id)` | Find instructor time conflicts |

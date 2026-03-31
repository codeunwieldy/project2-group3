'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const MermaidDiagram = dynamic(() => import('@/components/uml/MermaidDiagram'), { ssr: false })

// ─── ER Diagram ──────────────────────────────────────────────────────────────
const ER_DIAGRAM = `
erDiagram
  semesters {
    int id PK
    string code UK
    string term_label
    date start_date
    date end_date
    bool is_active
  }
  campuses {
    int id PK
    string code UK
    string name
  }
  subjects {
    int id PK
    string code UK
    string name
  }
  rooms {
    int id PK
    string room_code UK
    string building
    string room_number
    int capacity
    bool is_online
  }
  instructors {
    int id PK
    string email UK
    string full_name
  }
  users {
    uuid id PK
    string email UK
    string role
    int instructor_id FK
  }
  courses {
    int id PK
    int subject_id FK
    string course_number
    string title
    string course_level
  }
  sections {
    int id PK
    int semester_id FK
    int campus_id FK
    int course_id FK
    string crn
    string section_code
    time meeting_time_start
    time meeting_time_end
    string meeting_days
    int room_id FK
    int enrollment
    int wait_list_actual
    int wait_list_max
    int instructor_id FK
  }
  tas {
    int id PK
    string email UK
    string full_name
    string ta_type
  }
  ta_assignments {
    int id PK
    int section_id FK
    int ta_id FK
    float hours
    string assigned_by
  }
  audit_log {
    bigint id PK
    string table_name
    int record_id
    string action
    jsonb old_data
    jsonb new_data
    string changed_by
  }
  notifications {
    bigint id PK
    string recipient_email
    string subject
    string body
    string status
    int ta_assignment_id FK
  }
  semesters ||--o{ sections : "has"
  campuses ||--o{ sections : "hosts"
  courses ||--o{ sections : "offered as"
  rooms ||--o{ sections : "used by"
  instructors ||--o{ sections : "teaches"
  subjects ||--o{ courses : "groups"
  instructors ||--o| users : "linked to"
  sections ||--o{ ta_assignments : "assigned"
  tas ||--o{ ta_assignments : "assigned to"
  ta_assignments ||--o| notifications : "triggers"
  sections ||--o{ audit_log : "logged"
`

// ─── Use Case Diagram ────────────────────────────────────────────────────────
// Blue nodes (UC1-UC4) = documented use cases
// Gray nodes (UC5-UC10) = undocumented use cases
// Yellow nodes = actors
const USE_CASE_DIAGRAM = `
flowchart LR
  Admin["👤 Admin"]
  Chair["👤 Chair"]
  TACoord["👤 TA Coordinator"]
  DeptAdv["👤 Dept Advisor"]
  Facil["👤 Facilities"]
  Instr["👤 Instructor"]
  TAUGTA["👤 TA / UGTA"]
  StudAdv["👤 Student Advisor"]

  subgraph SYS["Bellini Class Scheduling System"]
    UC1(["UC1: Manage Course Sections"])
    UC2(["UC2: Assign TA to Section"])
    UC3(["UC3: Compare Enrollment Trends"])
    UC4(["UC4: Generate Workload Report"])
    UC5(["UC5: View Audit Reports"])
    UC6(["UC6: View Room Heatmap"])
    UC7(["UC7: View Instructor Calendar"])
    UC8(["UC8: Search Course Timeline"])
    UC9(["UC9: Manage Waitlist Alerts"])
    UC10(["UC10: View My TA Assignments"])
  end

  Admin --- UC1
  Admin --- UC2
  Admin --- UC3
  Admin --- UC4
  Admin --- UC5
  Admin --- UC6
  Admin --- UC7
  Admin --- UC8
  Admin --- UC9
  Admin --- UC10
  Chair --- UC1
  Chair --- UC4
  Chair --- UC5
  Chair --- UC9
  TACoord --- UC1
  TACoord --- UC2
  TACoord --- UC10
  DeptAdv --- UC3
  DeptAdv --- UC8
  Facil --- UC1
  Facil --- UC6
  Instr --- UC7
  TAUGTA --- UC10
  StudAdv --- UC8

  classDef documented fill:#2563eb,stroke:#1e40af,color:#ffffff
  classDef undocumented fill:#e2e8f0,stroke:#94a3b8,color:#475569
  classDef actorStyle fill:#fefce8,stroke:#ca8a04,color:#713f12

  class UC1,UC2,UC3,UC4 documented
  class UC5,UC6,UC7,UC8,UC9,UC10 undocumented
  class Admin,Chair,TACoord,DeptAdv,Facil,Instr,TAUGTA,StudAdv actorStyle
`

// ─── Activity Diagram 1: UC1 – Manage Course Sections ────────────────────────
const ACT_MANAGE_SECTIONS = `
flowchart TD
  S(["Start"])
  E(["End"])

  N1["User navigates to Sections page"]
  N2["System: Display section list with filter controls"]
  N3["User selects semester and applies optional filters"]
  N4["System: Refresh filtered section list"]
  D1{"Choose action"}

  A1["System: Open blank Add Section form"]
  A2["User enters CRN, course, instructor, room, meeting days and times"]
  A3["User submits form"]
  VAL{"Inputs valid?"}
  VALERR["System: Highlight validation errors"]
  SAVE["System: Save section record to database"]
  ALOG["System: Write CREATE entry to audit_log"]
  ADONE["System: Display success notification"]

  B1["System: Open pre-filled Edit Section form"]
  B2["User modifies desired section fields"]

  C1["System: Show delete confirmation dialog"]
  CCONF{"User confirms delete?"}
  CDEL["System: Delete section from database"]
  CLOG["System: Write DELETE entry to audit_log"]
  CDONE["System: Display success notification"]

  S --> N1 --> N2 --> N3 --> N4 --> D1
  D1 -->|Add Section| A1 --> A2 --> A3 --> VAL
  D1 -->|Edit Section| B1 --> B2 --> A3
  D1 -->|Delete Section| C1 --> CCONF
  VAL -->|Valid| SAVE --> ALOG --> ADONE --> E
  VAL -->|Invalid| VALERR --> A2
  CCONF -->|No| N4
  CCONF -->|Yes| CDEL --> CLOG --> CDONE --> E
`

// ─── Activity Diagram 2: UC2 – Assign TA to Section ──────────────────────────
const ACT_ASSIGN_TA = `
flowchart TD
  S(["Start"])
  E(["End"])

  N1["TA Coordinator navigates to TA Management"]
  N2["System: Display sections with TA assignments and ratio indicators"]
  N3["Coordinator locates target section using filters"]
  N4["Coordinator clicks Assign TA on selected section"]
  N5["System: Display TA assignment form with available TAs"]
  N6["Coordinator selects TA and enters weekly hours"]
  N7["Coordinator submits assignment"]
  DUP{"TA already assigned to this section?"}
  DUPERR["System: Show duplicate assignment error"]
  RATIO{"Hours within acceptable ratio threshold?"}
  WARN["System: Display over-threshold warning"]
  WCONF{"Coordinator confirms despite warning?"}
  SAVE["System: Save ta_assignments record to database"]
  NOTIF["System: Queue email notification for TA via notifications table"]
  REFRESH["System: Refresh TA ratio table with updated data"]

  S --> N1 --> N2 --> N3 --> N4 --> N5 --> N6 --> N7 --> DUP
  DUP -->|Yes| DUPERR --> N6
  DUP -->|No| RATIO
  RATIO -->|Within threshold| SAVE
  RATIO -->|Exceeds threshold| WARN --> WCONF
  WCONF -->|No| N6
  WCONF -->|Yes| SAVE
  SAVE --> NOTIF --> REFRESH --> E
`

// ─── Activity Diagram 3: UC3 – Compare Enrollment Trends ─────────────────────
const ACT_ENROLLMENT = `
flowchart TD
  S(["Start"])
  E(["End"])

  N1["User navigates to Enrollment Comparison page"]
  N2["System: Query enrollment_comparison view for S25 and F25"]
  N3["System: Display table with Course, S25, F25, and Percent Change columns"]
  FILT{"Apply subject or campus filter?"}
  F1["User selects filter option"]
  F2["System: Refresh table with filtered data"]
  SORT{"Sort table by column?"}
  S1["User clicks column header to sort"]
  S2["System: Re-order rows by selected column"]
  N8["User reviews data and highlighted enrollment changes"]

  S --> N1 --> N2 --> N3 --> FILT
  FILT -->|Yes| F1 --> F2 --> SORT
  FILT -->|No| SORT
  SORT -->|Yes| S1 --> S2 --> N8
  SORT -->|No| N8
  N8 --> E
`

// ─── Activity Diagram 4: UC4 – Generate and Export Workload Report ────────────
const ACT_WORKLOAD = `
flowchart TD
  S(["Start"])
  E(["End"])

  N1["Chair or Admin navigates to Workload page"]
  N2["System: Query instructor_workload view"]
  N3["System: Display workload table with Instructor, Section Count, Enrollment, TA Hours"]
  N4["User selects semester from dropdown"]
  N5["System: Refresh workload data for selected semester"]
  EXP{"Export report?"}
  VIEW["User reviews workload data on screen"]
  FMT{"Choose export format"}
  PDF1["System: Call /api/export/workload?format=pdf"]
  PDF2["Server: Generate PDF via jsPDF and stream download"]
  XLS1["System: Call /api/export/workload?format=excel"]
  XLS2["Server: Generate XLSX via ExcelJS and stream download"]
  DL["Browser downloads file to device"]

  S --> N1 --> N2 --> N3 --> N4 --> N5 --> EXP
  EXP -->|No| VIEW --> E
  EXP -->|Yes| FMT
  FMT -->|PDF| PDF1 --> PDF2 --> DL --> E
  FMT -->|Excel| XLS1 --> XLS2 --> DL
`

// ─── Component Architecture (unchanged) ──────────────────────────────────────
const COMPONENT_DIAGRAM = `
flowchart TB
  subgraph Client["Browser (React)"]
    UI[React Components]
    Hooks[Custom Hooks]
    Mermaid[MermaidDiagram]
    Recharts[RoomHeatmap]
  end
  subgraph NextJS["Next.js 14 App Router"]
    Pages[Server Components / Pages]
    API[API Routes]
    MW[Middleware / AuthGuard]
    Export[Export Routes]
  end
  subgraph Supabase["Supabase Platform"]
    Auth[Supabase Auth]
    DB[(PostgreSQL DB)]
    RLS[Row Level Security]
    Realtime[Realtime Engine]
    EdgeFn[Edge Function]
  end
  subgraph External
    Resend[Resend Email API]
    Vercel[Vercel CDN / Serverless]
  end
  Client -->|API calls| NextJS
  NextJS -->|SSR fetch| Supabase
  MW -->|session refresh| Auth
  API -->|queries| DB
  RLS -->|enforces| DB
  Realtime -->|push| Hooks
  EdgeFn -->|drain queue| DB
  EdgeFn -->|send| Resend
  NextJS -->|deployed on| Vercel
`

// ─── Class Diagram (unchanged) ────────────────────────────────────────────────
const CLASS_DIAGRAM = `
classDiagram
  class Semester {
    +int id
    +string code
    +string term_label
    +date startDate
    +date endDate
    +bool isActive
  }
  class Course {
    +int id
    +string subjectCode
    +string courseNumber
    +string title
    +string level
  }
  class Section {
    +int id
    +int crn
    +string sectionCode
    +string meetingDays
    +Time meetingStart
    +Time meetingEnd
    +int enrollment
    +int waitListActual
    +int waitListMax
    +getTARatio() float
    +hasOverlap(Section) bool
  }
  class Instructor {
    +int id
    +string email
    +string fullName
    +getSections() Section[]
    +getWorkload() WorkloadRow
  }
  class Room {
    +int id
    +string roomCode
    +string building
    +int capacity
    +isOnline bool
    +getOccupancy() HeatmapData
  }
  class TA {
    +int id
    +string email
    +string fullName
    +string taType
    +getAssignments() TAAssignment[]
  }
  class TAAssignment {
    +int id
    +int sectionId
    +int taId
    +float hours
    +string assignedBy
    +DateTime assignedAt
  }
  class User {
    +uuid id
    +string email
    +UserRole role
    +int instructorId
    +canWrite() bool
  }

  Semester "1" --> "0..*" Section : contains
  Course "1" --> "0..*" Section : offered as
  Instructor "1" --> "0..*" Section : teaches
  Room "1" --> "0..*" Section : hosts
  Section "1" --> "0..*" TAAssignment : has
  TA "1" --> "0..*" TAAssignment : assigned in
  User "0..1" --> "0..1" Instructor : linked to
`

// ─── Use Case Documentation (JSX) ────────────────────────────────────────────

interface UCFlow { step: number; actor: string; action: string }
interface AltFlow { id: string; name: string; description: string }
interface UCDoc {
  id: string; name: string; author: string; date: string; description: string
  actors: { primary: string[]; secondary: string[] }
  preconditions: string[]
  postconditionsSuccess: string[]
  postconditionsFailure: string[]
  basicFlow: UCFlow[]
  alternativeFlows: AltFlow[]
  exceptions: AltFlow[]
  businessRules: string[]
}

const UC_DOCS: UCDoc[] = [
  {
    id: 'UC-01',
    name: 'Manage Course Sections',
    author: 'Alex, Dana',
    date: 'March 2026',
    description:
      'Allows authorized users to browse, create, modify, and remove course section records for a selected academic semester within the Bellini scheduling system.',
    actors: {
      primary: ['Admin', 'Chair', 'TA Coordinator', 'Facilities'],
      secondary: [],
    },
    preconditions: [
      'User is authenticated with a role that permits access to the Sections page.',
      'At least one semester record exists in the system.',
    ],
    postconditionsSuccess: [
      'The section record is created, updated, or deleted in the database.',
      'The change is persisted as a new entry in the audit_log table.',
      'A success notification is displayed to the user.',
    ],
    postconditionsFailure: [
      'No database record is altered; validation error messages are shown to the user.',
    ],
    basicFlow: [
      { step: 1, actor: 'User', action: 'Navigates to the Sections page.' },
      { step: 2, actor: 'System', action: 'Displays the section list with filter controls (semester, subject, campus).' },
      { step: 3, actor: 'User', action: 'Selects a semester from the dropdown and optionally applies subject and campus filters.' },
      { step: 4, actor: 'System', action: 'Refreshes and displays the filtered section list.' },
      { step: 5, actor: 'User', action: 'Clicks "Add Section".' },
      { step: 6, actor: 'System', action: 'Displays a blank Add Section form.' },
      { step: 7, actor: 'User', action: 'Enters all required section details: CRN, course, instructor, room, meeting days, start time, end time, enrollment count, and waitlist counts.' },
      { step: 8, actor: 'User', action: 'Submits the form.' },
      { step: 9, actor: 'System', action: 'Validates inputs: checks for duplicate CRN within the same semester and verifies the room is not double-booked at the same time slot.' },
      { step: 10, actor: 'System', action: 'Saves the new section record to the sections table.' },
      { step: 11, actor: 'System', action: 'Writes a CREATE entry to the audit_log table.' },
      { step: 12, actor: 'System', action: 'Displays a success notification and returns the user to the updated section list.' },
    ],
    alternativeFlows: [
      {
        id: 'A1',
        name: 'Edit Existing Section',
        description:
          'At step 5, the user clicks "Edit" on an existing section row. The system displays a pre-filled form. The user modifies the desired fields and submits. Processing continues from step 9.',
      },
      {
        id: 'A2',
        name: 'Delete Section',
        description:
          'At step 4, the user clicks "Delete" on a section row. The system displays a confirmation dialog. If confirmed, the system deletes the record and logs the deletion to audit_log. If cancelled, the user returns to the section list without any change.',
      },
    ],
    exceptions: [
      {
        id: 'E1',
        name: 'Duplicate CRN',
        description:
          'At step 9, if the entered CRN already exists for the same semester, the system highlights the CRN field in red and prevents saving until the value is corrected.',
      },
      {
        id: 'E2',
        name: 'Room Conflict',
        description:
          'At step 9, if the selected room is already scheduled at the same time and days for the same semester, the system displays an overlap warning and prevents saving.',
      },
    ],
    businessRules: [
      'Admin and Chair roles may create, edit, and delete sections. TA Coordinator and Facilities have read-only access.',
      'All create, update, and delete operations are automatically logged to audit_log with a timestamp and the identity of the user who made the change.',
    ],
  },
  {
    id: 'UC-02',
    name: 'Assign TA to Section',
    author: 'Alex',
    date: 'March 2026',
    description:
      'Allows a TA Coordinator to assign a teaching assistant to a course section with a specified weekly hours commitment. The system monitors TA-to-student ratios and sends an automated email notification to the assigned TA.',
    actors: {
      primary: ['TA Coordinator'],
      secondary: ['TA / UGTA (receives notification email)'],
    },
    preconditions: [
      'User is authenticated as TA Coordinator or Admin.',
      'At least one section and at least one TA record exist in the system.',
    ],
    postconditionsSuccess: [
      'A new ta_assignments record links the TA to the section with the specified hours.',
      'A notification record is queued; the TA receives a confirmation email.',
      'The TA ratio table is refreshed to reflect the new assignment.',
    ],
    postconditionsFailure: [
      'No ta_assignments record is created; the user sees a specific error message explaining the failure.',
    ],
    basicFlow: [
      { step: 1, actor: 'TA Coordinator', action: 'Navigates to the TA Management page.' },
      { step: 2, actor: 'System', action: 'Displays the section list with current TA assignments and TA-to-student ratio indicators, highlighting under-served sections.' },
      { step: 3, actor: 'TA Coordinator', action: 'Locates the target section using semester and subject filters.' },
      { step: 4, actor: 'TA Coordinator', action: 'Clicks "Assign TA" on the desired section row.' },
      { step: 5, actor: 'System', action: 'Displays the TA assignment form populated with the list of available TAs.' },
      { step: 6, actor: 'TA Coordinator', action: 'Selects a TA from the dropdown and enters the weekly hours commitment.' },
      { step: 7, actor: 'TA Coordinator', action: 'Submits the assignment form.' },
      { step: 8, actor: 'System', action: 'Verifies the selected TA is not already assigned to this section.' },
      { step: 9, actor: 'System', action: 'Calculates whether the assigned hours bring the TA-to-enrolled-student ratio within the acceptable threshold.' },
      { step: 10, actor: 'System', action: 'Saves the new ta_assignments record to the database.' },
      { step: 11, actor: 'System', action: 'Inserts a notification record into the notifications table; the Supabase Edge Function sends the email to the TA.' },
      { step: 12, actor: 'System', action: 'Refreshes the TA ratio table to reflect the updated assignment and new ratio values.' },
    ],
    alternativeFlows: [
      {
        id: 'A1',
        name: 'Ratio Threshold Warning',
        description:
          'At step 9, if the assigned hours cause the ratio to exceed the recommended threshold, the system displays a warning before saving. The coordinator may confirm to proceed anyway, or cancel and adjust the hours.',
      },
    ],
    exceptions: [
      {
        id: 'E1',
        name: 'Duplicate TA Assignment',
        description:
          'At step 8, if the selected TA is already assigned to the same section, the system displays a duplicate assignment error and prevents saving until a different TA is selected.',
      },
      {
        id: 'E2',
        name: 'No TAs Available',
        description:
          'At step 5, if no TA records exist in the system, the TA dropdown is empty and the coordinator cannot complete the assignment. The system prompts the coordinator to add TA records first.',
      },
    ],
    businessRules: [
      'A TA may be assigned to multiple sections simultaneously.',
      'Weekly hours must be a positive numeric value greater than zero.',
      'Email notification failures do not block the assignment from being saved to the database.',
      'The section_ta_ratios database view computes TA-to-student ratios in real time.',
    ],
  },
  {
    id: 'UC-03',
    name: 'Compare Semester Enrollment',
    author: 'Bri',
    date: 'March 2026',
    description:
      'Allows authorized users to view a side-by-side comparison of course enrollment numbers across Spring 2025 and Fall 2025, with computed percentage change highlighting, to identify enrollment trends and inform advising and staffing decisions.',
    actors: {
      primary: ['Dept Advisor', 'Admin', 'Chair'],
      secondary: [],
    },
    preconditions: [
      'User is authenticated with Dept Advisor, Admin, or Chair role.',
      'Enrollment data for at least two semesters (S25 and F25) has been imported.',
    ],
    postconditionsSuccess: [
      'User can view Spring 2025 and Fall 2025 enrollment counts side-by-side with computed percentage change.',
      'User can filter and sort the comparison data.',
    ],
    postconditionsFailure: [
      'If enrollment data is unavailable for a semester, affected columns display N/A and an informational banner is shown.',
    ],
    basicFlow: [
      { step: 1, actor: 'User', action: 'Navigates to the Enrollment Comparison page.' },
      { step: 2, actor: 'System', action: 'Queries the enrollment_comparison database view for Spring 2025 and Fall 2025 data.' },
      { step: 3, actor: 'System', action: 'Displays a comparison table: Course, Spring 2025 Enrollment, Fall 2025 Enrollment, % Change. Changes greater than ±20% are highlighted.' },
      { step: 4, actor: 'User', action: 'Optionally selects a subject or campus filter.' },
      { step: 5, actor: 'System', action: 'Refreshes the table to show only the filtered subset of courses.' },
      { step: 6, actor: 'User', action: 'Clicks a column header (e.g., % Change) to sort the table.' },
      { step: 7, actor: 'System', action: 'Re-orders the table rows in ascending or descending order based on the selected column.' },
      { step: 8, actor: 'User', action: 'Reviews the sorted data, focusing on courses with the largest enrollment shifts between semesters.' },
    ],
    alternativeFlows: [
      {
        id: 'A1',
        name: 'No Filter Applied',
        description:
          'At step 4, the user skips filtering. The system continues to display all courses. The user may proceed directly to sorting or reviewing data.',
      },
    ],
    exceptions: [
      {
        id: 'E1',
        name: 'Missing Semester Data',
        description:
          'At step 2, if data for one or both semesters is absent, the system displays available data with N/A in missing columns and shows a banner informing the user.',
      },
    ],
    businessRules: [
      'Percentage change is computed as: ((F25 − S25) / S25) × 100, rounded to one decimal place.',
      'A change of more than ±20% is visually highlighted in the comparison table.',
      'The enrollment_comparison database view is the single source of truth for this feature.',
    ],
  },
  {
    id: 'UC-04',
    name: 'Generate and Export Workload Report',
    author: 'Bri, Dana',
    date: 'March 2026',
    description:
      'Allows Chair and Admin users to view a summarized workload report for all instructors in a selected semester, showing section count, total enrollment, and total TA hours, with the option to export as a downloadable PDF or Excel file.',
    actors: {
      primary: ['Chair', 'Admin'],
      secondary: [],
    },
    preconditions: [
      'User is authenticated with Chair or Admin role.',
      'At least one semester with section and instructor data exists in the system.',
    ],
    postconditionsSuccess: [
      'User has reviewed the on-screen workload report, and/or a PDF or XLSX file has been downloaded to the user\'s device.',
    ],
    postconditionsFailure: [
      'If the export API returns an error, the user sees an error notification; the on-screen report remains intact.',
    ],
    basicFlow: [
      { step: 1, actor: 'Chair / Admin', action: 'Navigates to the Workload page.' },
      { step: 2, actor: 'System', action: 'Queries the instructor_workload database view for the default semester.' },
      { step: 3, actor: 'System', action: 'Displays a workload table: Instructor Name, Section Count, Total Enrollment, Total TA Hours Assigned.' },
      { step: 4, actor: 'Chair / Admin', action: 'Selects a semester from the semester dropdown (e.g., Spring 2025).' },
      { step: 5, actor: 'System', action: 'Re-queries the view and refreshes the workload table for the selected semester.' },
      { step: 6, actor: 'Chair / Admin', action: 'Clicks "Export PDF" or "Export Excel".' },
      { step: 7, actor: 'System', action: 'Calls the /api/export/workload API route with the chosen format parameter.' },
      { step: 8, actor: 'System', action: 'Server generates the file (PDF via jsPDF with jspdf-autotable, or XLSX via ExcelJS) and streams it as a download response.' },
      { step: 9, actor: 'System', action: 'The browser receives the streamed response and saves the file to the user\'s device.' },
    ],
    alternativeFlows: [
      {
        id: 'A1',
        name: 'View Without Exporting',
        description:
          'At step 6, the user does not click export. The user reviews the on-screen workload table. The use case ends without a file being generated.',
      },
    ],
    exceptions: [
      {
        id: 'E1',
        name: 'Export Generation Failure',
        description:
          'At step 8, if the server encounters an error during file generation, the API returns an HTTP 500 response. The system displays an error notification; no file download occurs.',
      },
    ],
    businessRules: [
      'The report includes all instructors with at least one active section in the selected semester.',
      'TA hours per instructor are the sum of ta_assignments.hours for all sections taught by that instructor in the selected semester.',
      'Export is performed server-side via Next.js API routes to keep file generation off the browser.',
    ],
  },
]

function UseCaseDocumentation() {
  return (
    <div className="space-y-10">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>Use Case Documentation</strong> — Four use cases documented using the Chapter 5 Use Case Template.
          These correspond to the <span className="font-semibold">blue nodes</span> in the Use Case Diagram tab (UC1–UC4).
          Each use case will be followed through subsequent UML diagrams and implementation phases.
        </p>
      </div>

      {UC_DOCS.map((uc) => (
        <div key={uc.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-200">{uc.id}</span>
                <h3 className="text-lg font-bold mt-0.5">{uc.name}</h3>
              </div>
              <div className="text-right text-sm text-blue-200 shrink-0">
                <div>Author: {uc.author}</div>
                <div>Date: {uc.date}</div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 bg-white">
            {/* Description */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{uc.description}</p>
            </section>

            {/* Actors */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Actors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Primary</p>
                  <ul className="space-y-1">
                    {uc.actors.primary.map((a, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                {uc.actors.secondary.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Secondary</p>
                    <ul className="space-y-1">
                      {uc.actors.secondary.map((a, i) => (
                        <li key={i} className="text-sm text-gray-700 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>

            {/* Pre / Postconditions */}
            <div className="grid grid-cols-2 gap-6">
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Preconditions</h4>
                <ol className="space-y-1.5 list-decimal list-inside">
                  {uc.preconditions.map((p, i) => (
                    <li key={i} className="text-sm text-gray-700">{p}</li>
                  ))}
                </ol>
              </section>
              <section>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Postconditions</h4>
                <p className="text-xs font-semibold text-green-700 mb-1">Success</p>
                <ol className="space-y-1 list-decimal list-inside mb-3">
                  {uc.postconditionsSuccess.map((p, i) => (
                    <li key={i} className="text-sm text-gray-700">{p}</li>
                  ))}
                </ol>
                <p className="text-xs font-semibold text-red-600 mb-1">Failure</p>
                <ol className="space-y-1 list-decimal list-inside">
                  {uc.postconditionsFailure.map((p, i) => (
                    <li key={i} className="text-sm text-gray-700">{p}</li>
                  ))}
                </ol>
              </section>
            </div>

            {/* Basic Flow */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Basic Flow (Main Success Scenario)
              </h4>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-12">Step</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-32">Actor</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Action / System Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {uc.basicFlow.map((row) => (
                      <tr key={row.step} className={row.actor.startsWith('System') ? 'bg-blue-50/40' : ''}>
                        <td className="px-3 py-2 text-gray-400 font-mono text-xs">{row.step}</td>
                        <td className="px-3 py-2 text-xs font-medium text-gray-600">{row.actor}</td>
                        <td className="px-3 py-2 text-gray-700 leading-relaxed">{row.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Alternative Flows */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Alternative Flows</h4>
              <div className="space-y-3">
                {uc.alternativeFlows.map((af) => (
                  <div key={af.id} className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-xs font-semibold text-amber-800 mb-1">{af.id} — {af.name}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{af.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Exceptions */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Exceptions</h4>
              <div className="space-y-3">
                {uc.exceptions.map((ex) => (
                  <div key={ex.id} className="rounded-lg bg-red-50 border border-red-200 p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">{ex.id} — {ex.name}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{ex.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Business Rules */}
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Business Rules / Notes</h4>
              <ul className="space-y-2">
                {uc.businessRules.map((rule, i) => (
                  <li key={i} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-gray-400 font-mono text-xs shrink-0 mt-0.5">BR{i + 1}</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── User Story → Use Case Mapping ───────────────────────────────────────────

const STORY_MAPPINGS = [
  {
    id: 'US-01',
    story: 'Sections CRUD — As an Admin/Chair, I can browse, create, edit, and delete class sections filtered by semester.',
    useCases: [{ label: 'UC1: Manage Course Sections', documented: true }],
  },
  {
    id: 'US-02',
    story: 'Audit Reports — As a Chair/Admin, I can detect duplicate CRNs, room scheduling overlaps, and instructor time conflicts.',
    useCases: [{ label: 'UC5: View Audit Reports', documented: false }],
  },
  {
    id: 'US-03',
    story: 'TA Management — As a TA Coordinator, I can view TA-to-student ratios, flag under-served sections, and assign TAs.',
    useCases: [
      { label: 'UC2: Assign TA to Section', documented: true },
      { label: 'UC10: View My TA Assignments', documented: false },
    ],
  },
  {
    id: 'US-04',
    story: 'Enrollment Comparison — As a Dept Advisor, I can compare enrollment numbers between Spring and Fall semesters.',
    useCases: [{ label: 'UC3: Compare Enrollment Trends', documented: true }],
  },
  {
    id: 'US-05',
    story: 'Room Heatmap — As a Facilities user, I can view a weekly grid of room occupancy by 30-minute time slots.',
    useCases: [{ label: 'UC6: View Room Heatmap', documented: false }],
  },
  {
    id: 'US-06',
    story: 'Instructor Schedule — As an Instructor, I can see my personalized weekly teaching schedule.',
    useCases: [{ label: 'UC7: View Instructor Calendar', documented: false }],
  },
  {
    id: 'US-07',
    story: 'Course Search — As a Student Advisor or Dept Advisor, I can search for a course across all semesters.',
    useCases: [{ label: 'UC8: Search Course Timeline', documented: false }],
  },
  {
    id: 'US-08',
    story: 'TA Self-Service — As a TA/UGTA, I can view my own section assignments and hours.',
    useCases: [{ label: 'UC10: View My TA Assignments', documented: false }],
  },
  {
    id: 'US-09',
    story: 'Workload Report — As a Chair/Admin, I can view and export an instructor workload summary as PDF or Excel.',
    useCases: [{ label: 'UC4: Generate Workload Report', documented: true }],
  },
  {
    id: 'US-10',
    story: 'Waitlist Alerts — As a Chair/Admin/TA Coordinator, I can see courses with high waitlist-to-enrollment ratios.',
    useCases: [{ label: 'UC9: Manage Waitlist Alerts', documented: false }],
  },
]

function UserStoryMapping() {
  return (
    <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-700">User Story → Use Case Mapping</h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
            Documented UC (this deliverable)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-gray-300 inline-block" />
            Undocumented UC
          </span>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-16">ID</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">User Story</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-64">Implementing Use Case(s)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {STORY_MAPPINGS.map((m) => (
            <tr key={m.id}>
              <td className="px-4 py-2.5 text-xs font-mono text-gray-400">{m.id}</td>
              <td className="px-4 py-2.5 text-gray-700">{m.story}</td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {m.useCases.map((uc, j) => (
                    <span
                      key={j}
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        uc.documented
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {uc.label}
                    </span>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Tab configuration ────────────────────────────────────────────────────────

type TabType = 'mermaid' | 'usecase' | 'ucdocs'

interface Tab {
  key: string
  label: string
  type: TabType
  chart?: string
}

const TABS: Tab[] = [
  { key: 'er',        label: 'ER Diagram',              type: 'mermaid',  chart: ER_DIAGRAM },
  { key: 'usecase',   label: 'Use Case Diagram',         type: 'usecase',  chart: USE_CASE_DIAGRAM },
  { key: 'ucdocs',    label: 'UC Documentation',         type: 'ucdocs' },
  { key: 'act1',      label: 'Act: Manage Sections',     type: 'mermaid',  chart: ACT_MANAGE_SECTIONS },
  { key: 'act2',      label: 'Act: Assign TA',           type: 'mermaid',  chart: ACT_ASSIGN_TA },
  { key: 'act3',      label: 'Act: Enrollment Trends',   type: 'mermaid',  chart: ACT_ENROLLMENT },
  { key: 'act4',      label: 'Act: Workload Report',     type: 'mermaid',  chart: ACT_WORKLOAD },
  { key: 'component', label: 'Component Architecture',   type: 'mermaid',  chart: COMPONENT_DIAGRAM },
  { key: 'class',     label: 'Class Diagram',            type: 'mermaid',  chart: CLASS_DIAGRAM },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UMLPage() {
  const [active, setActive] = useState('er')
  const activeTab = TABS.find(t => t.key === active)!

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">UML Diagrams</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          System architecture, use case documentation, and activity diagrams
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex flex-wrap gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-3 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
                active === tab.key
                  ? 'bg-white border-gray-200 text-blue-700 -mb-px'
                  : 'bg-gray-50 border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab.type === 'ucdocs' ? (
        <UseCaseDocumentation />
      ) : activeTab.type === 'usecase' ? (
        <>
          <MermaidDiagram key={active} id={`diagram-${active}`} chart={activeTab.chart!} />
          <UserStoryMapping />
        </>
      ) : (
        <MermaidDiagram key={active} id={`diagram-${active}`} chart={activeTab.chart!} />
      )}
    </div>
  )
}

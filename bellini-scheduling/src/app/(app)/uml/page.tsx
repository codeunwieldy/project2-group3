'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const MermaidDiagram = dynamic(() => import('@/components/uml/MermaidDiagram'), { ssr: false })

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

const USE_CASE_DIAGRAM = `
flowchart LR
  subgraph Roles
    A[Admin]
    B[Chair]
    C[TA Coordinator]
    D[Dept Advisor]
    E[Facilities]
    F[Instructor]
    G[TA / UGTA]
    H[Student Advisor]
  end
  subgraph Features
    UC1[Manage Sections CRUD]
    UC2[Audit Reports]
    UC3[TA-to-Student Ratio]
    UC4[Enrollment Comparison]
    UC5[Room Heatmap]
    UC6[Instructor Calendar]
    UC7[Course Search Timeline]
    UC8[TA Self-Service Portal]
    UC9[Workload Report + Export]
    UC10[Waitlist Alerts]
    UC11[UML Diagrams]
  end
  A --> UC1
  A --> UC2
  A --> UC3
  A --> UC4
  A --> UC5
  A --> UC6
  A --> UC7
  A --> UC8
  A --> UC9
  A --> UC10
  A --> UC11
  B --> UC1
  B --> UC2
  B --> UC9
  B --> UC10
  B --> UC11
  C --> UC1
  C --> UC3
  C --> UC8
  D --> UC4
  D --> UC7
  E --> UC5
  F --> UC6
  G --> UC8
  H --> UC7
`

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

const TABS = [
  { key: 'er', label: 'ER Diagram', chart: ER_DIAGRAM },
  { key: 'usecase', label: 'Use Case', chart: USE_CASE_DIAGRAM },
  { key: 'component', label: 'Component Architecture', chart: COMPONENT_DIAGRAM },
  { key: 'class', label: 'Class Diagram', chart: CLASS_DIAGRAM },
]

export default function UMLPage() {
  const [active, setActive] = useState('er')
  const activeTab = TABS.find(t => t.key === active)!

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">UML Diagrams</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Live-rendered system architecture and design diagrams
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 transition-colors ${
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

      <MermaidDiagram
        key={active}
        id={`diagram-${active}`}
        chart={activeTab.chart}
      />
    </div>
  )
}

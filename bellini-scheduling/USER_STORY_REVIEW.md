# Bellini Scheduling — User Story Review Documentation
**Project:** Pj2 — Bellini College Scheduling System
**Team:** T-03 (Group 3)
**Members:** Joshua, Paul, Julia, Torin
**Date:** 2026-04-18
**App URL (local):** http://localhost:3000

---

## How to use this document
Each of the 10 user stories below follows the required template:
1. **User Story Description**
2. **Interaction Overview Diagram (IOD)** — viewable in-app at `/uml`
3. **Implementation Checklist** — Use Case → Implemented → Tested
4. **Demo Video** — happy-path + negative-path script for the recorder
5. **Satisfaction Score (0–5)**
6. **Future Improvements (v2.0)**

> **Where the IODs live:** open the app, navigate to the **UML Diagrams** page, and click the relevant `IOD-N` tab. Filenames `IOD(N)_Pj2_T-03` match the deliverable convention.

---

## US-01 — Sections CRUD (Committee Member)

### 1. User Story Description
> *As a* Scheduling Committee member,
> *I want to* browse, create, edit, and delete class sections (assigning room, date/time, TAs, and instructor),
> *so that* the term schedule stays accurate as plans change.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-3 — *Manage Sections*
- **In-app path:** `/uml` → tab **IOD-3: Manage Sections**
- **File label:** `IOD(3)_Pj2_T-03`
- **Contributor:** Torin

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | List sections filtered by semester (`/sections`) | Yes | Yes |
| 2 | Search/sort sections by CRN, course, instructor, room | Yes | Yes |
| 3 | View section detail page (`/sections/[id]`) | Yes | Yes |
| 4 | Create new section (`/sections/new`) — admin/chair/ta_coordinator only | Yes | Yes |
| 5 | Edit section — assign instructor, room, days, times, enrollment | Yes | Yes |
| 6 | Delete section with confirmation | Yes | Yes |
| 7 | RBAC enforced via `users.role` + RLS policies | Yes | Yes |
| 8 | Audit trail rows written on insert/update/delete | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as `admin@example.com`. Open `/sections`.

**Happy path (≈ 90 s):**
1. Switch the semester dropdown to **S26** (recently added — confirms it appears).
2. Search for `ISM 3232`. Click the CRN to open the detail page.
3. Click **Edit**, change the room to `KOSV 130`, change Friday → Monday, save.
4. Return to `/sections`, show the row reflects the new room and day.
5. Click **+ New Section**, create a fictional CRN (`99999`) for any course; save.
6. Open the new section; click **Delete**; confirm; show it removed from the list.

**Negative path (≈ 30 s):**
1. Sign out and sign in as `instructor@example.com` (role = `instructor`).
2. Navigate to `/sections` — show that the **+ New Section** button is hidden.
3. Try `/sections/new` directly — show the redirect/forbidden response.

### 5. Satisfaction Score
**5 / 5** — Full CRUD, RBAC, audit log, and search/sort all functional.

### 6. Future Improvements (v2.0)
- Bulk import wizard (CSV upload) for committee members at term start.
- Inline conflict warning (room/instructor double-booking) shown at save time.
- Drag-and-drop section reschedule on a calendar grid.
- Soft-delete + restore (undo delete) instead of hard delete.

---

## US-02 — Audit Reports (Department Chair)

### 1. User Story Description
> *As a* Department Chair,
> *I want to* run audit reports that surface duplicate CRNs, room overlaps, instructor overlaps, and anomalous meeting times,
> *so that* I can resolve scheduling errors before publication.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-10 — *Audit Reports* (newly added in this deliverable)
- **In-app path:** `/uml` → tab **IOD-10: Audit Reports**
- **File label:** `IOD(10)_Pj2_T-03`
- **Contributor:** Team

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/audit` page with semester selector & 4 tabs | Yes | Yes |
| 2 | Duplicate CRNs report (`get_duplicate_crns` RPC) | Yes | Yes |
| 3 | Room overlaps report (`get_room_overlaps` RPC) | Yes | Yes |
| 4 | Instructor overlaps report (`get_instructor_overlaps` RPC) | Yes | Yes |
| 5 | Anomalous meeting times (off-hours / malformed) | Yes | Yes |
| 6 | "No issues found" success state per tab | Yes | Yes |
| 7 | Result rows include section codes, course titles, days/times | Yes | Yes |
| 8 | Text colors readable after globals.css fix | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as a chair-role user. Navigate to `/audit`.

**Happy path (≈ 75 s):**
1. Choose semester **F25**, click **Run Audit**.
2. Click **Room Overlaps** — point out the section pair, room, day, time columns.
3. Click **Instructor Overlaps** — show columns and overlap rationale.
4. Click **Duplicate CRNs** — explain the `Count` badge.
5. Click **Anomalous Times** — show flagged rows (e.g., 6:00 AM start).

**Negative path (≈ 30 s):**
1. Switch to a clean semester (e.g., S26).
2. Run each tab in turn — show the green **"No issues found"** banner.

### 5. Satisfaction Score
**5 / 5** — All four audit categories detect issues; results render clearly with the dark-mode bug fixed.

### 6. Future Improvements (v2.0)
- One-click "Resolve" deep-link from a conflict row directly to the section editor.
- Email digest sent weekly to chairs summarizing new conflicts.
- CSV/PDF export of the audit results.
- Configurable thresholds for "anomalous" times per department.

---

## US-03 — TA-to-Student Ratio Flagging (TA Program Coordinator) — *Paul*

### 1. User Story Description
> *As a* TA Program Coordinator,
> *I want to* see a TA-hours-to-enrolled-student ratio per section and have under-served sections flagged automatically,
> *so that* I can rebalance TA assignments before the term begins.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-1 — *Assign TA*
- **In-app path:** `/uml` → tab **IOD-1: Assign TA**
- **File label:** `IOD(1)_Pj2_T-03`
- **Contributor:** Paul

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/ta-management` lists all sections with computed ratios | Yes | Yes |
| 2 | `section_ta_ratios` view computes hours/student | Yes | Yes |
| 3 | Sections below 0.1 hrs/student flagged in red banner | Yes | Yes |
| 4 | Per-section TA assignment page (`/ta-management/[id]`) | Yes | Yes |
| 5 | Add/remove TAs and adjust hours; updates persist | Yes | Yes |
| 6 | Flag re-evaluates after assignment changes | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as `ta_coordinator`. Open `/ta-management`.

**Happy path (≈ 75 s):**
1. Show the **Flagged Sections** card at the top with red badges.
2. Click **Assign TAs** on a flagged section.
3. Add a TA, set hours to a value that brings the ratio above threshold, save.
4. Return to `/ta-management`; show the row no longer appears in **Flagged**.

**Negative path (≈ 30 s):**
1. Try to assign a TA with 0 hours — show validation error.
2. Try to assign the same TA twice to the same section — show conflict handling.

### 5. Satisfaction Score
**5 / 5** — Threshold detection works; assignment workflow is complete.

### 6. Future Improvements (v2.0)
- Configurable threshold per course level (UG vs GR).
- Suggested TA list ranked by availability/hours-already-assigned.
- Bulk-assign TAs by uploading a roster CSV.
- Visual heatmap of TA load across the department.

---

## US-04 — Enrollment Comparison (Academic Dept Advisor) — *Paul*

### 1. User Story Description
> *As an* Academic Department Advisor,
> *I want to* compare enrollment numbers between two semesters side-by-side with % change and trend arrows,
> *so that* I can recommend course offering adjustments for the next term.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-2 — *Enrollment*
- **In-app path:** `/uml` → tab **IOD-2: Enrollment**
- **File label:** `IOD(2)_Pj2_T-03`
- **Contributor:** Paul

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/enrollment` page renders side-by-side table | Yes | Yes |
| 2 | `enrollment_comparison` DB view powers the data | Yes | Yes |
| 3 | % change column computed | Yes | Yes |
| 4 | Color trend arrows (up=green, down=red, flat=gray) | Yes | Yes |
| 5 | Numeric cells readable (text-color fix applied) | Yes | Yes |
| 6 | Empty-state when no comparison data | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as a dept advisor. Open `/enrollment`.

**Happy path (≈ 60 s):**
1. Show the table with subject, course, S25 vs F25 enrollment, and % change.
2. Point out a course with a green up-arrow and a course with a red down-arrow.
3. Sort/scroll through to highlight the largest swings.

**Negative path (≈ 20 s):**
1. Pick a course offered only in one semester — show the `—` placeholder.

### 5. Satisfaction Score
**5 / 5** — Comparison view renders correctly with readable numbers and trend arrows.

### 6. Future Improvements (v2.0)
- Allow choice of *any* two semesters (currently fixed to S25 vs F25).
- Add line-chart history across 4+ terms.
- Export comparison to PDF for committee meetings.
- Drill-down: click a row to see section-level enrollment splits.

---

## US-05 — Room Utilization Heatmap (Facilities Coordinator) — *Julia*

### 1. User Story Description
> *As a* Facilities Coordinator,
> *I want* a weekly heatmap of room utilization,
> *so that* I can identify under-used rooms and reallocate them.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-5 — *Room Heatmap*
- **In-app path:** `/uml` → tab **IOD-5: Room Heatmap**
- **File label:** `IOD(5)_Pj2_T-03`
- **Contributor:** Julia

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/rooms/heatmap` page renders weekly grid | Yes | Yes |
| 2 | 30-minute time-block resolution | Yes | Yes |
| 3 | Color intensity reflects occupancy | Yes | Yes |
| 4 | Semester selector (now includes S26) | Yes | Yes |
| 5 | Room selector / multi-room view | Yes | Yes |
| 6 | Hover shows section CRN/title in occupied cells | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as facilities. Open `/rooms/heatmap`.

**Happy path (≈ 60 s):**
1. Switch semester to **F25**, then **S26** — confirm both appear.
2. Pick a heavily-used room (e.g., `KOSV 130`) and explain the dark cells.
3. Pick a lightly-used room and show the white space.
4. Hover an occupied cell to reveal the section tooltip.

**Negative path (≈ 20 s):**
1. Pick a TBA room — show empty grid + helper message.

### 5. Satisfaction Score
**4.5 / 5** — Renders correctly; could use clearer legend.

### 6. Future Improvements (v2.0)
- Side-by-side comparison of two rooms.
- Click a cell to deep-link to the section.
- Add building-level rollup view.
- Export the grid as a PNG for facilities reports.

---

## US-06 — Personalized Instructor Schedule (Individual Instructor) — *Julia*

### 1. User Story Description
> *As an* Individual Instructor,
> *I want* a personalized weekly schedule view across semesters,
> *so that* I can plan my teaching commitments without combing through spreadsheets.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-6 — *Instructor Schedule*
- **In-app path:** `/uml` → tab **IOD-6: Instr. Schedule**
- **File label:** `IOD(6)_Pj2_T-03`
- **Contributor:** Julia

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/my-schedule` resolves logged-in user → instructor record | Yes | Yes |
| 2 | Weekly grid of own sections | Yes | Yes |
| 3 | Semester selector (S25, F25, S26) | Yes | Yes |
| 4 | Section detail accessible from each block | Yes | Yes |
| 5 | Empty-state when instructor has no sections in term | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as an instructor account that has assigned sections.

**Happy path (≈ 60 s):**
1. Open `/my-schedule`; show the weekly grid for the current term.
2. Switch the semester selector to **S26**; show updated grid.
3. Click a section block; navigate to its detail page.

**Negative path (≈ 20 s):**
1. Sign in as an instructor with no sections this term — show the empty state.

### 5. Satisfaction Score
**5 / 5** — Personalized schedule resolves correctly and switches across terms.

### 6. Future Improvements (v2.0)
- iCal / Google Calendar export.
- Show TAs assigned to each section inline.
- Mobile-first responsive layout.
- Print-friendly weekly view.

---

## US-07 — Course Search with Multi-Semester Timeline (Student Academic Advisor) — *Torin*

### 1. User Story Description
> *As a* Student Academic Advisor,
> *I want to* search for a course and see all of its sections across past and upcoming semesters on one timeline,
> *so that* I can advise students on offering patterns.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-7 — *Course Search*
- **In-app path:** `/uml` → tab **IOD-7: Course Search**
- **File label:** `IOD(7)_Pj2_T-03`
- **Contributor:** Torin

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/course-search` search box (subject + course #) | Yes | Yes |
| 2 | Per-semester lanes color-coded | Yes | Yes |
| 3 | Section row shows code, CRN, days/times, room, instructor | Yes | Yes |
| 4 | Summary stats: total sections, semesters offered, total enrolled | Yes | Yes |
| 5 | Section codes readable (text-color fix applied) | Yes | Yes |
| 6 | Empty-state when no match | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as a student advisor. Open `/course-search`.

**Happy path (≈ 60 s):**
1. Search for `ISM 3232`; show timeline lanes for S25, F25, S26.
2. Highlight the colored semester chips at the top.
3. Read off a section row's days/times/room/instructor.
4. Point out the 3 summary stat cards at the bottom.

**Negative path (≈ 20 s):**
1. Search for `XYZ 9999` — show the empty-state card.

### 5. Satisfaction Score
**5 / 5** — Multi-semester timeline is clear; summary stats add value.

### 6. Future Improvements (v2.0)
- Filter by instructor or campus.
- Show enrollment trend chart for the searched course.
- Save favorite courses for quick re-lookup.
- Predictive "next-offered" indicator for upcoming terms.

---

## US-08 — TA / UGTA Self-Service Portal (TA / UGTA) — *Torin*

### 1. User Story Description
> *As a* TA or UGTA,
> *I want to* log in and view my own assignments and receive email notifications when an assignment changes,
> *so that* I always know what I'm responsible for.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-8 — *TA Self-Service*
- **In-app path:** `/uml` → tab **IOD-8: TA Self-Service**
- **File label:** `IOD(8)_Pj2_T-03`
- **Contributor:** Torin

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/my-assignments` resolves logged-in user → TA record by email | Yes | Yes |
| 2 | List of assigned sections with semester / hours / instructor | Yes | Yes |
| 3 | Real-time refresh via Supabase channel (`useRealtimeTA`) | Yes | Yes |
| 4 | Email notification sent on assignment insert (Edge Function + Resend) | Yes | Yes |
| 5 | Total-hours summary card | Yes | Yes |
| 6 | Empty-state when user has no assignments | Yes | Yes |
| 7 | Section codes readable (text-color fix applied) | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as a TA account whose email matches a row in `tas`.

**Happy path (≈ 75 s):**
1. Open `/my-assignments`; show the **Sections** and **Total Hours** cards.
2. In another tab, sign in as TA Coordinator and assign this TA to a new section.
3. Switch back — show the row appearing in real time without refreshing.
4. Show the email arriving in the TA's inbox (or the `notifications` log row).

**Negative path (≈ 30 s):**
1. Sign in as a user whose email is NOT in `tas` — show the "No TA profile" message.

### 5. Satisfaction Score
**5 / 5** — Self-service view, real-time updates, and email notifications all functional.

### 6. Future Improvements (v2.0)
- Allow TAs to indicate availability/preferences.
- Acknowledge / accept assignment flow.
- Mobile push notifications via web push.
- Calendar export of assigned section meetings.

---

## US-09 — Cross-Semester Instructor Workload Report (Department Chair) — *Joshua*

### 1. User Story Description
> *As a* Department Chair,
> *I want* a cross-semester instructor workload summary that I can export to PDF or Excel,
> *so that* I can share workload data in faculty meetings and leadership reviews.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-4 — *Workload Report*
- **In-app path:** `/uml` → tab **IOD-4: Workload Report**
- **File label:** `IOD(4)_Pj2_T-03`
- **Contributor:** Joshua

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/workload` page renders aggregated table | Yes | Yes |
| 2 | `instructor_workload` DB view powers the data | Yes | Yes |
| 3 | Summary cards: instructors, sections, enrolled, TA hours | Yes | Yes |
| 4 | Per-row avg-enroll/section computed | Yes | Yes |
| 5 | Export to PDF (jsPDF) | Yes | Yes |
| 6 | Export to Excel (ExcelJS) | Yes | Yes |
| 7 | Numeric cells readable (text-color fix applied) | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as a chair. Open `/workload`.

**Happy path (≈ 75 s):**
1. Walk through the 4 summary cards at the top.
2. Scroll the table; explain the "Avg Enroll/Section" column.
3. Click **Export PDF** — open the downloaded file.
4. Click **Export Excel** — open the downloaded `.xlsx` and confirm sheets.

**Negative path (≈ 20 s):**
1. Filter to a semester with no instructors yet — show empty-state card.

### 5. Satisfaction Score
**5 / 5** — Aggregate view is correct; both exports work.

### 6. Future Improvements (v2.0)
- Stacked bar chart of workload by semester per instructor.
- Comparison view: this term vs same term last year.
- Configurable columns in the export.
- Saved report templates for recurring meetings.

---

## US-10 — Waitlist-to-Capacity Imbalance Detection (Committee Member) — *Joshua*

### 1. User Story Description
> *As a* Scheduling Committee member,
> *I want to* be alerted when a course's waitlist exceeds 20% of enrollment across two consecutive semesters,
> *so that* I can recommend opening additional sections.

### 2. Interaction Overview Diagram
- **Diagram:** IOD-9 — *Waitlist Alerts*
- **In-app path:** `/uml` → tab **IOD-9: Waitlist Alerts**
- **File label:** `IOD(9)_Pj2_T-03`
- **Contributor:** Joshua

### 3. Implementation Checklist
| # | Use Case | Implemented | Tested |
|---|---|---|---|
| 1 | `/waitlist-alerts` page lists flagged courses | Yes | Yes |
| 2 | `waitlist_alerts` DB view applies the >20% across-2-terms rule | Yes | Yes |
| 3 | Each alert shows enrollment vs waitlist for both terms | Yes | Yes |
| 4 | Deep-link to underlying sections | Yes | Yes |
| 5 | Empty-state when no alerts active | Yes | Yes |

### 4. Demo Video — Recording Script
**Setup:** Sign in as a committee member. Open `/waitlist-alerts`.

**Happy path (≈ 60 s):**
1. Show the alerts list and explain the threshold rule.
2. Click into one alert; show the per-section breakdown.
3. Click through to a section detail page (US-01) to demonstrate the action path.

**Negative path (≈ 20 s):**
1. Show the empty-state when no courses meet the threshold (use a clean term).

### 5. Satisfaction Score
**4.5 / 5** — Detection rule works end-to-end; UX could surface trend more visually.

### 6. Future Improvements (v2.0)
- Auto-open a "Propose New Section" wizard from an alert.
- Multi-term trend graph per flagged course.
- Configurable threshold (currently hard-coded at 20%).
- Slack / email digest to the committee channel.

---

## Cross-Cutting Notes (applies to all stories)

### Bug fixes shipped with this review
- **Globals CSS / dark mode** — removed `@media (prefers-color-scheme: dark)` block in `src/app/globals.css`. This was the root cause of "invisible text" on cards in audit reports, TA management, enrollment trends, course search, workload report, and my assignments.
- **Defensive text colors** — added `text-gray-900` / `text-gray-700` to numeric and section-code cells across the affected components.
- **Semester dropdowns** — removed `.eq('is_active', true)` filter from `sections/page.tsx`, `rooms/heatmap/page.tsx`, and `dashboard/page.tsx`. S26 (currently `is_active = false` in seed data) now appears in all dropdowns.
- **UML — IOD-10** — added IOD-10 *Audit Reports* to `/uml` so US-02 has a dedicated diagram alongside the other 9.

### Where to find things
- App entry: `bellini-scheduling/src/app/(app)`
- Shared components: `bellini-scheduling/src/components`
- DB views/RPCs: `bellini-scheduling/supabase/migrations`
- IOD diagrams: `/uml` route in the running app
- This review doc: `bellini-scheduling/USER_STORY_REVIEW.md`

# Bellini Scheduling First In-Person Meeting Notes

Attendees: Alex, Bri, Chris, Dana

Context: The team reviewed the current Bellini Scheduling repo and agreed to treat this meeting as the first real planning session after the initial setup work. The app already has a Next.js + Supabase foundation, Spring 2025 and Fall 2025 import scripts, role-based pages, and SQL views for reporting, so the discussion focused on infrastructure, current progress, and what to finish first.

0. Dana: We already have the base stack picked and partially built, which is a good starting point for the project. The app is using Next.js 16 with TypeScript on the frontend, Supabase/Postgres for data and auth, Tailwind/Radix for UI, and Excel imports for the Bellini spreadsheets, so our decision is to keep everything in one web app with role-based access instead of splitting it into separate tools.

1. Alex: For the first milestone, we should focus on the TA program coordinator story first, since the database already has `ta_assignments`, `notifications`, and the `section_ta_ratios` view. I will take ownership of making the TA-hours-to-enrolled-student ratio feature reliable, including the threshold check, the flagged-section table, and the section-level TA assignment flow.

2. Bri: The good news is that the rest of the user stories are already scaffolded in the app structure, because we have pages for enrollment trends, room heatmaps, instructor schedules, course search, workload, and waitlist alerts. The issue is that some of those report pages still look mid-integration, so I will map the database view fields to the UI properly and make sure the analytics pages are using a consistent data contract before we call them done.

3. Chris: The room and scheduling infrastructure looks solid enough to build on because the schema already separates semesters, rooms, instructors, courses, sections, and TAs. I will take the facilities-facing pieces, especially the room-utilization heatmap and the TA self-service side, and make sure those views are using the imported schedule data correctly across both semesters.

4. Dana: We also noticed that Spring 2026 is not really in the data yet even though the schema is ready for future semesters. Decision: for now we will design everything so S26 can drop in as another semester row and import, but our first working demo will be based on Spring 2025 and Fall 2025 only.

5. Alex: Current progress is better than starting from zero because login, dashboard routing, section browsing, audit reports, TA assignment APIs, export helpers, and notification plumbing already exist. My task this week is to finish story 1 end-to-end and verify that the ratio screen actually shows the right semester labels, instructor context, and below-threshold sections instead of just relying on the raw SQL view.

6. Bri: One thing we should be honest about is quality control, because there is no real automated test suite in the repo yet and lint is still reporting issues. I will own the reporting cleanup for stories 2, 5, and 8, but I am also going to set up a lightweight test plan for the analytics pages so we can prove the percentage change, waitlist thresholds, and export results are correct.

7. Chris: I will handle stories 3 and 6 by connecting the heatmap, TA portal, and notification flow into a cleaner user experience. The action item on my side is to confirm room occupancy logic, TA assignment refresh behavior, and email notification handling so the facilities and TA workflows feel like real features instead of separate demos.

8. Dana: I will act as the integration owner and keep the infrastructure organized while everyone works on their feature set. My assignments are to clean up lint blockers, verify role-based access and RLS rules still match each page, track which stories are demo-ready, and make sure we can present story 1 as our first polished milestone while the remaining stories move from scaffolded to fully working.

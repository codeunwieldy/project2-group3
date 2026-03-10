'use client'

import { usePathname } from 'next/navigation'

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/sections': 'Sections',
  '/sections/new': 'New Section',
  '/audit': 'Audit Reports',
  '/ta-management': 'TA Management',
  '/enrollment': 'Enrollment Trends',
  '/rooms': 'Rooms',
  '/rooms/heatmap': 'Room Heatmap',
  '/course-search': 'Course Search',
  '/my-assignments': 'My Assignments',
  '/workload': 'Workload Report',
  '/waitlist-alerts': 'Waitlist Alerts',
  '/uml': 'UML Diagrams',
}

export function Navbar() {
  const pathname = usePathname()
  const title = BREADCRUMB_MAP[pathname] ?? 'Bellini Scheduling'

  return (
    <header className="fixed top-0 left-56 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-6 z-20">
      <h1 className="text-sm font-semibold text-gray-900">{title}</h1>
    </header>
  )
}

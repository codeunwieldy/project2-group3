import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ROLE_LABELS } from '@/types/user'
import type { UserRole } from '@/types/user'
import Link from 'next/link'

const ROLE_QUICK_LINKS: Record<UserRole, { href: string; label: string; description: string }[]> = {
  admin: [
    { href: '/sections', label: 'Manage Sections', description: 'View and edit all class sections' },
    { href: '/audit', label: 'Audit Reports', description: 'Check for scheduling conflicts' },
    { href: '/workload', label: 'Workload Report', description: 'Instructor load across semesters' },
    { href: '/ta-management', label: 'TA Management', description: 'Assign and monitor TAs' },
    { href: '/rooms/heatmap', label: 'Room Heatmap', description: 'Room utilization visualization' },
    { href: '/uml', label: 'UML Diagrams', description: 'System architecture diagrams' },
  ],
  chair: [
    { href: '/sections', label: 'Sections', description: 'View and manage class sections' },
    { href: '/audit', label: 'Audit Reports', description: 'Review scheduling conflicts' },
    { href: '/workload', label: 'Workload Report', description: 'Instructor workload summary' },
    { href: '/waitlist-alerts', label: 'Waitlist Alerts', description: 'Courses exceeding waitlist threshold' },
  ],
  ta_coordinator: [
    { href: '/ta-management', label: 'TA Assignments', description: 'Manage TA allocations' },
    { href: '/my-assignments', label: 'My Assignments', description: 'Your TA assignments' },
    { href: '/sections', label: 'Sections', description: 'Browse class sections' },
  ],
  dept_advisor: [
    { href: '/enrollment', label: 'Enrollment Trends', description: 'Compare S25 vs F25 enrollment' },
    { href: '/course-search', label: 'Course Search', description: 'Multi-semester course lookup' },
  ],
  facilities: [
    { href: '/rooms/heatmap', label: 'Room Heatmap', description: 'Weekly room utilization grid' },
    { href: '/sections', label: 'Sections', description: 'Browse sections by room' },
  ],
  instructor: [
    { href: '/sections', label: 'All Sections', description: 'Browse course sections' },
  ],
  ta_ugta: [
    { href: '/my-assignments', label: 'My Assignments', description: 'Your TA course assignments' },
  ],
  student_advisor: [
    { href: '/course-search', label: 'Course Search', description: 'Search courses across semesters' },
    { href: '/enrollment', label: 'Enrollment Trends', description: 'Course demand trends' },
  ],
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'student_advisor') as UserRole
  const displayName = profile?.display_name ?? user.email ?? 'User'
  const quickLinks = ROLE_QUICK_LINKS[role] ?? []

  // Stats: fetch some quick numbers
  const { count: sectionCount } = await supabase
    .from('sections')
    .select('*', { count: 'exact', head: true })

  const { count: semesterCount } = await supabase
    .from('semesters')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Welcome back, {displayName.split('@')[0]}
        </h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {ROLE_LABELS[role]} — Bellini College Scheduling System
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Sections</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sectionCount ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active Semesters</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{semesterCount ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Your Role</p>
          <p className="text-base font-semibold text-blue-700 mt-1">{ROLE_LABELS[role]}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">System</p>
          <p className="text-base font-semibold text-green-700 mt-1">Operational</p>
        </div>
      </div>

      {/* Quick links */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Quick Access</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all group"
          >
            <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700">
              {link.label}
            </p>
            <p className="text-xs text-gray-500 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

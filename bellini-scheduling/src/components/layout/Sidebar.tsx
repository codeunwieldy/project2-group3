'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { ROLE_LABELS } from '@/types/user'
import type { UserRole } from '@/types/user'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  Building2,
  Calendar,
  Search,
  ClipboardList,
  TrendingUp,
  Bell,
  GitBranch,
  AlertTriangle,
  LogOut,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
    roles: ['admin', 'chair', 'ta_coordinator', 'dept_advisor', 'facilities', 'instructor', 'ta_ugta', 'student_advisor'],
  },
  {
    href: '/sections',
    label: 'Sections',
    icon: <BookOpen size={18} />,
    roles: ['admin', 'chair', 'ta_coordinator', 'dept_advisor', 'facilities', 'instructor', 'ta_ugta', 'student_advisor'],
  },
  {
    href: '/audit',
    label: 'Audit Reports',
    icon: <AlertTriangle size={18} />,
    roles: ['admin', 'chair'],
  },
  {
    href: '/ta-management',
    label: 'TA Management',
    icon: <Users size={18} />,
    roles: ['admin', 'chair', 'ta_coordinator'],
  },
  {
    href: '/enrollment',
    label: 'Enrollment Trends',
    icon: <TrendingUp size={18} />,
    roles: ['admin', 'chair', 'dept_advisor'],
  },
  {
    href: '/rooms/heatmap',
    label: 'Room Heatmap',
    icon: <Building2 size={18} />,
    roles: ['admin', 'chair', 'facilities'],
  },
  {
    href: '/course-search',
    label: 'Course Search',
    icon: <Search size={18} />,
    roles: ['admin', 'chair', 'student_advisor', 'dept_advisor'],
  },
  {
    href: '/my-assignments',
    label: 'My Assignments',
    icon: <ClipboardList size={18} />,
    roles: ['admin', 'ta_coordinator', 'ta_ugta'],
  },
  {
    href: '/workload',
    label: 'Workload Report',
    icon: <BarChart3 size={18} />,
    roles: ['admin', 'chair'],
  },
  {
    href: '/waitlist-alerts',
    label: 'Waitlist Alerts',
    icon: <Bell size={18} />,
    roles: ['admin', 'chair', 'ta_coordinator'],
  },
  {
    href: '/my-schedule',
    label: 'My Schedule',
    icon: <Calendar size={18} />,
    roles: ['admin', 'instructor'],
  },
  {
    href: '/uml',
    label: 'UML Diagrams',
    icon: <GitBranch size={18} />,
    roles: ['admin', 'chair'],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, loading } = useUser()

  if (loading) return null

  const visibleItems = user
    ? NAV_ITEMS.filter((item) => item.roles.includes(user.role))
    : []

  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">B</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">Bellini</p>
          <p className="text-xs text-gray-500 leading-tight">Scheduling</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={isActive ? 'text-blue-700' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-t border-gray-200 p-3">
        {user && (
          <div className="mb-2 px-2">
            <p className="text-xs font-medium text-gray-900 truncate">{user.display_name ?? user.email}</p>
            <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
          </div>
        )}
        <a
          href="/logout"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </a>
      </div>
    </aside>
  )
}

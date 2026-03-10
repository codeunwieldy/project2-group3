import type { UserRole } from './database'

export type { UserRole }

export interface AppUser {
  id: string
  email: string
  role: UserRole
  display_name: string | null
  instructor_id: number | null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  chair: 'Committee Chair',
  ta_coordinator: 'TA Coordinator',
  dept_advisor: 'Department Advisor',
  facilities: 'Facilities Coordinator',
  instructor: 'Instructor',
  ta_ugta: 'TA / UGTA',
  student_advisor: 'Student Advisor',
}

export const WRITE_ROLES: UserRole[] = ['admin', 'chair', 'ta_coordinator']
export const ADMIN_ROLES: UserRole[] = ['admin', 'chair']

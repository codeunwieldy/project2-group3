// src/types/database.ts
// Manually authored placeholder until `supabase gen types typescript` is run.
// Run: npx supabase gen types typescript > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole =
  | 'admin'
  | 'chair'
  | 'ta_coordinator'
  | 'dept_advisor'
  | 'facilities'
  | 'instructor'
  | 'ta_ugta'
  | 'student_advisor'

export type CourseLevel = 'UG' | 'GR' | 'UGRD' | 'GRAD'
export type TAType = 'GRAD' | 'UGTA'

export type Database = {
  public: {
    Tables: {
      semesters: {
        Row: {
          id: number
          code: string
          term_label: string
          term_code: string | null
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: number
          code: string
          term_label: string
          term_code?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          code?: string
          term_label?: string
          term_code?: string | null
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
        }
        Relationships: []
      }
      campuses: {
        Row: { id: number; code: string; name: string | null }
        Insert: { id?: number; code: string; name?: string | null }
        Update: { id?: number; code?: string; name?: string | null }
        Relationships: []
      }
      subjects: {
        Row: { id: number; code: string; name: string | null }
        Insert: { id?: number; code: string; name?: string | null }
        Update: { id?: number; code?: string; name?: string | null }
        Relationships: []
      }
      rooms: {
        Row: {
          id: number
          room_code: string
          building: string | null
          room_number: string | null
          capacity: number | null
          is_online: boolean
          created_at: string
        }
        Insert: {
          id?: number
          room_code: string
          building?: string | null
          room_number?: string | null
          capacity?: number | null
          is_online?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          room_code?: string
          building?: string | null
          room_number?: string | null
          capacity?: number | null
          is_online?: boolean
        }
        Relationships: []
      }
      instructors: {
        Row: { id: number; email: string; full_name: string | null; created_at: string }
        Insert: { id?: number; email: string; full_name?: string | null; created_at?: string }
        Update: { id?: number; email?: string; full_name?: string | null }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          role: UserRole
          instructor_id: number | null
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role?: UserRole
          instructor_id?: number | null
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: UserRole
          instructor_id?: number | null
          display_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          id: number
          subject_id: number
          course_number: string
          title: string
          course_level: CourseLevel | null
        }
        Insert: {
          id?: number
          subject_id: number
          course_number: string
          title: string
          course_level?: CourseLevel | null
        }
        Update: {
          id?: number
          subject_id?: number
          course_number?: string
          title?: string
          course_level?: CourseLevel | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          id: number
          semester_id: number
          campus_id: number | null
          course_id: number
          crn: string
          section_code: string
          course_level: CourseLevel | null
          meeting_days: string | null
          meeting_times: string | null
          meeting_time_start: string | null
          meeting_time_end: string | null
          room_id: number | null
          enrollment: number | null
          prior_section_enrollment: number | null
          wait_list_actual: number | null
          wait_list_max: number | null
          multiple_sections: string | null
          start_date: string | null
          end_date: string | null
          instructor_id: number | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: number
          semester_id: number
          campus_id?: number | null
          course_id: number
          crn: string
          section_code: string
          course_level?: CourseLevel | null
          meeting_days?: string | null
          meeting_times?: string | null
          meeting_time_start?: string | null
          meeting_time_end?: string | null
          room_id?: number | null
          enrollment?: number | null
          prior_section_enrollment?: number | null
          wait_list_actual?: number | null
          wait_list_max?: number | null
          multiple_sections?: string | null
          start_date?: string | null
          end_date?: string | null
          instructor_id?: number | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: number
          semester_id?: number
          campus_id?: number | null
          course_id?: number
          crn?: string
          section_code?: string
          course_level?: CourseLevel | null
          meeting_days?: string | null
          meeting_times?: string | null
          meeting_time_start?: string | null
          meeting_time_end?: string | null
          room_id?: number | null
          enrollment?: number | null
          prior_section_enrollment?: number | null
          wait_list_actual?: number | null
          wait_list_max?: number | null
          multiple_sections?: string | null
          start_date?: string | null
          end_date?: string | null
          instructor_id?: number | null
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      tas: {
        Row: {
          id: number
          email: string
          full_name: string | null
          ta_type: TAType
          created_at: string
        }
        Insert: {
          id?: number
          email: string
          full_name?: string | null
          ta_type: TAType
          created_at?: string
        }
        Update: {
          id?: number
          email?: string
          full_name?: string | null
          ta_type?: TAType
        }
        Relationships: []
      }
      ta_assignments: {
        Row: {
          id: number
          section_id: number
          ta_id: number
          hours: number | null
          assigned_at: string
          assigned_by: string | null
        }
        Insert: {
          id?: number
          section_id: number
          ta_id: number
          hours?: number | null
          assigned_at?: string
          assigned_by?: string | null
        }
        Update: {
          id?: number
          section_id?: number
          ta_id?: number
          hours?: number | null
          assigned_at?: string
          assigned_by?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: number
          table_name: string
          record_id: number
          action: string
          changed_by: string | null
          old_data: Json | null
          new_data: Json | null
          changed_at: string
        }
        Insert: {
          id?: number
          table_name: string
          record_id: number
          action: string
          changed_by?: string | null
          old_data?: Json | null
          new_data?: Json | null
          changed_at?: string
        }
        Update: {
          id?: number
          table_name?: string
          record_id?: number
          action?: string
          changed_by?: string | null
          old_data?: Json | null
          new_data?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: number
          recipient_email: string
          subject: string
          body: string
          sent_at: string | null
          status: string
          ta_assignment_id: number | null
          created_at: string
        }
        Insert: {
          id?: number
          recipient_email: string
          subject: string
          body: string
          sent_at?: string | null
          status?: string
          ta_assignment_id?: number | null
          created_at?: string
        }
        Update: {
          id?: number
          recipient_email?: string
          subject?: string
          body?: string
          sent_at?: string | null
          status?: string
          ta_assignment_id?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      section_ta_ratios: {
        Row: {
          section_id: number
          semester_id: number
          semester_label: string
          crn: string
          section_code: string
          course_title: string
          instructor_name: string | null
          enrollment: number | null
          total_ta_hours: number
          ta_count: number
          hours_per_student: number | null
          below_threshold: boolean
        }
        Relationships: []
      }
      enrollment_comparison: {
        Row: {
          course_id: number
          subject_code: string
          course_number: string
          course_title: string
          s25_enrollment: number | null
          f25_enrollment: number | null
          pct_change: number | null
        }
        Relationships: []
      }
      instructor_workload: {
        Row: {
          instructor_id: number
          instructor_name: string | null
          email: string
          semester_id: number
          semester_label: string
          section_count: number
          total_enrollment: number | null
          total_ta_hours: number
        }
        Relationships: []
      }
      waitlist_alerts: {
        Row: {
          course_id: number
          subject_code: string
          course_number: string
          course_title: string
          semester_a_id: number
          semester_a_label: string
          semester_b_id: number
          semester_b_label: string
          enrollment_a: number
          enrollment_b: number
          waitlist_a: number
          waitlist_b: number
          waitlist_pct_a: number
          waitlist_pct_b: number
        }
        Relationships: []
      }
    }
    Functions: {
      current_user_role: { Args: Record<string, never>; Returns: UserRole }
      current_user_email: { Args: Record<string, never>; Returns: string }
      get_duplicate_crns: {
        Args: { p_semester_id: number }
        Returns: { crn: string; section_count: number; section_ids: number[] }[]
      }
      get_room_overlaps: {
        Args: { p_semester_id: number }
        Returns: {
          section_a_id: number
          section_b_id: number
          room_code: string
          days: string
          time_start: string
          time_end: string
        }[]
      }
      get_instructor_overlaps: {
        Args: { p_semester_id: number }
        Returns: {
          section_a_id: number
          section_b_id: number
          instructor_name: string
          days: string
          time_start: string
          time_end: string
        }[]
      }
      get_unreasonable_times: {
        Args: { p_semester_id: number }
        Returns: {
          section_id: number
          crn: string
          section_code: string
          course_title: string
          issue: string
          meeting_times: string
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      course_level: CourseLevel
      ta_type: TAType
    }
  }
}

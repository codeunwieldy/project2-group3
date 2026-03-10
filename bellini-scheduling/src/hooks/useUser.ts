'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AppUser } from '@/types/user'

export function useUser() {
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function getUser() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('id, email, role, display_name, instructor_id')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser(profile as AppUser)
      } else {
        // Fallback: user exists in auth but not in users table
        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          role: 'student_advisor',
          display_name: null,
          instructor_id: null,
        })
      }
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}

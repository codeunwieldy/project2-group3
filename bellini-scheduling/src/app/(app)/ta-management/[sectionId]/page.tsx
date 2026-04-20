import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTAAssignmentsForSection } from '@/lib/queries/ta-assignments'
import TAAssignmentForm from '@/components/ta/TAAssignmentForm'

export default async function TAManagementSectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['admin', 'chair', 'ta_coordinator'].includes(profile?.role ?? '')) {
    redirect('/dashboard')
  }

  const { sectionId: sectionIdParam } = await params
  const sectionId = parseInt(sectionIdParam)

  const { data: section } = await supabase
    .from('sections')
    .select(`
      id, crn, section_code,
      courses ( title )
    `)
    .eq('id', sectionId)
    .single()

  if (!section) redirect('/ta-management')

  const rawAssignments = await getTAAssignmentsForSection(supabase, sectionId)

  // Map nested TA data to flat shape expected by TAAssignmentForm
  const assignments = rawAssignments.map((a: Record<string, unknown>) => {
    const ta = a.tas as Record<string, unknown> | null
    return {
      id: a.id as number,
      ta_id: (ta?.id ?? a.ta_id) as number,
      hours: a.hours as number,
      ta_name: (ta?.full_name ?? '') as string,
      ta_email: (ta?.email ?? '') as string,
      ta_type: (ta?.ta_type ?? '') as string,
    }
  })

  const { data: allTAs } = await supabase
    .from('tas')
    .select('id, email, full_name, ta_type')
    .order('full_name')

  const sec = section as Record<string, unknown>
  const simplifiedSection = {
    id: sec.id as number,
    crn: sec.crn as string,
    section_code: sec.section_code as string,
    course_title: (sec.courses as Record<string, unknown>)?.title as string ?? '',
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">TA Assignment</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage TA assignments for this section
        </p>
      </div>
      <TAAssignmentForm
        section={simplifiedSection}
        existingAssignments={assignments}
        availableTAs={(allTAs ?? []) as Parameters<typeof TAAssignmentForm>[0]['availableTAs']}
      />
    </div>
  )
}

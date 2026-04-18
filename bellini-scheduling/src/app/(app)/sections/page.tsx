import { createClient } from '@/lib/supabase/server'
import { getSections } from '@/lib/queries/sections'
import Link from 'next/link'
import SectionTable from '@/components/sections/SectionTable'
import SemesterFilter from '@/components/sections/SemesterFilter'

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SectionsPage({ searchParams }: Props) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: semesters } = await supabase
    .from('semesters')
    .select('id, code, term_label')
    .order('id', { ascending: false })

  // Get the user's role to show/hide create button
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user?.id ?? '')
    .single()

  const semesterId = params.semester_id
    ? parseInt(String(params.semester_id))
    : semesters?.[0]?.id

  const sections = semesterId
    ? await getSections(supabase, { semesterId })
    : []

  const canCreate = profile?.role && ['admin', 'chair', 'ta_coordinator'].includes(profile.role)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Class Sections</h2>
          <p className="text-sm text-gray-500 mt-0.5">{sections.length} sections found</p>
        </div>
        {canCreate && (
          <Link
            href="/sections/new"
            className="bg-blue-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            + New Section
          </Link>
        )}
      </div>

      <SectionTable
        sections={sections}
        semesters={semesters ?? []}
        activeSemesterId={semesterId ?? null}
      />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import AuditReports from '@/components/audit/AuditReports'

export default async function AuditPage() {
  const supabase = await createClient()
  const { data: semesters } = await supabase
    .from('semesters')
    .select('id, code, term_label')
    .order('id', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Audit Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Detect duplicate CRNs, scheduling conflicts, and data anomalies
        </p>
      </div>
      <AuditReports semesters={semesters ?? []} />
    </div>
  )
}

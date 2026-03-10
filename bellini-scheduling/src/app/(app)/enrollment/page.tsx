import { createClient } from '@/lib/supabase/server'
import { getEnrollmentComparison } from '@/lib/queries/enrollment'
import EnrollmentCompareTable from '@/components/enrollment/EnrollmentCompareTable'

export default async function EnrollmentPage() {
  const supabase = await createClient()
  const data = await getEnrollmentComparison(supabase)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Enrollment Trends</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Semester-over-semester enrollment comparison with % change
        </p>
      </div>
      <EnrollmentCompareTable data={data} />
    </div>
  )
}

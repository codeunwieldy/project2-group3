import { createClient } from '@/lib/supabase/server'
import { getInstructorWorkload } from '@/lib/queries/workload'
import WorkloadReport from '@/components/workload/WorkloadReport'

export default async function WorkloadPage() {
  const supabase = await createClient()
  const data = await getInstructorWorkload(supabase)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Instructor Workload Report</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Cross-semester summary of sections, enrollment, and TA hours per instructor
        </p>
      </div>
      <WorkloadReport data={data} />
    </div>
  )
}

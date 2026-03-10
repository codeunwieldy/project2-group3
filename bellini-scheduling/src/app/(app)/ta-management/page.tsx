import { createClient } from '@/lib/supabase/server'
import { getTARatios } from '@/lib/queries/ta-assignments'
import TARatioTable from '@/components/ta/TARatioTable'

export default async function TAManagementPage() {
  const supabase = await createClient()
  const ratios = await getTARatios(supabase)

  const { data: semesters } = await supabase
    .from('semesters')
    .select('id, code, term_label')
    .order('id', { ascending: false })

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">TA Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          TA hours-to-enrollment ratios across all sections
        </p>
      </div>
      <TARatioTable data={ratios} />
    </div>
  )
}

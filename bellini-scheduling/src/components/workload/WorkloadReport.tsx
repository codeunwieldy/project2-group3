'use client'

import { useExport } from '@/hooks/useExport'
import { Spinner } from '@/components/ui/Spinner'

interface WorkloadRow {
  instructor_id: number
  instructor_name: string | null
  semester_label: string
  section_count: number
  total_enrollment: number | null
  total_ta_hours: number
}

interface Props {
  data: WorkloadRow[]
}

export default function WorkloadReport({ data }: Props) {
  const { exportPDF, exportExcel, exporting } = useExport()

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-500">
        No workload data available.
      </div>
    )
  }

  const instructors = [...new Set(data.map(r => r.instructor_id))]
  const totalSections = data.reduce((s, r) => s + r.section_count, 0)
  const totalEnrolled = data.reduce((s, r) => s + (r.total_enrollment ?? 0), 0)
  const totalTAHours = data.reduce((s, r) => s + r.total_ta_hours, 0)

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Instructors', value: instructors.length },
          { label: 'Total Sections', value: totalSections },
          { label: 'Total Enrolled', value: totalEnrolled },
          { label: 'Total TA Hours', value: totalTAHours },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Export buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => exportPDF({ data, title: 'Instructor Workload Report' }, 'workload-report.pdf')}
          disabled={exporting}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {exporting && <Spinner size="sm" />}
          Export PDF
        </button>
        <button
          onClick={() => exportExcel({ sheets: [{ name: 'Workload', rows: data }], filename: 'workload-report' }, 'workload-report.xlsx')}
          disabled={exporting}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {exporting && <Spinner size="sm" />}
          Export Excel
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Instructor</th>
                <th className="px-4 py-3 text-left">Semester</th>
                <th className="px-4 py-3 text-right">Sections</th>
                <th className="px-4 py-3 text-right">Total Enrolled</th>
                <th className="px-4 py-3 text-right">TA Hours</th>
                <th className="px-4 py-3 text-right">Avg Enroll/Section</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{row.instructor_name ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{row.semester_label}</td>
                  <td className="px-4 py-3 text-right font-mono">{row.section_count}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.total_enrollment ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{row.total_ta_hours}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">
                    {row.total_enrollment && row.section_count > 0
                      ? (row.total_enrollment / row.section_count).toFixed(1)
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

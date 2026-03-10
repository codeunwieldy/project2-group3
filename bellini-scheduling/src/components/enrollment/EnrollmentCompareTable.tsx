import TrendArrow from './TrendArrow'

interface EnrollmentRow {
  subject_code: string
  course_number: string
  course_title: string
  s25_enrollment: number | null
  f25_enrollment: number | null
  pct_change: number | null
}

interface Props {
  data: EnrollmentRow[]
}

export default function EnrollmentCompareTable({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
        No enrollment comparison data available.
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Subject</th>
              <th className="px-4 py-3 text-left">Course #</th>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-right">S25 Enrollment</th>
              <th className="px-4 py-3 text-right">F25 Enrollment</th>
              <th className="px-4 py-3 text-right">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => {
              const direction =
                row.pct_change === null || row.pct_change === 0
                  ? 'flat'
                  : row.pct_change > 0
                  ? 'up'
                  : 'down'

              return (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-700">{row.subject_code}</td>
                  <td className="px-4 py-3 font-mono">{row.course_number}</td>
                  <td className="px-4 py-3 text-gray-700 max-w-xs truncate">{row.course_title}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.s25_enrollment ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {row.f25_enrollment ?? <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TrendArrow direction={direction} pct={row.pct_change} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { Badge } from '@/components/ui/Badge'

interface WaitlistAlert {
  subject_code: string
  course_number: string
  course_title: string
  semester_a_label: string
  semester_b_label: string
  enrollment_a: number
  enrollment_b: number
  waitlist_a: number
  waitlist_b: number
  waitlist_pct_a: number
  waitlist_pct_b: number
}

interface Props {
  data: WaitlistAlert[]
}

export default function WaitlistAlerts({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <p className="text-green-700 font-medium">No waitlist imbalances detected</p>
        <p className="text-green-500 text-sm mt-1">No courses have waitlists exceeding 20% of enrollment across two consecutive semesters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-amber-500 text-xl mt-0.5">⚠</span>
        <div>
          <p className="font-semibold text-amber-800">{data.length} course{data.length !== 1 ? 's' : ''} with persistent waitlist imbalance</p>
          <p className="text-sm text-amber-600">Waitlist exceeded 20% of enrollment in two consecutive semesters. Consider adding sections.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((alert, i) => (
          <div key={i} className="bg-white rounded-xl border border-amber-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-bold text-gray-900">{alert.subject_code} {alert.course_number}</p>
                <p className="text-sm text-gray-500 mt-0.5">{alert.course_title}</p>
              </div>
              <Badge variant="warning">Flagged</Badge>
            </div>

            <div className="space-y-2">
              {[
                { label: alert.semester_a_label, enrollment: alert.enrollment_a, waitlist: alert.waitlist_a, pct: alert.waitlist_pct_a },
                { label: alert.semester_b_label, enrollment: alert.enrollment_b, waitlist: alert.waitlist_b, pct: alert.waitlist_pct_b },
              ].map((sem) => (
                <div key={sem.label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">{sem.label}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Enrolled: <strong>{sem.enrollment}</strong></span>
                    <span className="text-gray-600">Waitlist: <strong className="text-amber-700">{sem.waitlist}</strong></span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${Math.min(sem.pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-amber-700 mt-1 font-semibold text-right">{sem.pct.toFixed(1)}% of enrollment</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

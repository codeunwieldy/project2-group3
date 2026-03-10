import { createClient } from '@/lib/supabase/server'
import { getWaitlistAlerts } from '@/lib/queries/waitlist'
import WaitlistAlerts from '@/components/waitlist/WaitlistAlerts'

export default async function WaitlistAlertsPage() {
  const supabase = await createClient()
  const alerts = await getWaitlistAlerts(supabase)

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Waitlist Alerts</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Courses where waitlist exceeds 20% of enrollment across two consecutive semesters
        </p>
      </div>
      <WaitlistAlerts data={alerts} />
    </div>
  )
}

import { auth } from '@/lib/auth'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const session = await auth()
  const user = session!.user as { restaurantId: string; restaurantName: string }
  return <DashboardClient restaurantId={user.restaurantId} />
}

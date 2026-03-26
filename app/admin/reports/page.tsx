import { auth } from '@/lib/auth'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const session = await auth()
  const user = session!.user as { restaurantId: string }
  return <ReportsClient restaurantId={user.restaurantId} />
}

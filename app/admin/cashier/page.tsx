import { auth } from '@/lib/auth'
import CashierClient from './CashierClient'

export default async function CashierPage() {
  const session = await auth()
  const user = session!.user as { restaurantId: string }
  return <CashierClient restaurantId={user.restaurantId} />
}

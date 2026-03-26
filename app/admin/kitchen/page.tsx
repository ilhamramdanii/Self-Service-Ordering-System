import { auth } from '@/lib/auth'
import KitchenClient from './KitchenClient'

export default async function KitchenPage() {
  const session = await auth()
  const user = session!.user as { restaurantId: string }
  return <KitchenClient restaurantId={user.restaurantId} />
}

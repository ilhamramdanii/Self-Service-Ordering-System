import { auth } from '@/lib/auth'
import MenusClient from './MenusClient'

export default async function MenusPage() {
  const session = await auth()
  const user = session!.user as { restaurantId: string }
  return <MenusClient restaurantId={user.restaurantId} />
}

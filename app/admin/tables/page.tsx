import { auth } from '@/lib/auth'
import TablesClient from './TablesClient'

export default async function TablesPage() {
  const session = await auth()
  const user = session!.user as { restaurantId: string }
  return <TablesClient restaurantId={user.restaurantId} />
}

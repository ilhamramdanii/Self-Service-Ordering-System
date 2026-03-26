import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RestaurantsClient from './RestaurantsClient'

export default async function RestaurantsPage() {
  const session = await auth()
  const user = session!.user as { role: string }
  if (user.role !== 'super_admin') redirect('/admin/dashboard')
  return <RestaurantsClient />
}

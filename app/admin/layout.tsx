import { auth } from '@/lib/auth'
import AdminShell from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Jika belum login, render children saja (misal: halaman login).
  // Proxy (proxy.ts) yang bertanggung jawab redirect ke /admin/login
  // untuk route-route yang butuh autentikasi.
  if (!session?.user) {
    return <>{children}</>
  }

  const user = session.user as {
    name?: string
    role: string
    restaurantName: string
  }

  return (
    <AdminShell
      role={user.role}
      userName={user.name ?? 'Admin'}
      restaurantName={user.restaurantName}
    >
      {children}
    </AdminShell>
  )
}

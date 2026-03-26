'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, ChefHat, CreditCard, UtensilsCrossed,
  QrCode, BarChart2, Building2, LogOut, Utensils, X,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  roles: string[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard',   label: 'Dashboard',    icon: <LayoutDashboard className="w-5 h-5" />, roles: ['super_admin', 'cashier'] },
  { href: '/admin/kitchen',     label: 'Dapur (KDS)',  icon: <ChefHat className="w-5 h-5" />,         roles: ['super_admin', 'kitchen'] },
  { href: '/admin/cashier',     label: 'Kasir',        icon: <CreditCard className="w-5 h-5" />,      roles: ['super_admin', 'cashier'] },
  { href: '/admin/menus',       label: 'Menu',         icon: <UtensilsCrossed className="w-5 h-5" />, roles: ['super_admin'] },
  { href: '/admin/tables',      label: 'Meja & QR',   icon: <QrCode className="w-5 h-5" />,          roles: ['super_admin'] },
  { href: '/admin/reports',     label: 'Laporan',      icon: <BarChart2 className="w-5 h-5" />,       roles: ['super_admin', 'cashier'] },
  { href: '/admin/restaurants', label: 'Cabang',       icon: <Building2 className="w-5 h-5" />,       roles: ['super_admin'] },
]

interface Props {
  role: string
  restaurantName: string
  userName: string
  onClose?: () => void
}

export default function Sidebar({ role, restaurantName, userName, onClose }: Props) {
  const pathname = usePathname()

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white w-64">
      {/* Header */}
      <div className="px-5 py-5 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-orange-400 font-medium">CODEEVOLUTION</p>
            <p className="text-sm font-semibold text-white truncate">{restaurantName}</p>
          </div>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User & Logout */}
      <div className="px-3 py-4 border-t border-gray-800">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          <p className="text-xs text-gray-500 capitalize">{role.replace('_', ' ')}</p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: '/admin/login' })}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  )
}

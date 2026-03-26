'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface Props {
  children: React.ReactNode
  role: string
  userName: string
  restaurantName: string
}

export default function AdminShell({ children, role, userName, restaurantName }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopOpen, setDesktopOpen] = useState(true)

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Desktop */}
      {desktopOpen && (
        <aside className="hidden lg:flex flex-shrink-0">
          <Sidebar role={role} userName={userName} restaurantName={restaurantName} />
        </aside>
      )}

      {/* Sidebar Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex flex-shrink-0">
            <Sidebar
              role={role}
              userName={userName}
              restaurantName={restaurantName}
              onClose={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          {/* Hamburger — mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="lg:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>

          {/* Toggle sidebar — desktop */}
          <button
            type="button"
            onClick={() => setDesktopOpen((v) => !v)}
            className="hidden lg:flex w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 items-center justify-center transition"
            title={desktopOpen ? 'Sembunyikan sidebar' : 'Tampilkan sidebar'}
          >
            {desktopOpen
              ? <PanelLeftClose className="w-5 h-5 text-gray-600" />
              : <PanelLeftOpen className="w-5 h-5 text-gray-600" />
            }
          </button>

          {/* Restaurant name */}
          <p className="font-semibold text-gray-900 text-sm flex-1 truncate">{restaurantName}</p>

          {/* User info — desktop only */}
          <div className="hidden lg:flex items-center gap-2 text-right">
            <div>
              <p className="text-sm font-medium text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5">{role.replace('_', ' ')}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/admin/login' })}
            className="flex items-center gap-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 font-medium px-3 py-2 rounded-xl text-sm transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

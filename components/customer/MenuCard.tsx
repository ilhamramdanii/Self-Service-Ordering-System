'use client'

import Image from 'next/image'
import { Plus } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import type { Menu } from '@/types/database.types'

interface Props {
  menu: Menu
  onClick: () => void
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function MenuCard({ menu, onClick }: Props) {
  const { items } = useCartStore()
  const cartQty = items.find((i) => i.menu.id === menu.id)?.quantity ?? 0
  const soldOut = !menu.is_available

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-sm transition-transform ${soldOut ? 'opacity-70 cursor-not-allowed' : 'active:scale-95 cursor-pointer'}`}
      onClick={soldOut ? undefined : onClick}
    >
      {/* Gambar Menu */}
      <div className="relative w-full h-36 bg-gray-100">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            🍽️
          </div>
        )}
        {soldOut ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">SOLD OUT</span>
          </div>
        ) : cartQty > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
            {cartQty}
          </div>
        )}
      </div>

      {/* Info Menu */}
      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{menu.name}</h3>
        {menu.description && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{menu.description}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className={`text-sm font-bold ${soldOut ? 'text-gray-400 line-through' : 'text-orange-500'}`}>
            {formatRupiah(menu.price)}
          </span>
          {!soldOut && (
            <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center shadow-sm">
              <Plus className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

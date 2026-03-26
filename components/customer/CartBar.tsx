'use client'

import { useRouter } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'

interface Props {
  tableId: string
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function CartBar({ tableId }: Props) {
  const router = useRouter()
  const { getTotalItems, getTotalPrice } = useCartStore()

  const totalItems = getTotalItems()
  const totalPrice = getTotalPrice()

  if (totalItems === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
      <button
        onClick={() => router.push(`/order/${tableId}/checkout`)}
        className="w-full max-w-lg mx-auto flex items-center justify-between bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-5 py-4 rounded-2xl shadow-xl transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-white text-orange-500 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </div>
          <span className="font-semibold">Lihat Keranjang</span>
        </div>
        <span className="font-bold">{formatRupiah(totalPrice)}</span>
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Minus, Plus } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import type { MenuWithOptions, MenuOptionItem, CartItemOption } from '@/types/database.types'

interface Props {
  menu: MenuWithOptions
  onClose: () => void
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function MenuOptionModal({ menu, onClose }: Props) {
  const { addItem } = useCartStore()
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [selectedOptions, setSelectedOptions] = useState<Record<string, CartItemOption[]>>({})

  function toggleOption(optionId: string, item: MenuOptionItem, isMultiple: boolean) {
    setSelectedOptions((prev) => {
      const current = prev[optionId] ?? []
      const exists = current.find((o) => o.menu_option_item_id === item.id)

      if (exists) {
        return { ...prev, [optionId]: current.filter((o) => o.menu_option_item_id !== item.id) }
      }

      const newOpt: CartItemOption = {
        menu_option_id: optionId,
        menu_option_item_id: item.id,
        label: item.label,
        additional_price: item.additional_price,
      }

      if (isMultiple) {
        return { ...prev, [optionId]: [...current, newOpt] }
      } else {
        return { ...prev, [optionId]: [newOpt] }
      }
    })
  }

  function isSelected(optionId: string, itemId: string): boolean {
    return (selectedOptions[optionId] ?? []).some((o) => o.menu_option_item_id === itemId)
  }

  function getMissingRequired(): string[] {
    return menu.menu_options
      .filter((opt) => {
        if (!opt.is_required) return false
        const chosen = selectedOptions[opt.id] ?? []
        return chosen.length === 0
      })
      .map((opt) => opt.name)
  }

  function getTotalAdditional(): number {
    return Object.values(selectedOptions)
      .flat()
      .reduce((sum, o) => sum + o.additional_price, 0)
  }

  function handleAddToCart() {
    const missing = getMissingRequired()
    if (missing.length > 0) {
      alert(`Pilih terlebih dahulu: ${missing.join(', ')}`)
      return
    }

    const flatOptions = Object.values(selectedOptions).flat()
    addItem(menu, quantity, notes, flatOptions)
    onClose()
  }

  const totalPrice = (menu.price + getTotalAdditional()) * quantity

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Gambar */}
        <div className="relative w-full h-52 bg-gray-100 flex-shrink-0">
          {menu.image_url ? (
            <Image src={menu.image_url} alt={menu.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🍽️</div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Konten scroll */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <h2 className="text-xl font-bold text-gray-900">{menu.name}</h2>
          {menu.description && (
            <p className="text-sm text-gray-500 mt-1">{menu.description}</p>
          )}
          <p className="text-lg font-bold text-orange-500 mt-1">{formatRupiah(menu.price)}</p>

          {/* Add-ons / Options */}
          {menu.menu_options.map((option) => (
            <div key={option.id} className="mt-5">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-gray-800 text-sm">{option.name}</h3>
                {option.is_required && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                    Wajib
                  </span>
                )}
                {option.is_multiple && (
                  <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full font-medium">
                    Bisa pilih banyak
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {option.menu_option_items.map((item) => {
                  const selected = isSelected(option.id, item.id)
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleOption(option.id, item, option.is_multiple)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-sm ${
                        selected
                          ? 'border-orange-400 bg-orange-50 text-orange-700'
                          : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{item.label}</span>
                      <span className={selected ? 'text-orange-500 font-semibold' : 'text-gray-400'}>
                        {item.additional_price > 0 ? `+${formatRupiah(item.additional_price)}` : 'Gratis'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Catatan */}
          <div className="mt-5">
            <h3 className="font-semibold text-gray-800 text-sm mb-2">Catatan (opsional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: tanpa seledri, tidak terlalu manis..."
              className="w-full p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm resize-none outline-none focus:ring-2 focus:ring-orange-300 transition"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex-shrink-0">
          {/* Quantity */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">Jumlah</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center hover:border-orange-400 transition"
              >
                <Minus className="w-4 h-4 text-gray-600" />
              </button>
              <span className="w-6 text-center font-bold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all flex items-center justify-between px-5"
          >
            <span>Tambah ke Keranjang</span>
            <span>{formatRupiah(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

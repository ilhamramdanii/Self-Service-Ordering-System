import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, CartItemOption, Menu } from '@/types/database.types'

interface CartState {
  items: CartItem[]
  tableId: string | null
  draftOrderId: string | null

  // Actions
  setTableId: (tableId: string) => void
  setDraftOrderId: (orderId: string) => void
  addItem: (menu: Menu, quantity: number, notes: string, options: CartItemOption[]) => void
  removeItem: (menuId: string) => void
  updateQuantity: (menuId: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getTotalItems: () => number
}

function calculateSubtotal(menu: Menu, quantity: number, options: CartItemOption[]): number {
  const optionsTotal = options.reduce((sum, opt) => sum + opt.additional_price, 0)
  return (menu.price + optionsTotal) * quantity
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      tableId: null,
      draftOrderId: null,

      setTableId: (tableId) => set({ tableId }),
      setDraftOrderId: (orderId) => set({ draftOrderId: orderId }),

      addItem: (menu, quantity, notes, options) => {
        const { items } = get()
        const optionIds = options.map((o) => o.id).sort().join(',')
        const existingIndex = items.findIndex(
          (item) =>
            item.menu.id === menu.id &&
            item.notes === notes &&
            item.selected_options.map((o) => o.id).sort().join(',') === optionIds
        )

        if (existingIndex >= 0) {
          const updated = [...items]
          const existing = updated[existingIndex]
          const newQty = existing.quantity + quantity
          updated[existingIndex] = {
            ...existing,
            quantity: newQty,
            subtotal: calculateSubtotal(menu, newQty, existing.selected_options),
          }
          set({ items: updated })
        } else {
          set({
            items: [
              ...items,
              {
                menu,
                quantity,
                notes,
                selected_options: options,
                subtotal: calculateSubtotal(menu, quantity, options),
              },
            ],
          })
        }
      },

      removeItem: (menuId) => {
        set({ items: get().items.filter((item) => item.menu.id !== menuId) })
      },

      updateQuantity: (menuId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuId)
          return
        }
        set({
          items: get().items.map((item) =>
            item.menu.id === menuId
              ? {
                  ...item,
                  quantity,
                  subtotal: calculateSubtotal(item.menu, quantity, item.selected_options),
                }
              : item
          ),
        })
      },

      clearCart: () => set({ items: [] }),

      getTotalPrice: () => get().items.reduce((sum, item) => sum + item.subtotal, 0),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({
        items: state.items,
        tableId: state.tableId,
        draftOrderId: state.draftOrderId,
      }),
    }
  )
)

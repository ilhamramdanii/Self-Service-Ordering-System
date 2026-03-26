'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useCartStore } from '@/store/useCartStore'
import { ChevronLeft, CreditCard, Wallet, Trash2, Minus, Plus } from 'lucide-react'
import type { PaymentMethod } from '@/types/database.types'
import Image from 'next/image'

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const tableId = params.tableId as string

  const { items, getTotalPrice, getTotalItems, updateQuantity, removeItem, clearCart, setDraftOrderId } =
    useCartStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  // Set menu ID yang saat ini sold out (fetch realtime saat buka checkout)
  const [soldOutIds, setSoldOutIds] = useState<Set<string>>(new Set())

  const totalPrice = getTotalPrice()
  const totalItems = getTotalItems()
  const hasSoldOut = items.some((item) => soldOutIds.has(item.menu.id))

  // Fetch ketersediaan terkini semua item di keranjang
  // Pakai items.length sebagai dependency agar re-run setelah Zustand persist rehydrate
  useEffect(() => {
    if (items.length === 0) return
    Promise.all(items.map((item) => fetch(`/api/menu/item/${item.menu.id}`).then((r) => r.json())))
      .then((menus) => {
        const ids = new Set<string>()
        menus.forEach((m) => { if (m?.id && !m.isAvailable) ids.add(m.id) })
        setSoldOutIds(ids)
      })
      .catch(() => {/* abaikan error jaringan */})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId, items.length])

  useEffect(() => {
    if (totalItems === 0) {
      router.replace(`/order/${tableId}`)
    }
  }, [totalItems, tableId, router])

  async function handleOrder() {
    if (!paymentMethod) {
      setError('Pilih metode pembayaran terlebih dahulu')
      return
    }
    if (items.length === 0) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId,
          paymentMethod,
          items: items.map((item) => ({
            menuId: item.menu.id,
            quantity: item.quantity,
            unitPrice: item.menu.price,
            notes: item.notes,
            subtotal: item.subtotal,
            options: item.selected_options,
          })),
          totalPrice,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Gagal membuat pesanan')

      if (paymentMethod === 'online' && data.snapToken) {
        // Trigger Midtrans Snap
        // @ts-expect-error Midtrans global
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            setDraftOrderId(data.orderId)
            clearCart()
            router.push(`/order/${tableId}/status/${data.orderId}`)
          },
          onPending: () => {
            setDraftOrderId(data.orderId)
            clearCart()
            router.push(`/order/${tableId}/status/${data.orderId}`)
          },
          onError: () => {
            setError('Pembayaran gagal. Silakan coba lagi.')
            setSubmitting(false)
          },
          onClose: () => setSubmitting(false),
        })
      } else {
        // Bayar di kasir
        setDraftOrderId(data.orderId)
        clearCart()
        router.push(`/order/${tableId}/status/${data.orderId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setSubmitting(false)
    }
  }

  if (totalItems === 0) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-40">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="font-bold text-gray-900 text-lg">Keranjang Pesanan</h1>
      </header>

      <main className="px-4 pt-4 space-y-4">
        {/* Item List */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
          {[...items]
            .sort((a, b) => {
              const aOut = soldOutIds.has(a.menu.id)
              const bOut = soldOutIds.has(b.menu.id)
              return aOut === bOut ? 0 : aOut ? 1 : -1
            })
            .map((item, idx) => (
            <div key={idx} className={`flex gap-3 p-4 ${soldOutIds.has(item.menu.id) ? 'opacity-60' : ''}`}>
              {/* Gambar kecil */}
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {item.menu.image_url ? (
                  <Image
                    src={item.menu.image_url}
                    alt={item.menu.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                )}
                {soldOutIds.has(item.menu.id) && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      SOLD OUT
                    </span>
                  </div>
                )}
              </div>

              {/* Detail */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                  {item.menu.name}
                </h3>

                {/* Options */}
                {item.selected_options.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                    {item.selected_options.map((o) => o.label).join(', ')}
                  </p>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="text-xs text-orange-400 mt-0.5 italic line-clamp-1">
                    &quot;{item.notes}&quot;
                  </p>
                )}

                <div className="flex items-center justify-between mt-2">
                  {!soldOutIds.has(item.menu.id) ? (
                    <span className="text-sm font-bold text-orange-500">
                      {formatRupiah(item.subtotal)}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      Sold Out
                    </span>
                  )}

                  {/* Qty Control */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.menu.id, item.quantity - 1)}
                      disabled={soldOutIds.has(item.menu.id)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-red-300 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-gray-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menu.id, item.quantity + 1)}
                      disabled={soldOutIds.has(item.menu.id)}
                      className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                      <Plus className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Metode Pembayaran */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Metode Pembayaran</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPaymentMethod('online')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'online'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <CreditCard className={`w-6 h-6 ${paymentMethod === 'online' ? 'text-orange-500' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-semibold ${paymentMethod === 'online' ? 'text-orange-600' : 'text-gray-700'}`}>
                  Bayar Sekarang
                </p>
                <p className="text-xs text-gray-400">QRIS / GoPay / OVO</p>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('cashier')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                paymentMethod === 'cashier'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <Wallet className={`w-6 h-6 ${paymentMethod === 'cashier' ? 'text-orange-500' : 'text-gray-400'}`} />
              <div className="text-center">
                <p className={`text-sm font-semibold ${paymentMethod === 'cashier' ? 'text-orange-600' : 'text-gray-700'}`}>
                  Bayar di Kasir
                </p>
                <p className="text-xs text-gray-400">Tunai / EDC</p>
              </div>
            </button>
          </div>
        </div>

        {/* Ringkasan Harga */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-3">Ringkasan</h2>
          <div className="space-y-2 text-sm">
            {items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-gray-600">
                <span className="line-clamp-1 flex-1 mr-2">
                  {item.menu.name} x{item.quantity}
                </span>
                <span className="flex-shrink-0">{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t border-dashed border-gray-100 pt-2 mt-2 flex justify-between font-bold text-gray-900 text-base">
              <span>Total</span>
              <span className="text-orange-500">{formatRupiah(totalPrice)}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </main>

      {/* Footer Tombol Pesan */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-xl">
        {hasSoldOut && (
          <p className="text-center text-xs text-red-500 mb-2">
            Hapus item sold out sebelum melanjutkan pesanan
          </p>
        )}
        <button
          onClick={handleOrder}
          disabled={submitting || !paymentMethod || hasSoldOut}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all text-base"
        >
          {submitting
            ? 'Memproses...'
            : hasSoldOut
            ? 'Ada Item Sold Out'
            : paymentMethod === 'cashier'
            ? `Pesan Sekarang • ${formatRupiah(totalPrice)}`
            : paymentMethod === 'online'
            ? `Bayar Sekarang • ${formatRupiah(totalPrice)}`
            : 'Pilih Metode Pembayaran'}
        </button>
      </div>
    </div>
  )
}

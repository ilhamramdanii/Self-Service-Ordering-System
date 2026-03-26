'use client'

import { useEffect, useState, useCallback } from 'react'
import { CreditCard, CheckCircle2, Clock, Wallet, Banknote } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  subtotal: number
  menu: { name: string }
}

interface Order {
  id: string
  status: string
  paymentMethod: string
  paymentStatus: string
  totalPrice: number
  createdAt: string
  table: { tableNumber: string }
  orderItems: OrderItem[]
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function CashierClient({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [processing, setProcessing] = useState(false)

  const loadOrders = useCallback(() => {
    fetch(`/api/admin/orders?restaurantId=${restaurantId}&status=pending,preparing,served`)
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [restaurantId])

  useEffect(() => {
    loadOrders()
    const es = new EventSource(`/api/stream/cashier?restaurantId=${restaurantId}`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (['new_order', 'order_updated', 'order_paid'].includes(data.type)) loadOrders()
    }
    return () => es.close()
  }, [restaurantId, loadOrders])

  async function confirmCashPayment(orderId: string) {
    setProcessing(true)
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentStatus: 'paid', status: 'preparing' }),
    })
    setSelectedOrder(null)
    setProcessing(false)
    loadOrders()
  }

  async function markCompleted(orderId: string) {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    })
    loadOrders()
  }

  const unpaidCashier = orders.filter(
    (o) => o.paymentMethod === 'cashier' && o.paymentStatus === 'unpaid'
  )
  const paid = orders.filter((o) => o.paymentStatus === 'paid')
  const totalRevenue = paid.reduce((sum, o) => sum + Number(o.totalPrice), 0)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
          <CreditCard className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kasir</h1>
          <p className="text-xs text-gray-500">Update otomatis via SSE</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Menunggu Bayar</p>
            <p className="text-2xl font-bold text-orange-600 leading-tight">{loading ? '—' : unpaidCashier.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Sudah Dibayar</p>
            <p className="text-2xl font-bold text-green-600 leading-tight">{loading ? '—' : paid.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Order Aktif</p>
            <p className="text-2xl font-bold text-blue-600 leading-tight">{loading ? '—' : orders.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Pendapatan Aktif</p>
            <p className="text-sm font-bold text-emerald-600 leading-tight">{loading ? '—' : formatRupiah(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Perlu Dibayar */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-orange-500" />
          Menunggu Pembayaran
          {unpaidCashier.length > 0 && (
            <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-0.5">
              {unpaidCashier.length}
            </span>
          )}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm animate-pulse h-20" />
            ))}
          </div>
        ) : unpaidCashier.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center text-gray-400 text-sm">
            Tidak ada antrian pembayaran
          </div>
        ) : (
          <div className="space-y-3">
            {unpaidCashier.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm p-4 cursor-pointer hover:shadow-md transition border-2 border-transparent hover:border-orange-200"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Meja {order.table.tableNumber}</p>
                    <p className="text-sm text-gray-500">
                      {order.orderItems.length} item · {formatTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-500">
                      {formatRupiah(Number(order.totalPrice))}
                    </p>
                    <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                      <Wallet className="w-3 h-3 inline mr-1" />
                      Kasir
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sudah Dibayar */}
      <section>
        <h2 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          Sudah Dibayar (Aktif)
        </h2>
        <div className="space-y-2">
          {paid.length === 0 ? (
            <p className="text-sm text-gray-400 bg-white rounded-xl px-4 py-3 shadow-sm">
              Tidak ada order aktif yang sudah dibayar
            </p>
          ) : (
            paid.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm px-4 py-3 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">Meja {order.table.tableNumber}</p>
                  <p className="text-xs text-gray-400 capitalize">{order.status} · {formatRupiah(Number(order.totalPrice))}</p>
                </div>
                {order.status === 'served' && (
                  <button
                    onClick={() => markCompleted(order.id)}
                    className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium transition"
                  >
                    Selesai
                  </button>
                )}
                <span className="text-xs text-green-600 font-medium">✓ Lunas</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Modal konfirmasi bayar */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-orange-50 px-5 py-4">
              <h3 className="font-bold text-gray-900 text-lg">Konfirmasi Pembayaran</h3>
              <p className="text-sm text-gray-500">Meja {selectedOrder.table.tableNumber}</p>
            </div>
            <div className="px-5 py-4 space-y-2">
              {selectedOrder.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-700">
                  <span>{item.menu.name} ×{item.quantity}</span>
                  <span>{formatRupiah(Number(item.subtotal))}</span>
                </div>
              ))}
              <div className="border-t border-dashed pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span>
                <span className="text-orange-500 text-lg">
                  {formatRupiah(Number(selectedOrder.totalPrice))}
                </span>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition"
              >
                Batal
              </button>
              <button
                onClick={() => confirmCashPayment(selectedOrder.id)}
                disabled={processing}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition"
              >
                {processing ? 'Memproses...' : '✓ Konfirmasi Lunas'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

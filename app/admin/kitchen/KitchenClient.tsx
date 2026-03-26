'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChefHat, Clock, CheckCircle2, Bell, PackageCheck } from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  notes: string | null
  menu: { name: string }
  options: { label: string }[]
}

interface Order {
  id: string
  status: string
  paymentStatus: string
  createdAt: string
  table: { tableNumber: string }
  orderItems: OrderItem[]
}

function elapsed(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  return `${Math.floor(diff / 60)}m ${diff % 60}s`
}

function useElapsed() {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 10000)
    return () => clearInterval(t)
  }, [])
}

export default function KitchenClient({ restaurantId }: { restaurantId: string }) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  useElapsed()

  const loadOrders = useCallback(() => {
    fetch(`/api/admin/orders?restaurantId=${restaurantId}&status=pending,preparing,served,completed`)
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false))
  }, [restaurantId])

  useEffect(() => {
    loadOrders()
    const es = new EventSource(`/api/stream/kitchen?restaurantId=${restaurantId}`)
    es.onmessage = (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'new_order' || data.type === 'order_updated') loadOrders()
    }
    return () => es.close()
  }, [restaurantId, loadOrders])

  async function updateStatus(orderId: string, status: string) {
    await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    loadOrders()
  }

  const pending   = orders.filter((o) => o.status === 'pending')
  const preparing = orders.filter((o) => o.status === 'preparing')
  const served    = orders.filter((o) => o.status === 'served')
  const completed = orders.filter((o) => o.status === 'completed')

  return (
    <div className="p-6 space-y-6 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
          <ChefHat className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kitchen Display</h1>
          <p className="text-xs text-gray-500">Update otomatis via SSE</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Menunggu</p>
            <p className="text-2xl font-bold text-blue-600 leading-tight">{pending.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
            <ChefHat className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Dimasak</p>
            <p className="text-2xl font-bold text-orange-600 leading-tight">{preparing.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Siap Saji</p>
            <p className="text-2xl font-bold text-green-600 leading-tight">{served.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
            <PackageCheck className="w-5 h-5 text-gray-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Selesai</p>
            <p className="text-2xl font-bold text-gray-600 leading-tight">{completed.length}</p>
          </div>
        </div>
      </div>

      {/* Active Orders Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 shadow-sm animate-pulse">
              <div className="h-5 bg-gray-100 rounded w-24 mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : pending.length === 0 && preparing.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <ChefHat className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">Tidak ada pesanan aktif</p>
          <p className="text-sm">Pesanan baru akan muncul otomatis</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...pending, ...preparing].map((order) => {
            const isPending = order.status === 'pending'
            const isPaid = order.paymentStatus === 'paid'
            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl shadow-sm overflow-hidden border-t-4 ${
                  isPending ? 'border-blue-400' : 'border-orange-400'
                }`}
              >
                <div className={`px-4 py-3 flex items-center justify-between ${
                  isPending ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  <div className="flex items-center gap-2">
                    {isPending
                      ? <Clock className="w-4 h-4 text-blue-500" />
                      : <ChefHat className="w-4 h-4 text-orange-500" />
                    }
                    <span className={`text-sm font-bold ${isPending ? 'text-blue-700' : 'text-orange-700'}`}>
                      {isPending ? 'MENUNGGU' : 'DIMASAK'}
                    </span>
                    {!isPaid && (
                      <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                        Belum Bayar
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">Meja {order.table.tableNumber}</p>
                    <p className="text-xs text-gray-400">{elapsed(order.createdAt)} lalu</p>
                  </div>
                </div>

                <div className="px-4 py-3 divide-y divide-gray-50">
                  {order.orderItems.map((item) => (
                    <div key={item.id} className="py-2">
                      <p className="font-semibold text-gray-900 text-sm">
                        <span className="text-orange-500 mr-1.5">{item.quantity}×</span>
                        {item.menu.name}
                      </p>
                      {item.options.length > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.options.map((o) => o.label).join(' · ')}
                        </p>
                      )}
                      {item.notes && (
                        <p className="text-xs text-orange-500 mt-0.5 italic">⚠ {item.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  {isPending ? (
                    isPaid ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                      >
                        <ChefHat className="w-4 h-4" />
                        Mulai Masak
                      </button>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm cursor-not-allowed">
                        <ChefHat className="w-4 h-4" />
                        Tunggu Pembayaran
                      </div>
                    )
                  ) : (
                    <button
                      type="button"
                      onClick={() => updateStatus(order.id, 'served')}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      Siap Disajikan
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Siap Disajikan */}
      {served.length > 0 && (
        <CollapsibleSection
          title={`Siap Disajikan (${served.length})`}
          icon={<Bell className="w-4 h-4 text-green-600" />}
          headerClass="bg-green-50 hover:bg-green-100"
          titleClass="text-green-700"
        >
          {served.map((order) => (
            <div key={order.id} className="flex items-center gap-3 px-5 py-3">
              <p className="flex-1 text-sm font-medium text-gray-900">Meja {order.table.tableNumber}</p>
              <p className="text-xs text-gray-400">{order.orderItems.length} item · {elapsed(order.createdAt)} lalu</p>
              <button
                type="button"
                onClick={() => updateStatus(order.id, 'completed')}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition"
              >
                Selesai
              </button>
            </div>
          ))}
        </CollapsibleSection>
      )}

      {/* Selesai */}
      {completed.length > 0 && (
        <CollapsibleSection
          title={`Selesai Hari Ini (${completed.length})`}
          icon={<PackageCheck className="w-4 h-4 text-gray-500" />}
          headerClass="bg-gray-50 hover:bg-gray-100"
          titleClass="text-gray-600"
          defaultOpen={false}
        >
          {completed.map((order) => (
            <div key={order.id} className="flex items-center gap-3 px-5 py-3">
              <p className="flex-1 text-sm font-medium text-gray-700">Meja {order.table.tableNumber}</p>
              <p className="text-xs text-gray-400">{order.orderItems.length} item · {elapsed(order.createdAt)} lalu</p>
              <span className="text-xs text-gray-400 font-medium">✓ Selesai</span>
            </div>
          ))}
        </CollapsibleSection>
      )}
    </div>
  )
}

function CollapsibleSection({
  title,
  icon,
  headerClass,
  titleClass,
  defaultOpen = true,
  children,
}: {
  title: string
  icon: React.ReactNode
  headerClass: string
  titleClass: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full px-5 py-3 flex items-center justify-between transition ${headerClass}`}
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className={`text-sm font-semibold ${titleClass}`}>{title}</span>
        </div>
        <span className="text-gray-400 text-xs">{open ? 'Sembunyikan ▲' : 'Tampilkan ▼'}</span>
      </button>
      {open && <div className="divide-y divide-gray-50">{children}</div>}
    </div>
  )
}

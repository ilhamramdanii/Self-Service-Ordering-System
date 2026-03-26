'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart2, Banknote, ShoppingBag, CreditCard, Wallet, TrendingUp, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

interface Summary {
  totalOrders: number
  paidOrders: number
  unpaidOrders: number
  totalRevenue: number
  cashRevenue: number
  onlineRevenue: number
}

interface TopMenu { menuId: string; name: string; quantity: number; revenue: number }

interface Order {
  id: string
  status: string
  paymentMethod: string | null
  paymentStatus: string
  totalPrice: number
  createdAt: string
  table: { tableNumber: string }
  orderItems: { id: string; menu: { name: string }; quantity: number; subtotal: number }[]
}

interface ReportData {
  summary: Summary
  topMenus: TopMenu[]
  orders: Order[]
  period: string
  startDate: string
  endDate: string
}

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CLASS: Record<string, string> = {
  pending:   'bg-blue-100 text-blue-700',
  preparing: 'bg-orange-100 text-orange-700',
  served:    'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu', preparing: 'Dimasak', served: 'Siap',
  completed: 'Selesai', cancelled: 'Batal',
}

export default function ReportsClient({ restaurantId }: { restaurantId: string }) {
  const today = new Date().toISOString().slice(0, 10)
  const currentMonth = new Date().toISOString().slice(0, 7)

  const [period, setPeriod] = useState<'daily' | 'monthly'>('daily')
  const [date, setDate] = useState(today)
  const [month, setMonth] = useState(currentMonth)
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    const dateParam = period === 'monthly' ? `${month}-01` : date
    fetch(`/api/admin/reports?restaurantId=${restaurantId}&period=${period}&date=${dateParam}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [restaurantId, period, date, month])

  useEffect(() => { load() }, [load])

  function exportExcel() {
    if (!data) return

    // Sheet 1: Ringkasan
    const summaryRows = [
      ['Laporan Penjualan', ''],
      ['Periode', period === 'daily' ? `Harian — ${date}` : `Bulanan — ${month}`],
      ['', ''],
      ['Total Order', data.summary.totalOrders],
      ['Sudah Dibayar', data.summary.paidOrders],
      ['Belum Dibayar', data.summary.unpaidOrders],
      ['Total Pendapatan', data.summary.totalRevenue],
      ['Bayar Kasir', data.summary.cashRevenue],
      ['Bayar Online', data.summary.onlineRevenue],
    ]

    // Sheet 2: Riwayat Order
    const orderRows = [
      ['ID Order', 'Waktu', 'Meja', 'Status', 'Metode Bayar', 'Status Bayar', 'Total (Rp)'],
      ...data.orders.map((o) => [
        o.id.slice(0, 8),
        formatDate(o.createdAt),
        `Meja ${o.table.tableNumber}`,
        STATUS_LABEL[o.status] ?? o.status,
        o.paymentMethod === 'online' ? 'Online' : o.paymentMethod === 'cashier' ? 'Kasir' : '-',
        o.paymentStatus === 'paid' ? 'Lunas' : 'Belum',
        Number(o.totalPrice),
      ]),
    ]

    // Sheet 3: Menu Terlaris
    const menuRows = [
      ['Peringkat', 'Nama Menu', 'Qty Terjual', 'Revenue (Rp)'],
      ...data.topMenus.map((m, i) => [i + 1, m.name, m.quantity, m.revenue]),
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Ringkasan')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(orderRows), 'Riwayat Order')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(menuRows), 'Menu Terlaris')

    const filename = `laporan-${period === 'monthly' ? month : date}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const s = data?.summary

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <BarChart2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Laporan Penjualan</h1>
            <p className="text-xs text-gray-500">Data transaksi restoran</p>
          </div>
        </div>
        <button
          type="button"
          onClick={exportExcel}
          disabled={!data || data.orders.length === 0}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-4 py-2.5 rounded-xl transition text-sm"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="flex bg-gray-100 rounded-xl p-1">
          {(['daily', 'monthly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                period === p ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p === 'daily' ? 'Harian' : 'Bulanan'}
            </button>
          ))}
        </div>

        {period === 'daily' ? (
          <input
            type="date" value={date} onChange={(e) => setDate(e.target.value)} max={today}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        ) : (
          <input
            type="month" value={month} onChange={(e) => setMonth(e.target.value)} max={currentMonth}
            className="px-3 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Order',      value: s?.totalOrders ?? 0,   icon: <ShoppingBag className="w-5 h-5" />, iconBg: 'bg-blue-50',   iconColor: 'text-blue-500',   textColor: 'text-blue-600',   fmt: (v: number) => String(v) },
          { label: 'Sudah Dibayar',    value: s?.paidOrders ?? 0,    icon: <ShoppingBag className="w-5 h-5" />, iconBg: 'bg-green-50',  iconColor: 'text-green-500',  textColor: 'text-green-600',  fmt: (v: number) => String(v) },
          { label: 'Belum Dibayar',    value: s?.unpaidOrders ?? 0,  icon: <ShoppingBag className="w-5 h-5" />, iconBg: 'bg-red-50',    iconColor: 'text-red-400',    textColor: 'text-red-500',    fmt: (v: number) => String(v) },
          { label: 'Total Pendapatan', value: s?.totalRevenue ?? 0,  icon: <Banknote className="w-5 h-5" />,    iconBg: 'bg-orange-50', iconColor: 'text-orange-500', textColor: 'text-orange-600', fmt: formatRupiah },
          { label: 'Bayar Kasir',      value: s?.cashRevenue ?? 0,   icon: <Wallet className="w-5 h-5" />,      iconBg: 'bg-purple-50', iconColor: 'text-purple-500', textColor: 'text-purple-600', fmt: formatRupiah },
          { label: 'Bayar Online',     value: s?.onlineRevenue ?? 0, icon: <CreditCard className="w-5 h-5" />,  iconBg: 'bg-teal-50',   iconColor: 'text-teal-500',   textColor: 'text-teal-600',   fmt: formatRupiah },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center flex-shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-xs text-gray-500">{stat.label}</p>
              <p className={`font-bold leading-tight ${loading ? 'text-gray-200 animate-pulse' : stat.textColor} ${stat.fmt(stat.value).length > 8 ? 'text-sm' : 'text-2xl'}`}>
                {loading ? '—' : stat.fmt(stat.value)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Top Menu */}
      {data?.topMenus && data.topMenus.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900 text-sm">Menu Terlaris</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {data.topMenus.map((m, idx) => {
              const maxQty = data.topMenus[0].quantity
              return (
                <div key={m.menuId} className="px-5 py-3 flex items-center gap-3">
                  <span className={`text-lg font-bold w-6 text-center flex-shrink-0 ${
                    idx === 0 ? 'text-orange-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-600' : 'text-gray-300'
                  }`}>{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div
                        className="bg-orange-400 h-1.5 rounded-full"
                        style={{ width: `${(m.quantity / maxQty) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-900">{m.quantity}×</p>
                    <p className="text-xs text-gray-400">{formatRupiah(m.revenue)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Order List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-sm">
            Riwayat Order {data ? `(${data.orders.length})` : ''}
          </h2>
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data || data.orders.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Tidak ada data untuk periode ini
          </div>
        ) : (
          <div className="divide-y divide-gray-50 overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-medium">Waktu</th>
                  <th className="px-3 py-3 text-left font-medium">Meja</th>
                  <th className="px-3 py-3 text-left font-medium">Status</th>
                  <th className="px-3 py-3 text-left font-medium">Bayar</th>
                  <th className="px-3 py-3 text-right font-medium">Total</th>
                  <th className="px-5 py-3 text-right font-medium">Lunas</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(order.createdAt)}</td>
                    <td className="px-3 py-3 font-medium text-gray-900">Meja {order.table.tableNumber}</td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CLASS[order.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      {order.paymentMethod === 'online' ? 'Online' : order.paymentMethod === 'cashier' ? 'Kasir' : '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-gray-900">
                      {formatRupiah(Number(order.totalPrice))}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={`text-xs font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                        {order.paymentStatus === 'paid' ? '✓ Lunas' : 'Belum'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

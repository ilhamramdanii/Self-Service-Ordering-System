'use client'

import { useEffect, useState, useCallback } from 'react'
import { ShoppingBag, Clock, Banknote, TrendingUp, RefreshCw, Calendar } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

interface RecentOrder {
  id: string
  status: string
  paymentStatus: string
  totalPrice: number
  createdAt: string
  table: { tableNumber: string }
  orderItems: { id: string }[]
}

interface LineData { date: string; label: string; orders: number; revenue: number }
interface PieItem { name: string; value: number; revenue?: number; status?: string }

interface DashboardData {
  totalOrdersToday: number
  pendingOrders: number
  revenueToday: number
  recentOrders: RecentOrder[]
  lineChartData: LineData[]
  piePayment: PieItem[]
  pieStatus: PieItem[]
}

type TrendMode = '7d' | '30d' | 'custom'

function formatRupiah(amount: number) {
  if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`
  if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`
  return `Rp ${amount}`
}

function formatRupiahFull(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function toLocalDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending:   { label: 'Menunggu',  className: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Dimasak',   className: 'bg-orange-100 text-orange-700' },
  served:    { label: 'Siap',      className: 'bg-green-100 text-green-700' },
  completed: { label: 'Selesai',   className: 'bg-gray-100 text-gray-600' },
  cancelled: { label: 'Batal',     className: 'bg-red-100 text-red-600' },
  draft:     { label: 'Draft',     className: 'bg-gray-100 text-gray-400' },
}

const PIE_PAYMENT_COLORS = ['#f97316', '#3b82f6', '#a855f7']
const PIE_STATUS_COLORS: Record<string, string> = {
  pending: '#3b82f6', preparing: '#f97316', served: '#22c55e',
  completed: '#6b7280', cancelled: '#ef4444',
}

function LineTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p className="text-orange-500">Orders: <strong>{payload[0]?.value}</strong></p>
      <p className="text-blue-500">Revenue: <strong>{formatRupiahFull(payload[1]?.value ?? 0)}</strong></p>
    </div>
  )
}

export default function DashboardClient({ restaurantId }: { restaurantId: string }) {
  const todayStr = toLocalDate(new Date())
  const sevenAgo = toLocalDate(new Date(Date.now() - 6 * 86400000))

  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [trendMode, setTrendMode] = useState<TrendMode>('7d')
  const [customStart, setCustomStart] = useState(sevenAgo)
  const [customEnd, setCustomEnd] = useState(todayStr)

  const buildTrendParams = useCallback(() => {
    if (trendMode === '7d') {
      const now = new Date()
      const dow = now.getDay() // 0=Min, 1=Sen, ..., 6=Sab
      const monday = new Date(now)
      monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      return `trendStart=${toLocalDate(monday)}&trendEnd=${toLocalDate(sunday)}`
    }
    if (trendMode === '30d') return 'trendDays=30'
    return `trendStart=${customStart}&trendEnd=${customEnd}`
  }, [trendMode, customStart, customEnd])

  const load = useCallback((isManual = false) => {
    if (isManual) setRefreshing(true)
    else setLoading(true)
    fetch(`/api/admin/dashboard?restaurantId=${restaurantId}&${buildTrendParams()}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [restaurantId, buildTrendParams])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(), 30000)
    return () => clearInterval(interval)
  }, [load])

  const stats = [
    { label: 'Order Hari Ini', value: data?.totalOrdersToday ?? 0, icon: <ShoppingBag className="w-6 h-6" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Sedang Diproses', value: data?.pendingOrders ?? 0, icon: <Clock className="w-6 h-6" />, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Pendapatan Hari Ini', value: formatRupiahFull(data?.revenueToday ?? 0), icon: <Banknote className="w-6 h-6" />, color: 'text-green-500', bg: 'bg-green-50' },
  ]

  const chartData = data?.lineChartData ?? []
  // Jika data > 14 titik, pakai fixed width agar bisa di-scroll; jika tidak, ResponsiveContainer
  const needsScroll = chartData.length > 14
  const fixedChartWidth = chartData.length * 60

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 font-medium px-4 py-2 rounded-xl text-sm transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Memuat...' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className={`text-2xl font-bold ${loading ? 'text-gray-200 animate-pulse' : 'text-gray-900'}`}>
                  {loading ? '—' : stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-gray-900 text-sm">Tren Order & Pendapatan</h2>

          {/* Filter buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {(['7d', '30d', 'custom'] as TrendMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTrendMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    trendMode === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {m === '7d' ? '7 Hari' : m === '30d' ? '30 Hari' : 'Custom'}
                </button>
              ))}
            </div>

            {trendMode === 'custom' && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={customStart}
                  max={customEnd}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-400"
                />
                <span className="text-xs text-gray-400">s/d</span>
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={todayStr}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {loading || !data?.lineChartData ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : needsScroll ? (
            /* Mode scroll: fixed width */
            <div className="overflow-x-auto">
              <LineChart
                width={fixedChartWidth}
                height={220}
                data={chartData}
                margin={{ top: 5, right: 16, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} interval={0} />
                <YAxis yAxisId="orders" orientation="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                <YAxis yAxisId="revenue" orientation="right" tickFormatter={formatRupiah} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<LineTooltip />} />
                <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Orders" />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Revenue" strokeDasharray="5 3" />
              </LineChart>
            </div>
          ) : (
            /* Mode responsive: full width */
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="orders" orientation="left" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                <YAxis yAxisId="revenue" orientation="right" tickFormatter={formatRupiah} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<LineTooltip />} />
                <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Orders" />
                <Line yAxisId="revenue" type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} name="Revenue" strokeDasharray="5 3" />
              </LineChart>
            </ResponsiveContainer>
          )}

          {!loading && (
            <div className="flex items-center gap-5 justify-center mt-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-5 h-0.5 bg-orange-500 rounded" />
                Jumlah Order
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-5 h-0.5 rounded" style={{ borderTop: '2px dashed #3b82f6' }} />
                Pendapatan
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pie — Metode Pembayaran */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Metode Pembayaran (7 Hari)</h2>
          </div>
          <div className="p-4">
            {loading || !data?.piePayment ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : data.piePayment.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-gray-400 text-sm">Belum ada data</div>
            ) : (
              <div className="flex justify-center">
                <PieChart width={240} height={180}>
                  <Pie
                    data={data.piePayment}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.piePayment.map((_, i) => (
                      <Cell key={i} fill={PIE_PAYMENT_COLORS[i % PIE_PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [`${value} order`, name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </div>
            )}
          </div>
        </div>

        {/* Pie — Status Order Hari Ini */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Status Order Hari Ini</h2>
          </div>
          <div className="p-4">
            {loading || !data?.pieStatus ? (
              <div className="h-44 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : data.pieStatus.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-gray-400 text-sm">Belum ada order hari ini</div>
            ) : (
              <div className="flex justify-center">
                <PieChart width={240} height={180}>
                  <Pie
                    data={data.pieStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.pieStatus.map((item, i) => (
                      <Cell key={i} fill={PIE_STATUS_COLORS[item.status ?? ''] ?? '#9ca3af'} />
                    ))}
                  </Pie>
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [`${value} order`, name]}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Order Terbaru</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-16" />
                <div className="h-4 bg-gray-100 rounded w-24 flex-1" />
                <div className="h-4 bg-gray-100 rounded w-20" />
              </div>
            ))
          ) : data?.recentOrders.length === 0 ? (
            <div className="px-5 py-10 text-center text-gray-400 text-sm">Belum ada order hari ini</div>
          ) : (
            data?.recentOrders.map((order) => {
              const st = STATUS_LABEL[order.status] ?? STATUS_LABEL.draft
              return (
                <div key={order.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition">
                  <span className="text-sm font-mono text-gray-400 w-10 flex-shrink-0">
                    {formatTime(order.createdAt)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      Meja {order.table.tableNumber}
                      <span className="text-gray-400 font-normal ml-1.5 text-xs">· {order.orderItems.length} item</span>
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${st.className}`}>
                    {st.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">
                    {formatRupiahFull(Number(order.totalPrice))}
                  </span>
                  <span className={`text-xs flex-shrink-0 ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>
                    {order.paymentStatus === 'paid' ? '✓ Lunas' : 'Belum'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

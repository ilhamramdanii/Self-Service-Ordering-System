import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // --- Trend range ---
  const trendDays   = parseInt(req.nextUrl.searchParams.get('trendDays') ?? '7')
  const trendStart  = req.nextUrl.searchParams.get('trendStart')
  const trendEnd    = req.nextUrl.searchParams.get('trendEnd')

  let rangeStart: Date
  let rangeEnd: Date

  if (trendStart && trendEnd) {
    rangeStart = new Date(trendStart)
    rangeStart.setHours(0, 0, 0, 0)
    rangeEnd = new Date(trendEnd)
    rangeEnd.setHours(23, 59, 59, 999)
  } else {
    const days = isNaN(trendDays) || trendDays < 1 ? 7 : trendDays
    rangeStart = new Date(today)
    rangeStart.setDate(rangeStart.getDate() - (days - 1))
    rangeEnd = new Date(today)
    rangeEnd.setHours(23, 59, 59, 999)
  }

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [
    totalOrdersToday,
    pendingOrders,
    revenueToday,
    recentOrders,
    trendOrders,
    paymentBreakdown,
    statusBreakdown,
  ] = await Promise.all([
    prisma.order.count({
      where: { restaurantId, createdAt: { gte: today }, status: { not: 'cancelled' } },
    }),
    prisma.order.count({
      where: { restaurantId, status: { in: ['pending', 'preparing'] } },
    }),
    prisma.order.aggregate({
      where: { restaurantId, paymentStatus: 'paid', createdAt: { gte: today } },
      _sum: { totalPrice: true },
    }),
    prisma.order.findMany({
      where: { restaurantId, status: { not: 'draft' } },
      include: { table: true, orderItems: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.order.findMany({
      where: {
        restaurantId,
        createdAt: { gte: rangeStart, lte: rangeEnd },
        status: { not: 'cancelled' },
      },
      select: { createdAt: true, totalPrice: true, paymentStatus: true },
    }),
    prisma.order.groupBy({
      by: ['paymentMethod'],
      where: { restaurantId, paymentStatus: 'paid', createdAt: { gte: sevenDaysAgo } },
      _count: { id: true },
      _sum: { totalPrice: true },
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { restaurantId, createdAt: { gte: today }, status: { not: 'draft' } },
      _count: { id: true },
    }),
  ])

  // Build daily map for the selected range
  const dailyMap = new Map<string, { orders: number; revenue: number }>()
  const cursor = new Date(rangeStart)
  cursor.setHours(0, 0, 0, 0)
  const endDay = new Date(rangeEnd)
  endDay.setHours(0, 0, 0, 0)
  while (cursor <= endDay) {
    dailyMap.set(cursor.toISOString().slice(0, 10), { orders: 0, revenue: 0 })
    cursor.setDate(cursor.getDate() + 1)
  }

  for (const o of trendOrders) {
    const key = o.createdAt.toISOString().slice(0, 10)
    const cur = dailyMap.get(key)
    if (cur) {
      cur.orders += 1
      if (o.paymentStatus === 'paid') cur.revenue += Number(o.totalPrice)
    }
  }

  const totalDays = dailyMap.size
  const lineChartData = Array.from(dailyMap.entries()).map(([date, val]) => ({
    date,
    label: totalDays <= 14
      ? new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
      : new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    orders: val.orders,
    revenue: val.revenue,
  }))

  const piePayment = paymentBreakdown.map((p) => ({
    name: p.paymentMethod === 'online' ? 'Online' : p.paymentMethod === 'cashier' ? 'Kasir' : 'Lainnya',
    value: p._count.id,
    revenue: Number(p._sum.totalPrice ?? 0),
  }))

  const STATUS_LABEL: Record<string, string> = {
    pending: 'Menunggu', preparing: 'Dimasak', served: 'Siap',
    completed: 'Selesai', cancelled: 'Batal',
  }
  const pieStatus = statusBreakdown.map((s) => ({
    name: STATUS_LABEL[s.status] ?? s.status,
    value: s._count.id,
    status: s.status,
  }))

  return NextResponse.json({
    totalOrdersToday,
    pendingOrders,
    revenueToday: revenueToday._sum.totalPrice ?? 0,
    recentOrders,
    lineChartData,
    piePayment,
    pieStatus,
  })
}

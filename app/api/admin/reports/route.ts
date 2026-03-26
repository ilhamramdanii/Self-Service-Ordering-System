import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurantId')
  const period = req.nextUrl.searchParams.get('period') ?? 'daily' // daily | monthly
  const dateParam = req.nextUrl.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const date = new Date(dateParam)

  let startDate: Date
  let endDate: Date

  if (period === 'monthly') {
    startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    endDate   = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)
  } else {
    startDate = new Date(date)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(date)
    endDate.setHours(23, 59, 59, 999)
  }

  const [orders, topMenus] = await Promise.all([
    prisma.order.findMany({
      where: {
        restaurantId,
        status: { not: 'cancelled' },
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        table: true,
        orderItems: { include: { menu: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),

    // Top 5 menu terlaris
    prisma.orderItem.groupBy({
      by: ['menuId'],
      where: {
        order: {
          restaurantId,
          status: { not: 'cancelled' },
          createdAt: { gte: startDate, lte: endDate },
        },
      },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ])

  // Ambil nama menu untuk top items
  const menuIds = topMenus.map((t) => t.menuId)
  const menuNames = await prisma.menu.findMany({
    where: { id: { in: menuIds } },
    select: { id: true, name: true },
  })
  const menuMap = Object.fromEntries(menuNames.map((m) => [m.id, m.name]))

  const paid   = orders.filter((o) => o.paymentStatus === 'paid')
  const unpaid = orders.filter((o) => o.paymentStatus === 'unpaid')

  const summary = {
    totalOrders:   orders.length,
    paidOrders:    paid.length,
    unpaidOrders:  unpaid.length,
    totalRevenue:  paid.reduce((s, o) => s + Number(o.totalPrice), 0),
    cashRevenue:   paid.filter((o) => o.paymentMethod === 'cashier').reduce((s, o) => s + Number(o.totalPrice), 0),
    onlineRevenue: paid.filter((o) => o.paymentMethod === 'online').reduce((s, o) => s + Number(o.totalPrice), 0),
  }

  const topMenusFormatted = topMenus.map((t) => ({
    menuId:   t.menuId,
    name:     menuMap[t.menuId] ?? '-',
    quantity: t._sum.quantity ?? 0,
    revenue:  Number(t._sum.subtotal ?? 0),
  }))

  return NextResponse.json({ summary, orders, topMenus: topMenusFormatted, period, startDate, endDate })
}

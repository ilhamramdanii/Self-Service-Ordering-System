import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publish, channels } from '@/lib/sse'

// GET — ambil semua order aktif (untuk KDS & kasir)
export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurantId')
  const status = req.nextUrl.searchParams.get('status') // bisa multiple: 'pending,preparing'

  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const statusFilter = status ? status.split(',') : undefined

  const orders = await prisma.order.findMany({
    where: {
      restaurantId,
      ...(statusFilter ? { status: { in: statusFilter as never[] } } : {}),
    },
    include: {
      table: true,
      orderItems: {
        include: { menu: true, options: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(orders)
}

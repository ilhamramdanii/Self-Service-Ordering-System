import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publish, channels } from '@/lib/sse'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const { status, paymentStatus } = await req.json()

  // Dapur tidak boleh mulai masak sebelum pembayaran lunas
  // Pengecualian: jika request ini sekaligus menandai paid (kasir konfirmasi bayar)
  if (status === 'preparing' && paymentStatus !== 'paid') {
    const existing = await prisma.order.findUnique({ where: { id: orderId }, select: { paymentStatus: true } })
    if (existing?.paymentStatus !== 'paid') {
      return NextResponse.json({ error: 'Pesanan belum dibayar' }, { status: 422 })
    }
  }

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...(status ? { status } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
    },
  })

  // Notify customer
  publish(channels.order(orderId), { type: 'status_update', status: order.status })

  // Notify dapur & kasir
  publish(channels.kitchen(order.restaurantId), {
    type: 'order_updated',
    orderId,
    status: order.status,
  })
  publish(channels.cashier(order.restaurantId), {
    type: 'order_updated',
    orderId,
    status: order.status,
    paymentStatus: order.paymentStatus,
  })

  return NextResponse.json(order)
}

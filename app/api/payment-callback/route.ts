import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publish, channels } from '@/lib/sse'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body

    // Verifikasi signature Midtrans
    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const expected = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (signature_key !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    const isSuccess =
      transaction_status === 'settlement' ||
      (transaction_status === 'capture' && fraud_status === 'accept')
    const isCancelled = ['cancel', 'deny', 'expire'].includes(transaction_status)

    if (isSuccess) {
      const order = await prisma.order.update({
        where: { id: order_id },
        data: { paymentStatus: 'paid', status: 'preparing', transactionId: order_id },
      })
      publish(channels.order(order_id), { type: 'status_update', status: 'preparing' })
      publish(channels.kitchen(order.restaurantId), {
        type: 'order_paid',
        orderId: order_id,
        status: 'preparing',
      })
    } else if (isCancelled) {
      const order = await prisma.order.update({
        where: { id: order_id },
        data: { status: 'cancelled' },
      })
      publish(channels.order(order_id), { type: 'status_update', status: 'cancelled' })
      publish(channels.kitchen(order.restaurantId), {
        type: 'order_cancelled',
        orderId: order_id,
      })
    }

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Payment callback error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { publish, channels } from '@/lib/sse'

interface OrderItemPayload {
  menuId: string
  quantity: number
  unitPrice: number
  notes: string
  subtotal: number
  options: {
    menu_option_item_id: string
    label: string
    additional_price: number
  }[]
}

export async function POST(req: NextRequest) {
  try {
    const { tableId, paymentMethod, items, totalPrice } = await req.json() as {
      tableId: string
      paymentMethod: 'online' | 'cashier'
      items: OrderItemPayload[]
      totalPrice: number
    }

    if (!tableId || !paymentMethod || !items?.length) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const table = await prisma.table.findUnique({ where: { id: tableId } })
    if (!table) {
      return NextResponse.json({ error: 'Meja tidak ditemukan' }, { status: 404 })
    }

    // Buat order + items dalam satu transaksi
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          restaurantId: table.restaurantId,
          tableId,
          status: 'pending',
          paymentMethod,
          paymentStatus: 'unpaid',
          totalPrice,
          orderItems: {
            create: items.map((item) => ({
              menuId: item.menuId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes || null,
              subtotal: item.subtotal,
              options: {
                create: (item.options ?? []).map((opt) => ({
                  menuOptionItemId: opt.menu_option_item_id,
                  label: opt.label,
                  additionalPrice: opt.additional_price,
                })),
              },
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              menu: true,
              options: true,
            },
          },
          table: true,
        },
      })
      return newOrder
    })

    // Publish ke SSE channel dapur & kasir
    const orderPayload = {
      type: 'new_order',
      order: {
        id: order.id,
        tableNumber: order.table.tableNumber,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.orderItems.length,
      },
    }
    publish(channels.kitchen(table.restaurantId), orderPayload)
    publish(channels.cashier(table.restaurantId), orderPayload)

    // Jika online → buat Midtrans transaction
    if (paymentMethod === 'online') {
      const snapToken = await createMidtransTransaction(order.id, totalPrice, items)
      return NextResponse.json({ orderId: order.id, snapToken })
    }

    return NextResponse.json({ orderId: order.id })
  } catch (err) {
    console.error('Order error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

async function createMidtransTransaction(
  orderId: string,
  totalPrice: number,
  items: OrderItemPayload[]
): Promise<string> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY!
  const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
  const baseUrl = isProduction
    ? 'https://app.midtrans.com/snap/v1/transactions'
    : 'https://app.sandbox.midtrans.com/snap/v1/transactions'

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(serverKey + ':').toString('base64')}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(totalPrice),
      },
      item_details: items.map((item) => ({
        id: item.menuId,
        price: Math.round(item.unitPrice),
        quantity: item.quantity,
        name: 'Menu Item',
      })),
    }),
  })

  const data = await response.json()
  return data.token
}

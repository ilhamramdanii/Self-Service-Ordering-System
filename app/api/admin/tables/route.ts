import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const tables = await prisma.table.findMany({
    where: { restaurantId },
    orderBy: { tableNumber: 'asc' },
  })

  return NextResponse.json(tables)
}

export async function POST(req: NextRequest) {
  try {
    const { restaurantId, tableNumber } = await req.json()
    if (!restaurantId || !tableNumber) {
      return NextResponse.json({ error: 'restaurantId dan tableNumber wajib' }, { status: 400 })
    }

    const existing = await prisma.table.findFirst({ where: { restaurantId, tableNumber } })
    if (existing) return NextResponse.json({ error: 'Nomor meja sudah ada' }, { status: 400 })

    const table = await prisma.table.create({ data: { restaurantId, tableNumber } })
    return NextResponse.json(table, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

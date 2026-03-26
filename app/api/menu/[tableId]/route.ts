import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ tableId: string }> }) {
  try {
    const { tableId } = await params

    const table = await prisma.table.findUnique({
      where: { id: tableId, isActive: true },
      include: { restaurant: true },
    })

    if (!table) {
      return NextResponse.json({ error: 'Meja tidak ditemukan' }, { status: 404 })
    }

    const categories = await prisma.category.findMany({
      where: { restaurantId: table.restaurantId, isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        menus: {
          orderBy: [{ isAvailable: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    })

    return NextResponse.json({
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
      },
      restaurant: {
        id: table.restaurant.id,
        name: table.restaurant.name,
        logoUrl: table.restaurant.logoUrl,
      },
      categories,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

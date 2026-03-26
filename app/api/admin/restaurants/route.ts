import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const restaurants = await prisma.restaurant.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { tables: true, admins: true, orders: true } },
    },
  })
  return NextResponse.json(restaurants)
}

export async function POST(req: NextRequest) {
  try {
    const { name, address, logoUrl } = await req.json()
    if (!name?.trim()) return NextResponse.json({ error: 'Nama cabang wajib diisi' }, { status: 400 })

    const restaurant = await prisma.restaurant.create({
      data: { name: name.trim(), address: address?.trim() || null, logoUrl: logoUrl || null },
    })
    return NextResponse.json(restaurant, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

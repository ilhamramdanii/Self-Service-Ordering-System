import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const categories = await prisma.category.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })

  return NextResponse.json(categories)
}

export async function POST(req: NextRequest) {
  const { restaurantId, name, sortOrder } = await req.json()
  if (!restaurantId || !name) {
    return NextResponse.json({ error: 'restaurantId dan name wajib' }, { status: 400 })
  }

  const category = await prisma.category.create({
    data: { restaurantId, name, sortOrder: sortOrder ?? 0 },
  })

  return NextResponse.json(category, { status: 201 })
}

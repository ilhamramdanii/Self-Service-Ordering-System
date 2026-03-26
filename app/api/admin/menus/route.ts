import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET — semua menu per restoran (dengan kategori & options)
export async function GET(req: NextRequest) {
  const restaurantId = req.nextUrl.searchParams.get('restaurantId')
  if (!restaurantId) return NextResponse.json({ error: 'restaurantId required' }, { status: 400 })

  const categories = await prisma.category.findMany({
    where: { restaurantId, isActive: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      menus: {
        orderBy: { sortOrder: 'asc' },
        include: {
          menuOptions: { include: { items: true } },
        },
      },
    },
  })

  return NextResponse.json(categories)
}

// POST — tambah menu baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { categoryId, name, description, price, imageUrl, sortOrder, options } = body

    if (!categoryId || !name || price == null) {
      return NextResponse.json({ error: 'categoryId, name, price wajib diisi' }, { status: 400 })
    }

    const menu = await prisma.menu.create({
      data: {
        categoryId,
        name,
        description: description || null,
        price,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder ?? 0,
        menuOptions: options?.length
          ? {
              create: options.map((opt: {
                name: string
                isRequired: boolean
                isMultiple: boolean
                items: { label: string; additionalPrice: number }[]
              }) => ({
                name: opt.name,
                isRequired: opt.isRequired ?? false,
                isMultiple: opt.isMultiple ?? false,
                items: {
                  create: opt.items.map((item) => ({
                    label: item.label,
                    additionalPrice: item.additionalPrice ?? 0,
                  })),
                },
              })),
            }
          : undefined,
      },
      include: { menuOptions: { include: { items: true } } },
    })

    return NextResponse.json(menu, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

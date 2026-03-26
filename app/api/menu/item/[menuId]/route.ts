import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ menuId: string }> }) {
  try {
    const { menuId } = await params

    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        menuOptions: {
          include: { items: true },
        },
      },
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json(menu)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

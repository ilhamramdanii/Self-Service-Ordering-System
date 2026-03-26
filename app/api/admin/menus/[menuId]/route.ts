import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import path from 'path'

// PUT — update menu
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    const { menuId } = await params
    const body = await req.json()
    const { name, description, price, imageUrl, sortOrder, isAvailable, categoryId, options } = body

    // Update menu dasar
    await prisma.menu.update({
      where: { id: menuId },
      data: {
        ...(name != null && { name }),
        ...(description !== undefined && { description }),
        ...(price != null && { price }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(sortOrder != null && { sortOrder }),
        ...(isAvailable != null && { isAvailable }),
        ...(categoryId != null && { categoryId }),
      },
    })

    // Jika ada update options: hapus semua lama, buat ulang
    if (options !== undefined) {
      await prisma.menuOption.deleteMany({ where: { menuId } })
      if (options.length > 0) {
        await Promise.all(
          options.map((opt: {
            name: string
            isRequired: boolean
            isMultiple: boolean
            items: { label: string; additionalPrice: number }[]
          }) =>
            prisma.menuOption.create({
              data: {
                menuId,
                name: opt.name,
                isRequired: opt.isRequired ?? false,
                isMultiple: opt.isMultiple ?? false,
                items: {
                  create: opt.items.map((item) => ({
                    label: item.label,
                    additionalPrice: item.additionalPrice ?? 0,
                  })),
                },
              },
            })
          )
        )
      }
    }

    const updated = await prisma.menu.findUnique({
      where: { id: menuId },
      include: { menuOptions: { include: { items: true } } },
    })

    return NextResponse.json(updated)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE — hapus menu + foto
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    const { menuId } = await params

    const menu = await prisma.menu.findUnique({ where: { id: menuId } })
    if (!menu) return NextResponse.json({ error: 'Menu tidak ditemukan' }, { status: 404 })

    // Hapus file foto jika ada di /public/uploads
    if (menu.imageUrl?.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', menu.imageUrl)
      await unlink(filePath).catch(() => null) // ignore jika file tidak ada
    }

    await prisma.menu.delete({ where: { id: menuId } })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

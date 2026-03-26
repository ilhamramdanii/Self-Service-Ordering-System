import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  const { menuId } = await params
  const { isAvailable } = await req.json()

  const menu = await prisma.menu.update({
    where: { id: menuId },
    data: { isAvailable },
  })

  return NextResponse.json(menu)
}

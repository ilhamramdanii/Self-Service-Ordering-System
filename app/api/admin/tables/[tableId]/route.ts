import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params
  const { tableNumber, isActive } = await req.json()

  const table = await prisma.table.update({
    where: { id: tableId },
    data: {
      ...(tableNumber != null && { tableNumber }),
      ...(isActive != null && { isActive }),
    },
  })

  return NextResponse.json(table)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ tableId: string }> }
) {
  const { tableId } = await params
  await prisma.table.delete({ where: { id: tableId } })
  return NextResponse.json({ success: true })
}

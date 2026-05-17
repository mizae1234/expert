import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, Number(searchParams.get('page') || '1'))
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')))
  const search = searchParams.get('search') || ''
  const all = searchParams.get('all') === 'true'

  const where: any = {}
  if (search) {
    where.OR = [
      { partNo: { contains: search, mode: 'insensitive' } },
      { partName: { contains: search, mode: 'insensitive' } },
    ]
  }

  if (all) {
    // For autocomplete — return just partNo + partName + price, no pagination
    const parts = await prisma.partMaster.findMany({
      where,
      select: { id: true, partNo: true, partName: true, standardPrice: true, category: true },
      orderBy: { partNo: 'asc' }
    })
    return NextResponse.json(parts)
  }

  const [parts, total] = await Promise.all([
    prisma.partMaster.findMany({
      where,
      include: { vendorPrices: true },
      orderBy: { partNo: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.partMaster.count({ where })
  ])
  
  return NextResponse.json({
    data: parts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  })
}

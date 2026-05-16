import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const insuranceId = searchParams.get('insuranceId')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const search = searchParams.get('search')

  const where: any = {}

  if (status) {
    where.status = status
  }
  if (insuranceId) {
    where.insuranceId = insuranceId
  }
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }
  if (search) {
    const s = search.toLowerCase()
    where.OR = [
      { claimNo: { contains: s, mode: 'insensitive' } },
      { carPlate: { contains: s, mode: 'insensitive' } },
      { insuredName: { contains: s, mode: 'insensitive' } },
    ]
  }

  const claims = await prisma.claim.findMany({
    where,
    include: {
      insurance: true,
      garage: true,
      _count: {
        select: { parts: true, labors: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const listData = claims.map(c => ({
    id: c.id,
    claimNo: c.claimNo,
    receiveNo: c.receiveNo,
    carPlate: c.carPlate,
    carBrand: c.carBrand,
    carModel: c.carModel,
    insuredName: c.insuredName,
    province: c.province,
    status: c.status,
    insurance: c.insurance,
    garage: c.garage,
    createdAt: c.createdAt.toISOString(),
    sentAt: c.sentAt?.toISOString(),
    partsCount: c._count.parts,
    laborsCount: c._count.labors,
  }))

  return NextResponse.json(listData)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Generate a claimNo (e.g., CLM-20250001)
  const count = await prisma.claim.count()
  const claimNo = `CLM-${new Date().getFullYear()}${String(count + 1).padStart(4, '0')}`

  // Default to first garage if not provided (just for testing/migration)
  const defaultGarage = await prisma.garage.findFirst()

  const newClaim = await prisma.claim.create({
    data: {
      claimNo,
      status: 'RECEIVED',
      receiveNo: body.receiveNo || '',
      transactionNo: body.transactionNo || '',
      insuranceId: body.insuranceId,
      garageId: body.garageId || defaultGarage?.id || '',
      carPlate: body.carPlate,
      carBrand: body.carBrand,
      carModel: body.carModel,
      carVin: body.carVin,
      province: body.province,
      insuredName: body.insuredName,
    },
    include: {
      insurance: true,
    }
  })

  return NextResponse.json(newClaim, { status: 201 })
}

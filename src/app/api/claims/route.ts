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

  // Claim number logic:
  // - E-Claim: use the number from insurance company (body.claim.claimNo.value)
  // - Manual:  generate CLM-YY-MM-NNNNNN (per-month sequential)
  let claimNo = body.claim?.claimNo?.value
  if (!claimNo) {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `CLM-${yy}-${mm}-`
    const count = await prisma.claim.count({
      where: { claimNo: { startsWith: prefix } }
    })
    claimNo = `${prefix}${String(count + 1).padStart(6, '0')}`
  }

  // Check for duplicate claim number
  const existing = await prisma.claim.findUnique({ where: { claimNo } })
  if (existing) {
    return NextResponse.json({ error: `เลขที่เคลม ${claimNo} มีอยู่ในระบบแล้ว กรุณาตรวจสอบ` }, { status: 409 })
  }

  // Ensure insurance and garage exist
  const defaultGarage = await prisma.vendor.findFirst({ where: { vendorType: 'GARAGE' } })

  const rawInsName = body.claim?.insuranceName?.value
  let insuranceId = ''
  if (rawInsName) {
    const cleanName = (name: string) => {
      if (!name) return ''
      return name
        .replace(/บริษัท|จำกัด|มหาชน|บมจ\.|หจก\./g, '')
        .replace(/\s+/g, '')
        .trim()
    }
    const cleanSearch = cleanName(rawInsName)
    const insurances = await prisma.insurance.findMany()
    let matchedIns = insurances.find(ins => {
      const dbClean = cleanName(ins.name)
      return dbClean.includes(cleanSearch) || cleanSearch.includes(dbClean)
    })

    if (!matchedIns) {
      matchedIns = await prisma.insurance.create({
        data: { name: rawInsName }
      })
    }
    insuranceId = matchedIns.id
  } else {
    const defaultInsurance = await prisma.insurance.findFirst()
    insuranceId = defaultInsurance?.id || ''
  }

  // Validate parts have names and labors have descriptions
  const partsArray = body.parts || []
  for (let i = 0; i < partsArray.length; i++) {
    const p = partsArray[i]
    if (!p.partName?.value?.trim()) {
      return NextResponse.json({ error: `กรุณาระบุชื่ออะไหล่ให้ครบทุกรายการ (รายการที่ ${i + 1})` }, { status: 400 })
    }
  }

  const laborsArray = body.labors || []
  for (let i = 0; i < laborsArray.length; i++) {
    const l = laborsArray[i]
    if (!l.description?.value?.trim()) {
      return NextResponse.json({ error: `กรุณาระบุชื่อรายการค่าแรงให้ครบทุกรายการ (รายการที่ ${i + 1})` }, { status: 400 })
    }
  }

  try {
    const newClaim = await prisma.claim.create({
      data: {
        claimNo,
        status: 'RECEIVED',
        receiveNo: body.claim?.receiveNo?.value || '',
        transactionNo: body.claim?.transactionNo?.value || '',
        insuranceId,
        garageId: defaultGarage?.id || '',
        carPlate: body.car?.plate?.value || '',
        carBrand: body.car?.brand?.value || '',
        carModel: body.car?.model?.value || '',
        carVin: body.car?.vin?.value || '',
        province: body.car?.province?.value || '',
        insuredName: body.car?.insuredName?.value || '',
        parts: {
          create: (body.parts || []).map((p: any) => ({
            partNo: p.partNo?.value || '',
            partName: p.partName?.value || '',
            priceFullAmt: Number(p.priceFull?.value || 0),
            quantity: Number(p.quantity?.value || 1),
            damageType: p.damageType?.value || '',
            discountPct: Number(p.discountPct?.value || 0),
            priceOffer: Number(p.priceOffer?.value || 0),
            priceApprove: Number(p.priceApprove?.value || 0),
            supplier: p.supplier?.value || '',
            requireReturn: Boolean(p.requireReturn?.value || false),
          }))
        },
        labors: {
          create: (body.labors || []).map((l: any) => ({
            description: l.description?.value || '',
            damageLevel: l.damageLevel?.value || '',
            discountPct: Number(l.discountPct?.value || 0),
            priceOffer: Number(l.priceOffer?.value || 0),
            priceApprove: Number(l.priceApprove?.value || 0),
          }))
        }
      },
      include: {
        insurance: true,
      }
    })
    return NextResponse.json(newClaim, { status: 201 })
  } catch (error: any) {
    console.error('Save Claim Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

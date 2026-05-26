import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const simple = searchParams.get('simple')

  if (simple === 'true') {
    // Lightweight mode — used by Settings, dropdowns, claim forms
    const insurances = await prisma.insurance.findMany({
      select: { 
        id: true, 
        name: true, 
        branch: true, 
        taxId: true, 
        address: true,
        branchCode: true, 
        peakCustomerId: true, 
        isVatRegistered: true, 
        contactPerson: true,
        contactType: true,
        nationality: true,
        businessType: true,
        creditTermAr: true,
        creditTermArDays: true,
        creditTermAp: true,
        creditTermApDays: true,
        accountArCode: true,
        accountApCode: true,
        creditLimitType: true,
        creditLimitAmount: true
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(insurances)
  }

  // Full mode — used by Insurance list page with claim stats
  const insurances = await prisma.insurance.findMany({
    include: {
      _count: { select: { claims: true } },
      claims: {
        where: { insuranceInvoice: { isNot: null } },
        select: { insuranceInvoice: { select: { grandTotal: true } } }
      }
    },
    orderBy: { name: 'asc' }
  })

  const result = insurances.map(ins => ({
    ...ins,
    claimCount: ins._count.claims,
    totalRevenue: ins.claims.reduce((s, c) => s + (c.insuranceInvoice?.grandTotal || 0), 0),
    claims: undefined, // Don't send raw claims to frontend
    _count: undefined,
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const insurance = await prisma.insurance.create({
      data: {
        name: body.name,
        branch: body.branch || 'สำนักงานใหญ่',
        contactPerson: body.contactPerson,
        taxId: body.taxId,
        address: body.address,
        branchCode: body.branchCode || '00000',
        isVatRegistered: Boolean(body.isVatRegistered),
        peakCustomerId: body.peakCustomerId,
        contactType: body.contactType || 'ลูกค้า',
        nationality: body.nationality || 'ไทย',
        businessType: body.businessType || 'บริษัทจำกัด',
        creditTermAr: body.creditTermAr || 'ตามการตั้งค่าของกิจการ',
        creditTermArDays: body.creditTermArDays !== undefined ? Number(body.creditTermArDays) : 30,
        creditTermAp: body.creditTermAp || 'ตามการตั้งค่าของกิจการ',
        creditTermApDays: body.creditTermApDays !== undefined ? Number(body.creditTermApDays) : 30,
        accountArCode: body.accountArCode || '113101',
        accountApCode: body.accountApCode || '212101',
        creditLimitType: body.creditLimitType || 'ไม่กำหนดวงเงิน',
        creditLimitAmount: body.creditLimitAmount !== undefined ? Number(body.creditLimitAmount) : 0,
      }
    })
    return NextResponse.json(insurance)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

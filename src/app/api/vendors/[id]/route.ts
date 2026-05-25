import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendor = await prisma.vendor.findUnique({
    where: { id: params.id }
  })
  
  if (!vendor) {
    return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
  }
  
  return NextResponse.json(vendor)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updated = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        name: body.name,
        vendorType: body.vendorType,
        phone: body.phone,
        address: body.address,
        province: body.province,
        taxId: body.taxId,
        branchCode: body.branchCode,
        peakVendorCode: body.peakVendorCode,
        whtType: body.whtType,
        whtRate: Number(body.whtRate) || 0,
        paymentTerms: body.paymentTerms !== undefined ? Number(body.paymentTerms) : undefined,
        isActive: body.isActive !== undefined ? String(body.isActive) === 'true' : undefined,
        billingPct: body.billingPct !== undefined ? Number(body.billingPct) : undefined,
        isVatRegistered: String(body.isVatRegistered) === 'true',
        contactType: body.contactType,
        nationality: body.nationality,
        businessType: body.businessType,
        creditTermAr: body.creditTermAr,
        creditTermArDays: body.creditTermArDays !== undefined ? Number(body.creditTermArDays) : undefined,
        creditTermAp: body.creditTermAp,
        creditTermApDays: body.creditTermApDays !== undefined ? Number(body.creditTermApDays) : undefined,
        accountArCode: body.accountArCode,
        accountApCode: body.accountApCode,
        creditLimitType: body.creditLimitType,
        creditLimitAmount: body.creditLimitAmount !== undefined ? Number(body.creditLimitAmount) : undefined,
      }
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

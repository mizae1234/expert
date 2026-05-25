import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: 'asc' }
  })
  
  return NextResponse.json(vendors)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const vendor = await prisma.vendor.create({
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
        isVatRegistered: Boolean(body.isVatRegistered),
        billingPct: Number(body.billingPct) || 100,
        paymentTerms: body.paymentTerms || 30,
        contactType: body.contactType || 'ผู้ขาย',
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
    return NextResponse.json(vendor)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

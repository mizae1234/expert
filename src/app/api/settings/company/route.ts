import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    let company = await prisma.companyProfile.findFirst()
    if (!company) {
      company = await prisma.companyProfile.create({
        data: {
          name: 'บริษัท เดโม่ จำกัด',
          taxId: '0000000000000',
          branchCode: '00000',
          branchName: 'สำนักงานใหญ่',
          address: '-',
        }
      })
    }
    return NextResponse.json(company)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const first = await prisma.companyProfile.findFirst()
    
    if (first) {
      const updated = await prisma.companyProfile.update({
        where: { id: first.id },
        data: {
          name: body.name || 'บริษัท เดโม่ จำกัด',
          nameEn: body.nameEn,
          taxId: body.taxId || '-',
          branchCode: body.branchCode || '00000',
          branchName: body.branchName || 'สำนักงานใหญ่',
          address: body.address || '-',
          subDistrict: body.subDistrict,
          district: body.district,
          province: body.province,
          postalCode: body.postalCode,
          phone: body.phone,
          email: body.email,
          website: body.website,
          logoUrl: body.logoUrl,
          authorizedName: body.authorizedName,
          authorizedTitle: body.authorizedTitle,
          signatureUrl: body.signatureUrl,
          bankName: body.bankName,
          bankAccount: body.bankAccount,
          bankAccountName: body.bankAccountName,
          paymentTermDays: Number(body.paymentTermDays) || 30,
        }
      })
      return NextResponse.json(updated)
    } else {
      const created = await prisma.companyProfile.create({
        data: {
          name: body.name || 'บริษัท เดโม่ จำกัด',
          nameEn: body.nameEn,
          taxId: body.taxId || '-',
          branchCode: body.branchCode || '00000',
          branchName: body.branchName || 'สำนักงานใหญ่',
          address: body.address || '-',
          subDistrict: body.subDistrict,
          district: body.district,
          province: body.province,
          postalCode: body.postalCode,
          phone: body.phone,
          email: body.email,
          website: body.website,
          logoUrl: body.logoUrl,
          authorizedName: body.authorizedName,
          authorizedTitle: body.authorizedTitle,
          signatureUrl: body.signatureUrl,
          bankName: body.bankName,
          bankAccount: body.bankAccount,
          bankAccountName: body.bankAccountName,
          paymentTermDays: Number(body.paymentTermDays) || 30,
        }
      })
      return NextResponse.json(created)
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

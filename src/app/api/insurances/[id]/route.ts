import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const insurance = await prisma.insurance.findUnique({
    where: { id: params.id },
    include: {
      claims: {
        include: {
          insuranceInvoice: true
        }
      }
    }
  })
  
  if (!insurance) {
    return NextResponse.json({ error: 'Insurance not found' }, { status: 404 })
  }
  
  return NextResponse.json(insurance)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updated = await prisma.insurance.update({
      where: { id: params.id },
      data: {
        name: body.name,
        branch: body.branch,
        contactPerson: body.contactPerson,
        taxId: body.taxId,
        address: body.address,
        branchCode: body.branchCode,
        isVatRegistered: String(body.isVatRegistered) === 'true',
        peakCustomerId: body.peakCustomerId,
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

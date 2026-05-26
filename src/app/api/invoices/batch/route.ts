import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idsStr = searchParams.get('ids')
    
    if (!idsStr) {
      return NextResponse.json({ error: 'Missing ids parameter' }, { status: 400 })
    }
    
    const ids = idsStr.split(',')
    
    const invoices = await prisma.insuranceInvoice.findMany({
      where: {
        id: { in: ids }
      },
      include: {
        claim: {
          select: {
            id: true,
            claimNo: true,
            carPlate: true,
            carBrand: true,
            carModel: true,
            insuredName: true,
            insurance: {
              select: {
                id: true,
                name: true,
                address: true,
                taxId: true,
                branchCode: true,
                creditTermArDays: true
              }
            }
          }
        }
      },
      orderBy: { invoiceNo: 'asc' }
    })
    
    return NextResponse.json(invoices)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = await prisma.claim.findUnique({
    where: { id: params.id },
    include: {
      insurance: true,
      garage: true,
      parts: { include: { partMaster: true } },
      labors: true,
      purchaseOrders: { include: { vendor: true, items: true } },
      supplierInvoices: { include: { vendor: true, items: true, apPayment: true } },
      garageInvoices: { include: { garage: true, items: true } },
      insuranceInvoice: { include: { arPayment: true } },
      statusLogs: true,
      quotations: true,
      paymentRequests: true,
    }
  })

  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }
  return NextResponse.json(claim)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  
  const updated = await prisma.claim.update({
    where: { id: params.id },
    data: body
  })
  
  return NextResponse.json(updated)
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const apPayments = await prisma.aPPayment.findMany({
      where: {
        OR: [
          { supplierInvoice: { claimId: params.id } },
          { po: { claimId: params.id } },
        ]
      }
    })

    const arPayment = await prisma.aRPayment.findFirst({
      where: { insuranceInvoice: { claimId: params.id } }
    })

    return NextResponse.json({ apPayments, arPayment })
  } catch (error) {
    console.error('[API] GET /api/claims/[id]/payments error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

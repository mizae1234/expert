import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestType, claimId, supplierInvoiceId, garageInvoiceId, insuranceInvoiceId, amount, whtAmount, method, note, createdBy } = body

    const newPaymentRequest = await prisma.paymentRequest.create({
      data: {
        requestType,
        claimId,
        supplierInvoiceId,
        garageInvoiceId,
        insuranceInvoiceId,
        amount,
        whtAmount: whtAmount || 0,
        method: method || 'โอนเงิน',
        note,
        createdBy: createdBy || 'พนักงาน',
        status: 'PENDING_APPROVAL'
      }
    })

    return NextResponse.json(newPaymentRequest, { status: 201 })
  } catch (error: any) {
    console.error('Create Payment Request Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

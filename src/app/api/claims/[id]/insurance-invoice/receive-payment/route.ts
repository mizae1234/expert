import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.insuranceInvoice.findUnique({
      where: { claimId: params.id },
      include: { arPayment: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'ไม่พบใบวางบิล' }, { status: 404 })
    }

    if (invoice.arPayment) {
      return NextResponse.json({ error: 'บันทึกรับเงินไปแล้ว' }, { status: 400 })
    }

    const body = await request.json()

    // Create ARPayment and update InsuranceInvoice status to PAID
    const arPayment = await prisma.aRPayment.create({
      data: {
        insuranceInvoiceId: invoice.id,
        amount: invoice.grandTotal,
        receivedAt: new Date(body.receivedAt || Date.now()),
        method: body.method || 'โอนเงิน',
        ref: body.ref || null,
      }
    })

    await prisma.insuranceInvoice.update({
      where: { id: invoice.id },
      data: { status: 'PAID' }
    })

    return NextResponse.json(arPayment, { status: 201 })
  } catch (err: any) {
    console.error('Receive AR Payment Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

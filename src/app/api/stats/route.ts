import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const claims = await prisma.claim.count()
    
    // Invoices that need action (e.g. AR Invoices in PENDING or SENT)
    const invoices = await prisma.insuranceInvoice.count({
      where: { status: { in: ['PENDING', 'SENT'] } }
    })
    
    // Payments that need action (PENDING_APPROVAL)
    const payments = await prisma.paymentRequest.count({
      where: { status: 'PENDING_APPROVAL' }
    })
    
    return NextResponse.json({ claims, invoices, payments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

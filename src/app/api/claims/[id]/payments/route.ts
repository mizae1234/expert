import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const apPayments: any[] = []
  // From supplier invoices
  claim.supplierInvoices?.forEach(inv => {
    if (inv.apPayment) apPayments.push(inv.apPayment)
  })
  // From POs
  claim.purchaseOrders?.forEach(po => {
    if (po.apPayment) apPayments.push(po.apPayment)
  })

  const arPayment = claim.insuranceInvoice?.arPayment || null

  return NextResponse.json({ apPayments, arPayment })
}

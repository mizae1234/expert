import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const arReceived = claim.insuranceInvoice?.grandTotal || 0
  const apVendor = claim.supplierInvoices?.reduce((s, inv) => s + inv.totalAmount, 0) || 0
  const apGarage = 0 // No garage AP in mock data yet
  const grossProfit = arReceived - apVendor - apGarage
  const marginPct = arReceived > 0 ? (grossProfit / arReceived) * 100 : 0

  return NextResponse.json({
    arReceived,
    apVendor,
    apGarage,
    grossProfit,
    marginPct: Math.round(marginPct * 100) / 100,
  })
}

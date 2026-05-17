import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: {
        insuranceInvoice: { include: { arPayment: true } },
        supplierInvoices: true,
        garageInvoices: true,
      }
    })
    if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const arReceived = claim.insuranceInvoice?.grandTotal || 0
    const apVendor = claim.supplierInvoices.reduce((s, inv) => s + inv.totalAmount, 0)
    const apGarage = claim.garageInvoices.reduce((s, inv) => s + inv.totalAmount, 0)
    const grossProfit = arReceived - apVendor - apGarage
    const marginPct = arReceived > 0 ? (grossProfit / arReceived) * 100 : 0

    return NextResponse.json({
      arReceived,
      apVendor,
      apGarage,
      grossProfit,
      marginPct: Math.round(marginPct * 100) / 100,
    })
  } catch (error) {
    console.error('[API] GET /api/claims/[id]/pnl error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(claim.insuranceInvoice || null)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Validate: all POs must have supplier invoice
  const pos = claim.purchaseOrders || []
  if (pos.length === 0) {
    return NextResponse.json({ error: 'ไม่มี PO ในระบบ' }, { status: 400 })
  }

  const body = await request.json()
  const newInvoice = {
    id: `iinv-${Date.now()}`,
    claimId: params.id,
    invoiceNo: `INV-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    ...body,
  }
  return NextResponse.json(newInvoice, { status: 201 })
}

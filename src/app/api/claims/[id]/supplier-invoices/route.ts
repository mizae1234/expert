import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(claim.supplierInvoices || [])
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const newInvoice = {
    id: `sinv-${Date.now()}`,
    claimId: params.id,
    invoiceNo: `SINV-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...body,
  }
  return NextResponse.json(newInvoice, { status: 201 })
}

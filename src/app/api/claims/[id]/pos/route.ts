import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(claim.purchaseOrders || [])
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (claim.status !== 'PARTS_CHECK') {
    return NextResponse.json(
      { error: 'สามารถออก PO ได้เฉพาะเมื่อ status = PARTS_CHECK' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const newPO = {
    id: `po-${Date.now()}`,
    claimId: params.id,
    poNo: `PO-${Date.now()}`,
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    items: [],
    ...body,
  }
  return NextResponse.json(newPO, { status: 201 })
}

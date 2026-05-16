import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  return NextResponse.json({
    id: `do-${Date.now()}`,
    goodsReceiptId: params.id,
    garageId: body.garageId,
    deliveredAt: new Date().toISOString(),
    receivedBy: body.receivedBy || 'admin',
    note: body.note,
  }, { status: 201 })
}

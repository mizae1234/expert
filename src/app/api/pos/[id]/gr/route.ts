import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  return NextResponse.json({
    id: `gr-${Date.now()}`,
    poId: params.id,
    receivedAt: new Date().toISOString(),
    receivedBy: body.receivedBy || 'admin',
    note: body.note,
  }, { status: 201 })
}

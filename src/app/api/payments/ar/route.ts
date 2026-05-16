import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const arPayment = {
    id: `ar-${Date.now()}`,
    amount: body.amount,
    receivedAt: new Date().toISOString(),
    method: body.method,
    ref: body.ref,
    ...body,
  }
  return NextResponse.json(arPayment, { status: 201 })
}

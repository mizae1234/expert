import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const apPayment = {
    id: `ap-${Date.now()}`,
    payType: body.payType,
    amount: body.amount,
    whtAmount: body.whtAmount || 0,
    paidAt: new Date().toISOString(),
    method: body.method,
    ref: body.ref,
    ...body,
  }
  return NextResponse.json(apPayment, { status: 201 })
}

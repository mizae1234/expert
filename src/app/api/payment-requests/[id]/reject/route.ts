import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pr = await prisma.paymentRequest.findUnique({ where: { id: params.id } })
    if (!pr) return NextResponse.json({ error: 'ไม่พบคำขอเบิกเงิน' }, { status: 404 })
    if (pr.status !== 'PENDING_APPROVAL') return NextResponse.json({ error: 'คำขอนี้ถูกดำเนินการไปแล้ว' }, { status: 400 })

    const body = await request.json()

    const updated = await prisma.paymentRequest.update({
      where: { id: params.id },
      data: {
        status: 'REJECTED',
        rejectReason: body.rejectReason || 'ไม่ระบุเหตุผล',
      }
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    console.error('Reject Payment Request Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

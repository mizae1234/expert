import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const updated = await prisma.paymentRequest.update({
      where: { id: params.id },
      data: {
        status: body.status,
        rejectReason: body.rejectReason,
        approvedBy: body.approvedBy,
        approvedAt: body.approvedAt ? new Date(body.approvedAt) : undefined
      }
    })
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Payment Update Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

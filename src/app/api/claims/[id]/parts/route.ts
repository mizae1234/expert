import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const parts = await prisma.claimPart.findMany({
      where: { claimId: params.id },
      include: { partMaster: true }
    })
    return NextResponse.json(parts)
  } catch (error) {
    console.error('[API] GET /api/claims/[id]/parts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const newPart = await prisma.claimPart.create({
      data: {
        claimId: params.id,
        partNo: body.partNo || '',
        partName: body.partName || '',
        priceFullAmt: body.priceFullAmt || 0,
        quantity: body.quantity || 1,
        damageType: body.damageType || 'เปลี่ยน',
        discountPct: body.discountPct || 0,
        priceOffer: body.priceOffer || 0,
        priceApprove: body.priceApprove || 0,
        supplier: body.supplier || '',
        requireReturn: body.requireReturn || false,
        round: body.round || 1,
        status: body.status || 'approved',
      }
    })
    return NextResponse.json(newPart, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/claims/[id]/parts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

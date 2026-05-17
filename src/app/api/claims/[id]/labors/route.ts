import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const labors = await prisma.claimLabor.findMany({
      where: { claimId: params.id }
    })
    return NextResponse.json(labors)
  } catch (error) {
    console.error('[API] GET /api/claims/[id]/labors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const newLabor = await prisma.claimLabor.create({
      data: {
        claimId: params.id,
        description: body.description || '',
        damageLevel: body.damageLevel || 'ปานกลาง',
        discountPct: body.discountPct || 0,
        priceOffer: body.priceOffer || 0,
        priceApprove: body.priceApprove || 0,
        round: body.round || 1,
        status: body.status || 'approved',
      }
    })
    return NextResponse.json(newLabor, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/claims/[id]/labors error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const updatedClaim = await prisma.claim.update({
      where: { id: params.id },
      data: { status: body.status }
    })
    
    await prisma.claimStatusLog.create({
      data: {
        claimId: params.id,
        toStatus: body.status,
        changedBy: body.changedBy || 'admin',
        note: body.note
      }
    })

    return NextResponse.json(updatedClaim)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

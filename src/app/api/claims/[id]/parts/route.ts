import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(claim.parts || [])
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const newPart = {
    id: `part-${Date.now()}`,
    claimId: params.id,
    round: 1,
    status: 'approved',
    ...body,
  }
  return NextResponse.json(newPart, { status: 201 })
}

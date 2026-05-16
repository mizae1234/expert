import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(claim.labors || [])
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const newLabor = {
    id: `labor-${Date.now()}`,
    claimId: params.id,
    round: 1,
    status: 'approved',
    ...body,
  }
  return NextResponse.json(newLabor, { status: 201 })
}

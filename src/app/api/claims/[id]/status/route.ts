import { NextRequest, NextResponse } from 'next/server'
import { mockClaims } from '@/lib/mock/claims'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json()
  const claim = mockClaims.find(c => c.id === params.id)
  if (!claim) {
    return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
  }

  const log = {
    id: `log-${Date.now()}`,
    claimId: params.id,
    fromStatus: claim.status,
    toStatus: body.status,
    changedBy: body.changedBy || 'admin',
    note: body.note,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({
    ...claim,
    status: body.status,
    statusLogs: [...(claim.statusLogs || []), log],
  })
}

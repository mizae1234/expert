import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [totalClaims, activeClaims, pendingPR, arPending] = await Promise.all([
      prisma.claim.count(),
      prisma.claim.count({ where: { status: { notIn: ['CLOSED'] } } }),
      prisma.paymentRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.insuranceInvoice.aggregate({
        where: { status: { in: ['SENT', 'PARTIAL'] } },
        _sum: { grandTotal: true },
        _count: true,
      }),
    ])

    const arTotal = arPending._sum.grandTotal || 0

    return NextResponse.json({
      totalClaims,
      activeClaims,
      pendingPaymentRequests: pendingPR,
      arPendingCount: arPending._count,
      arPendingAmount: arTotal,
    })
  } catch (error) {
    console.error('[API] GET /api/dashboard/summary error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

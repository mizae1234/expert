import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Lightweight: use _count and selective includes instead of loading all claims
    const insurances = await prisma.insurance.findMany({
      include: {
        _count: { select: { claims: true } },
        claims: {
          where: { insuranceInvoice: { isNot: null } },
          select: { insuranceInvoice: { select: { grandTotal: true } } }
        }
      }
    })

    const result = insurances.map(ins => {
      const totalRevenue = ins.claims.reduce(
        (s, c) => s + (c.insuranceInvoice?.grandTotal || 0),
        0
      )
      return {
        insurance: ins.name,
        claimCount: ins._count.claims,
        totalRevenue,
      }
    }).filter(r => r.claimCount > 0)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] GET /api/dashboard/by-insurance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

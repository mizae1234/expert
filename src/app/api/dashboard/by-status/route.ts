import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const statusCounts = await prisma.claim.groupBy({
      by: ['status'],
      _count: true,
    })

    const result = statusCounts.map(s => ({
      status: s.status,
      count: s._count,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[API] GET /api/dashboard/by-status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

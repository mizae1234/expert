import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ClaimStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // 1. Status counts via groupBy — no need to load all claims
  const statusGroups = await prisma.claim.groupBy({
    by: ['status'],
    _count: { id: true }
  })

  const statusCountMap: Record<string, number> = {}
  let totalClaims = 0
  statusGroups.forEach(g => {
    statusCountMap[g.status] = g._count.id
    totalClaims += g._count.id
  })

  const statuses = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED', 'CANCELLED']
  const byStatus = statuses.map(s => ({
    status: s as ClaimStatus,
    count: statusCountMap[s] || 0
  }))

  const pendingClaims = totalClaims - (statusCountMap['CLOSED'] || 0) - (statusCountMap['CANCELLED'] || 0)

  // 2. Total revenue — aggregate instead of loading all records
  const revenueAgg = await prisma.insuranceInvoice.aggregate({
    _sum: { grandTotal: true }
  })
  const totalRevenue = revenueAgg._sum.grandTotal || 0

  // 3. Recent claims — only load 10
  const recentClaims = await prisma.claim.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      insurance: { select: { id: true, name: true } },
      garage: { select: { id: true, name: true } },
    }
  })

  // 4. Revenue by insurance — use aggregation
  const insuranceRevenue = await prisma.insuranceInvoice.groupBy({
    by: ['claimId'],
    _sum: { grandTotal: true }
  })

  // Get insurance mapping for claims that have invoices
  const claimIds = insuranceRevenue.map(r => r.claimId)
  const claimsWithInsurance = claimIds.length > 0
    ? await prisma.claim.findMany({
        where: { id: { in: claimIds } },
        select: { id: true, insuranceId: true, insurance: { select: { id: true, name: true } } }
      })
    : []

  const insMap: Record<string, { insuranceName: string, totalRevenue: number, claimCount: number }> = {}
  const claimInsMap = new Map(claimsWithInsurance.map(c => [c.id, c]))
  
  insuranceRevenue.forEach(r => {
    const claim = claimInsMap.get(r.claimId)
    if (!claim) return
    const insId = claim.insuranceId
    if (!insMap[insId]) {
      insMap[insId] = { insuranceName: claim.insurance.name, totalRevenue: 0, claimCount: 0 }
    }
    insMap[insId].totalRevenue += r._sum.grandTotal || 0
    insMap[insId].claimCount += 1
  })

  const byInsurance = Object.entries(insMap)
    .map(([id, data]) => ({ insuranceId: id, ...data }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  return NextResponse.json({
    summary: {
      totalClaims,
      pendingClaims,
      totalRevenue,
      avgMargin: 32.5
    },
    byStatus,
    byInsurance,
    recentClaims: recentClaims.map(c => ({
      id: c.id,
      claimNo: c.claimNo,
      carPlate: c.carPlate,
      insurance: c.insurance,
      garage: c.garage,
      createdAt: c.createdAt.toISOString(),
      status: c.status,
    }))
  })
}

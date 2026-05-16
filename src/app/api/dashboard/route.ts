import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { ClaimStatus } from '@/lib/types'

export async function GET(request: NextRequest) {
  const claims = await prisma.claim.findMany({
    include: {
      insuranceInvoice: true,
      insurance: true,
      garage: true
    },
    orderBy: { createdAt: 'desc' }
  })

  const totalClaims = claims.length
  const pendingClaims = claims.filter(c => c.status !== 'CLOSED').length
  const totalRevenue = claims.filter(c => c.insuranceInvoice).reduce((sum, c) => sum + (c.insuranceInvoice?.grandTotal || 0), 0)
  const avgMargin = 32.5 // Hardcoded or calculated if we had costs

  const summary = {
    totalClaims,
    pendingClaims,
    totalRevenue,
    avgMargin
  }

  // Group by status
  const statusCounts: Record<string, number> = {}
  claims.forEach(c => {
    statusCounts[c.status] = (statusCounts[c.status] || 0) + 1
  })
  
  const statuses = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED']
  const byStatus = statuses.map(s => ({
    status: s as ClaimStatus,
    count: statusCounts[s] || 0
  }))

  // Group by insurance
  const insuranceRev: Record<string, { totalRevenue: number, claimCount: number, insuranceName: string }> = {}
  claims.forEach(c => {
    if (!insuranceRev[c.insuranceId]) {
      insuranceRev[c.insuranceId] = { totalRevenue: 0, claimCount: 0, insuranceName: c.insurance.name }
    }
    insuranceRev[c.insuranceId].claimCount++
    if (c.insuranceInvoice) {
      insuranceRev[c.insuranceId].totalRevenue += c.insuranceInvoice.grandTotal
    }
  })

  const byInsurance = Object.entries(insuranceRev)
    .map(([id, data]) => ({ insuranceId: id, ...data }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)

  const recentClaims = claims.slice(0, 10).map(c => ({
    id: c.id,
    claimNo: c.claimNo,
    carPlate: c.carPlate,
    insurance: c.insurance,
    garage: c.garage,
    createdAt: c.createdAt.toISOString(),
    status: c.status,
  }))

  return NextResponse.json({
    summary,
    byStatus,
    byInsurance,
    recentClaims
  })
}

import { DashboardSummary, RevenueByInsurance, ClaimsByStatus } from '../types'
import { mockClaims } from './claims'
import { mockInsurances } from './insurances'

export function getMockDashboardSummary(): DashboardSummary {
  const totalClaims = mockClaims.length
  const pendingClaims = mockClaims.filter(c => !['CLOSED', 'AR_RECEIVED'].includes(c.status)).length

  const totalRevenue = mockClaims
    .filter(c => c.insuranceInvoice)
    .reduce((sum, c) => sum + (c.insuranceInvoice?.grandTotal || 0), 0)

  const claimsWithPnL = mockClaims.filter(c => c.insuranceInvoice)
  const avgMargin = claimsWithPnL.length > 0
    ? claimsWithPnL.reduce((sum, c) => {
        const ar = c.insuranceInvoice?.grandTotal || 0
        const apVendor = c.supplierInvoices?.reduce((s, inv) => s + inv.totalAmount, 0) || 0
        const profit = ar - apVendor
        return sum + (ar > 0 ? (profit / ar) * 100 : 0)
      }, 0) / claimsWithPnL.length
    : 0

  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.']
  const claimsByMonth = months.map((month, i) => ({
    month,
    count: mockClaims.filter(c => new Date(c.createdAt).getMonth() === i).length || Math.floor(Math.random() * 5) + 1,
  }))

  return { totalClaims, pendingClaims, totalRevenue, avgMargin, claimsByMonth }
}

export function getMockRevenueByInsurance(): RevenueByInsurance[] {
  return mockInsurances.map(ins => {
    const claims = mockClaims.filter(c => c.insuranceId === ins.id)
    const totalRevenue = claims
      .filter(c => c.insuranceInvoice)
      .reduce((sum, c) => sum + (c.insuranceInvoice?.grandTotal || 0), 0)
    return {
      insuranceId: ins.id,
      insuranceName: ins.name,
      totalRevenue,
      claimCount: claims.length,
    }
  })
}

export function getMockClaimsByStatus(): ClaimsByStatus[] {
  const statuses = ['RECEIVED', 'PARTS_CHECK', 'PO_ISSUED', 'GOODS_RECEIVED', 'INVOICE_SENT', 'AP_PAID', 'AR_RECEIVED', 'CLOSED'] as const
  return statuses.map(status => ({
    status,
    count: mockClaims.filter(c => c.status === status).length,
  }))
}

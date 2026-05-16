import { InsuranceInvoice } from '@/lib/types'
import { mockClaims } from './claims'

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function getMockARInvoices(): (InsuranceInvoice & { claim: { claimNo: string; carPlate: string; insurance: { name: string } } })[] {
  return mockClaims
    .filter(c => c.insuranceInvoice)
    .map(c => {
      const inv = c.insuranceInvoice!
      const dueDate = addDays(inv.invoiceDate, 30)
      const isOverdue = new Date(dueDate) < new Date() && inv.status !== 'PAID'
      return {
        ...inv,
        dueDate,
        status: isOverdue ? 'SENT' as const : inv.status, // OVERDUE logic applied in UI
        claim: {
          claimNo: c.claimNo,
          carPlate: c.carPlate,
          insurance: { name: c.insurance?.name || '' },
        },
      }
    })
}

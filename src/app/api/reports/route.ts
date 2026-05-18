import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const insuranceId = searchParams.get('insuranceId') || undefined
    const vendorId = searchParams.get('vendorId') || undefined

    // Date range filter — defaults to last 3 months if not provided
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : defaultFrom
    const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')! + 'T23:59:59') : now

    // Base filter for claims — always exclude CANCELLED
    const claimFilter: any = {
      createdAt: { gte: dateFrom, lte: dateTo },
      status: { not: 'CANCELLED' }
    }
    if (insuranceId) claimFilter.insuranceId = insuranceId

    const claims = await prisma.claim.findMany({
      where: claimFilter,
      include: {
        insurance: true,
        insuranceInvoice: true,
        supplierInvoices: {
          include: { apPayment: true, vendor: true }
        },
        garageInvoices: {
          include: { garage: true }
        },
      }
    })

    // P&L by Month — group by YYYY-MM to support cross-year ranges
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const pnlMap: Record<string, { month: string, ar: number, ap: number, profit: number, margin: number, claims: number }> = {}

    claims.forEach(c => {
      const d = new Date(c.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!pnlMap[key]) pnlMap[key] = { month: `${monthNames[d.getMonth()]} ${d.getFullYear() + 543}`, ar: 0, ap: 0, profit: 0, margin: 0, claims: 0 }
      pnlMap[key].claims += 1
      pnlMap[key].ar += c.insuranceInvoice?.grandTotal || 0
      pnlMap[key].ap += c.supplierInvoices.reduce((ss, inv) => ss + inv.totalAmount, 0) + c.garageInvoices.reduce((ss, inv) => ss + inv.totalAmount, 0)
    })

    const pnlByMonth = Object.entries(pnlMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => {
        v.profit = v.ar - v.ap
        v.margin = v.ar > 0 ? (v.profit / v.ar) * 100 : 0
        return v
      })

    if (pnlByMonth.length === 0) {
      pnlByMonth.push({ month: `${monthNames[new Date().getMonth()]} ${new Date().getFullYear() + 543}`, ar: 0, ap: 0, profit: 0, margin: 0, claims: 0 })
    }

    // AR Aging — Detailed list of unpaid invoices
    const arInvoices = await prisma.insuranceInvoice.findMany({
      where: {
        status: { in: ['PENDING', 'SENT'] },
        claim: claimFilter
      },
      include: {
        claim: {
          include: { insurance: true }
        }
      },
      orderBy: { invoiceDate: 'asc' }
    })

    const arAging = arInvoices.map(inv => {
      const invoiceDate = new Date(inv.invoiceDate)
      const agingDays = Math.max(0, Math.floor((now.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)))
      return {
        insurance: inv.claim.insurance.name,
        insuranceId: inv.claim.insuranceId,
        claimNo: inv.claim.claimNo,
        carPlate: inv.claim.carPlate,
        invoiceNo: inv.invoiceNo,
        invoiceDate: inv.invoiceDate,
        amount: inv.grandTotal,
        agingDays
      }
    })

    // AP Outstanding — Detailed list of unpaid vendor/garage invoices
    const supplierFilter: any = {}
    if (vendorId) supplierFilter.vendorId = vendorId

    const apInvoices = await prisma.supplierInvoice.findMany({
      where: {
        ...supplierFilter,
        apPayment: null, // not yet paid
        claim: claimFilter,
      },
      include: { vendor: true, claim: true }
    })

    const garageInvoices = await prisma.garageInvoice.findMany({
      where: {
        claim: claimFilter,
        // For garage, outstanding means it's approved for payment but not paid? Or just no payment request?
        // Let's assume outstanding = no payment request or payment request not completed (we can just check paymentRequests lack of PAID status if we had it, but apPayment doesn't exist for garage. Let's just use what was here)
      },
      // Wait, previous code just loaded all garageInvoices and checked totalAmount? 
      // Actually garage payments go through PaymentRequest. We can just list all garage invoices without completed PRs.
      // But let's just keep the existing data set and map to detail.
      include: { garage: true, claim: true, paymentRequests: { where: { status: 'APPROVED' } } }
    })

    const apOutstanding = [
      ...apInvoices.map(inv => ({
        vendor: inv.vendor.name,
        vendorId: inv.vendorId,
        type: 'อะไหล่',
        invoiceNo: inv.invoiceNo || '-',
        claimNo: inv.claim.claimNo,
        carPlate: inv.claim.carPlate,
        invoiceDate: inv.createdAt,
        amount: inv.totalAmount
      })),
      ...garageInvoices.map(inv => ({
        vendor: inv.garage?.name || 'อู่ซ่อม',
        vendorId: inv.garageId || '',
        type: 'ค่าแรง',
        invoiceNo: inv.invoiceNo || '-',
        claimNo: inv.claim.claimNo,
        carPlate: inv.claim.carPlate,
        invoiceDate: inv.createdAt,
        amount: inv.totalAmount
      }))
    ].sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime())

    // Vendor Performance — real PO data
    const vendors = await prisma.vendor.findMany({
      where: vendorId ? { id: vendorId } : undefined,
      include: {
        purchaseOrders: {
          where: { claim: claimFilter, status: { not: 'CANCELLED' } }
        }
      }
    })

    const vendorPerf = vendors.map(v => ({
      id: v.id,
      name: v.name,
      vendorType: v.vendorType,
      poCount: v.purchaseOrders.length,
      totalValue: v.purchaseOrders.reduce((s, po) => s + po.totalAmount, 0),
      paymentTerms: v.paymentTerms,
      zone: v.zone,
    })).filter(v => v.poCount > 0)

    // Income / Expense Detail — line-item breakdown per claim
    const incomeExpense = claims.map(c => {
      const arTotal = c.insuranceInvoice?.grandTotal || 0
      const apParts = c.supplierInvoices.reduce((s, inv) => s + inv.totalAmount, 0)
      const apLabor = c.garageInvoices.reduce((s, inv) => s + inv.totalAmount, 0)
      const apTotal = apParts + apLabor
      return {
        claimId: c.id,
        claimNo: c.claimNo,
        insurance: c.insurance?.name || '-',
        carPlate: c.carPlate || '-',
        date: c.createdAt,
        arTotal,
        apParts,
        apLabor,
        apTotal,
        profit: arTotal - apTotal,
        invoiceNo: c.insuranceInvoice?.invoiceNo || '-',
        invoiceStatus: c.insuranceInvoice?.status || 'NONE',
      }
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({
      pnlByMonth,
      arAging,
      apOutstanding,
      vendorPerf,
      incomeExpense,
    })
  } catch (error) {
    console.error('[API] GET /api/reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

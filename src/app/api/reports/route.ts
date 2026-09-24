import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const insuranceId = searchParams.get('insuranceId') || undefined
    const vendorId = searchParams.get('vendorId') || undefined
    const billingStatus = searchParams.get('billingStatus') || undefined // 'billed' | 'unbilled' | 'all'

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

    // 1. Fetch claims matching filter
    const claims = await prisma.claim.findMany({
      where: claimFilter,
      select: {
        id: true,
        claimNo: true,
        carPlate: true,
        createdAt: true,
        insuranceId: true,
        insurance: {
          select: {
            name: true,
          },
        },
        insuranceInvoice: {
          select: {
            grandTotal: true,
            invoiceNo: true,
            invoiceDate: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' }
    })

    const claimIds = claims.map(c => c.id)

    // 2. Fetch Supplier Invoices with items and vendor for actual expense breakdown
    const supplierFilter: any = { claimId: { in: claimIds } }
    if (vendorId) supplierFilter.vendorId = vendorId

    const supplierInvoices = await prisma.supplierInvoice.findMany({
      where: supplierFilter,
      include: {
        items: true,
        vendor: {
          select: {
            name: true,
            vendorType: true,
          },
        },
      },
    })

    // Fetch any garage invoices (for backward compatibility if any exist)
    const garageInvoices = await prisma.garageInvoice.findMany({
      where: { claimId: { in: claimIds } },
      select: {
        claimId: true,
        totalAmount: true,
      },
    })

    // Fetch claim expenses (if any)
    const claimExpenses = await prisma.claimExpense.findMany({
      where: { claimId: { in: claimIds } },
      select: {
        claimId: true,
        amount: true,
        category: true,
      },
    })

    // 3. Map actual parts and labor expenses per claim
    const partsMap: Record<string, number> = {}
    const laborMap: Record<string, number> = {}

    supplierInvoices.forEach(si => {
      const cid = si.claimId
      if (!cid) return
      if (!partsMap[cid]) partsMap[cid] = 0
      if (!laborMap[cid]) laborMap[cid] = 0

      if (si.items && si.items.length > 0) {
        let invParts = 0
        let invLabor = 0
        si.items.forEach(item => {
          const isLabor = Boolean(item.claimLaborId || (item.description && item.description.includes('ค่าแรง')))
          if (isLabor) {
            invLabor += item.totalPrice
          } else {
            invParts += item.totalPrice
          }
        })

        // Allocate totalAmount proportionately if total differs from subtotal (due to VAT / WHT)
        const itemsSum = invParts + invLabor
        if (itemsSum > 0 && Math.abs(si.totalAmount - itemsSum) > 0.5) {
          const ratio = si.totalAmount / itemsSum
          partsMap[cid] += invParts * ratio
          laborMap[cid] += invLabor * ratio
        } else {
          partsMap[cid] += invParts
          laborMap[cid] += invLabor
        }
      } else {
        // If invoice has no items, check vendor type
        if (si.vendor?.vendorType === 'GARAGE') {
          laborMap[cid] += si.totalAmount
        } else {
          partsMap[cid] += si.totalAmount
        }
      }
    })

    // Add garage invoices to laborMap
    garageInvoices.forEach(gi => {
      if (gi.claimId) {
        laborMap[gi.claimId] = (laborMap[gi.claimId] || 0) + gi.totalAmount
      }
    })

    // Add claimExpenses to appropriate map
    claimExpenses.forEach(exp => {
      if (exp.category === 'labor') {
        laborMap[exp.claimId] = (laborMap[exp.claimId] || 0) + exp.amount
      } else {
        partsMap[exp.claimId] = (partsMap[exp.claimId] || 0) + exp.amount
      }
    })

    // 4. P&L by Month — based on actual billed revenue (SENT/PAID) and actual expenses
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const pnlMap: Record<string, { month: string, ar: number, pendingAr: number, ap: number, profit: number, margin: number, claims: number }> = {}

    claims.forEach(c => {
      const d = new Date(c.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!pnlMap[key]) {
        pnlMap[key] = { month: `${monthNames[d.getMonth()]} ${d.getFullYear() + 543}`, ar: 0, pendingAr: 0, ap: 0, profit: 0, margin: 0, claims: 0 }
      }
      pnlMap[key].claims += 1

      const inv = c.insuranceInvoice
      const isBilled = Boolean(inv && ['SENT', 'PAID', 'PARTIAL'].includes(inv.status))
      if (isBilled) {
        pnlMap[key].ar += inv?.grandTotal || 0
      } else if (inv) {
        pnlMap[key].pendingAr += inv.grandTotal || 0
      }

      const claimAP = (partsMap[c.id] || 0) + (laborMap[c.id] || 0)
      pnlMap[key].ap += claimAP
    })

    const pnlByMonth = Object.entries(pnlMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => {
        v.profit = Math.round((v.ar - v.ap) * 100) / 100
        v.margin = v.ar > 0 ? (v.profit / v.ar) * 100 : 0
        v.ar = Math.round(v.ar * 100) / 100
        v.pendingAr = Math.round(v.pendingAr * 100) / 100
        v.ap = Math.round(v.ap * 100) / 100
        return v
      })

    if (pnlByMonth.length === 0) {
      pnlByMonth.push({ month: `${monthNames[new Date().getMonth()]} ${new Date().getFullYear() + 543}`, ar: 0, pendingAr: 0, ap: 0, profit: 0, margin: 0, claims: 0 })
    }

    // 5. AR Aging — Only invoices that have been issued/sent to insurance (SENT / PARTIAL)
    const arInvoices = await prisma.insuranceInvoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIAL'] },
        claim: claimFilter
      },
      select: {
        grandTotal: true,
        invoiceNo: true,
        invoiceDate: true,
        claim: {
          select: {
            claimNo: true,
            carPlate: true,
            insuranceId: true,
            insurance: {
              select: {
                name: true,
              },
            },
          },
        },
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

    // 6. AP Outstanding — Detailed list of unpaid vendor invoices
    const apInvoices = await prisma.supplierInvoice.findMany({
      where: {
        ...supplierFilter,
        apPayment: null, // not yet paid
        claim: claimFilter,
      },
      select: {
        createdAt: true,
        invoiceNo: true,
        totalAmount: true,
        vendorId: true,
        vendor: {
          select: {
            name: true,
            vendorType: true,
          },
        },
        claim: {
          select: {
            claimNo: true,
            carPlate: true,
          },
        },
        items: {
          select: {
            claimLaborId: true,
            description: true,
          },
        },
      },
    })

    const apOutstanding = [
      ...apInvoices.map(inv => {
        const hasLabor = inv.items?.some(i => i.claimLaborId || (i.description && i.description.includes('ค่าแรง')))
        const isGarage = inv.vendor?.vendorType === 'GARAGE'
        return {
          vendor: inv.vendor?.name || 'คู่ค้า',
          vendorId: inv.vendorId,
          type: (hasLabor || isGarage) ? 'ค่าแรง' : 'อะไหล่',
          invoiceNo: inv.invoiceNo || '-',
          claimNo: inv.claim?.claimNo || 'ทั่วไป',
          carPlate: inv.claim?.carPlate || 'ทั่วไป',
          invoiceDate: inv.createdAt,
          amount: inv.totalAmount
        }
      }),
      ...garageInvoices.map(inv => ({
        vendor: 'อู่ซ่อม',
        vendorId: '',
        type: 'ค่าแรง',
        invoiceNo: '-',
        claimNo: claims.find(c => c.id === inv.claimId)?.claimNo || '-',
        carPlate: claims.find(c => c.id === inv.claimId)?.carPlate || '-',
        invoiceDate: new Date(),
        amount: inv.totalAmount
      }))
    ].sort((a, b) => new Date(a.invoiceDate).getTime() - new Date(b.invoiceDate).getTime())

    // 7. Vendor Performance — real PO data aggregated in DB
    const poGroups = await prisma.purchaseOrder.groupBy({
      by: ['vendorId'],
      where: {
        claim: claimFilter,
        status: { not: 'CANCELLED' },
        vendorId: vendorId ? vendorId : undefined,
      },
      _count: {
        id: true,
      },
      _sum: {
        totalAmount: true,
      },
    })

    const vendorIds = poGroups.map(g => g.vendorId)
    const vendors = await prisma.vendor.findMany({
      where: {
        id: { in: vendorIds },
      },
      select: {
        id: true,
        name: true,
        vendorType: true,
        paymentTerms: true,
        zone: true,
      },
    })

    const vendorPerf = vendors.map(v => {
      const group = poGroups.find(g => g.vendorId === v.id)
      return {
        id: v.id,
        name: v.name,
        vendorType: v.vendorType,
        poCount: group?._count.id || 0,
        totalValue: group?._sum.totalAmount || 0,
        paymentTerms: v.paymentTerms,
        zone: v.zone,
      }
    })

    // 8. Income / Expense Detail — line-item breakdown per claim
    // Revenue is strictly from actual billed amount (SENT/PAID). Unbilled draft amounts are tracked in pendingAR.
    // Expenses are strictly actual parts and labor from supplier invoices.
    let incomeExpense = claims.map(c => {
      const inv = c.insuranceInvoice
      const isBilled = Boolean(inv && ['SENT', 'PAID', 'PARTIAL'].includes(inv.status))
      const arTotal = isBilled ? (inv?.grandTotal || 0) : 0
      const pendingAR = (!isBilled && inv) ? (inv?.grandTotal || 0) : 0

      const apParts = Math.round((partsMap[c.id] || 0) * 100) / 100
      const apLabor = Math.round((laborMap[c.id] || 0) * 100) / 100
      const apTotal = Math.round((apParts + apLabor) * 100) / 100

      // Profit calculation:
      // If billed: profit = billed revenue - actual expenses
      // If not billed: profit = 0 - actual expenses (shows negative expense until billed, or 0 if no expense)
      const profit = Math.round((arTotal - apTotal) * 100) / 100

      return {
        claimId: c.id,
        claimNo: c.claimNo,
        insurance: c.insurance?.name || '-',
        carPlate: c.carPlate || '-',
        date: c.createdAt,
        isBilled,
        arTotal,
        pendingAR,
        apParts,
        apLabor,
        apTotal,
        profit,
        invoiceNo: inv?.invoiceNo || '-',
        invoiceStatus: inv?.status || 'NONE',
      }
    })

    // Filter by billing status if requested
    if (billingStatus === 'billed') {
      incomeExpense = incomeExpense.filter(ie => ie.isBilled)
    } else if (billingStatus === 'unbilled') {
      incomeExpense = incomeExpense.filter(ie => !ie.isBilled)
    }

    incomeExpense.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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

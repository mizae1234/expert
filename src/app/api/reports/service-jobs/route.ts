import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId') || undefined
    const status = searchParams.get('status') || undefined
    const isSyncedParam = searchParams.get('isSynced')
    const search = searchParams.get('search')?.trim()
    const dateField = searchParams.get('dateField') || 'operationDate' // 'operationDate' | 'createdAt' | 'invoiceDate'

    // Date range filter
    const now = new Date()
    // Defaults to last 3 months if not provided
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const dateFromStr = searchParams.get('dateFrom')
    const dateToStr = searchParams.get('dateTo')

    const dateFrom = dateFromStr ? new Date(`${dateFromStr}T00:00:00.000Z`) : defaultFrom
    const dateTo = dateToStr ? new Date(`${dateToStr}T23:59:59.999Z`) : new Date(`${now.toISOString().split('T')[0]}T23:59:59.999Z`)

    const where: any = {}

    // Date filtering
    if (dateField === 'createdAt') {
      where.createdAt = { gte: dateFrom, lte: dateTo }
    } else if (dateField === 'invoiceDate') {
      where.invoiceDate = { gte: dateFrom, lte: dateTo }
    } else {
      // Default: operationDate. If operationDate is null, fallback to createdAt
      where.OR = [
        { operationDate: { gte: dateFrom, lte: dateTo } },
        { operationDate: null, createdAt: { gte: dateFrom, lte: dateTo } },
      ]
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    if (isSyncedParam === 'true') {
      where.isSynced = true
    } else if (isSyncedParam === 'false') {
      where.isSynced = false
    }

    if (search) {
      const searchCondition = [
        { orderNo: { contains: search, mode: 'insensitive' } },
        { invoiceNo: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        {
          vehicles: {
            some: {
              OR: [
                { carPlate: { contains: search, mode: 'insensitive' } },
                { carVin: { contains: search, mode: 'insensitive' } },
                { carModel: { contains: search, mode: 'insensitive' } },
                { carBrand: { contains: search, mode: 'insensitive' } },
              ],
            },
          },
        },
      ]

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchCondition },
        ]
        delete where.OR
      } else {
        where.OR = searchCondition
      }
    }

    const orders = await prisma.serviceOrder.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            taxId: true,
            phone: true,
            branchCode: true,
          },
        },
        vehicles: {
          include: {
            items: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: [
        { operationDate: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    // Compute Summary & Aggregations
    let totalVehicles = 0
    let completedVehicles = 0
    let inProgressVehicles = 0
    let pendingVehicles = 0
    let cancelledVehicles = 0

    let totalSubtotal = 0
    let totalVat = 0
    let totalGrandTotal = 0
    let invoicedTotal = 0
    let pendingInvoiceTotal = 0
    let syncedCount = 0

    const customerMap: Record<string, { customerId: string; customerName: string; orderCount: number; vehicleCount: number; grandTotal: number; subtotal: number }> = {}
    
    const statusMap: Record<string, { status: string; count: number; grandTotal: number }> = {
      PENDING: { status: 'PENDING', count: 0, grandTotal: 0 },
      IN_PROGRESS: { status: 'IN_PROGRESS', count: 0, grandTotal: 0 },
      COMPLETED: { status: 'COMPLETED', count: 0, grandTotal: 0 },
      CANCELLED: { status: 'CANCELLED', count: 0, grandTotal: 0 },
    }

    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    const monthMap: Record<string, { month: string; yearMonth: string; orderCount: number; vehicleCount: number; grandTotal: number }> = {}

    for (const order of orders) {
      const isCancelled = order.status === 'CANCELLED'
      const vehicleCount = order.vehicles.length
      totalVehicles += vehicleCount

      for (const v of order.vehicles) {
        if (v.status === 'COMPLETED') completedVehicles++
        else if (v.status === 'IN_PROGRESS') inProgressVehicles++
        else if (v.status === 'CANCELLED') cancelledVehicles++
        else pendingVehicles++
      }

      if (!isCancelled) {
        totalSubtotal += order.subtotal || 0
        totalVat += order.vatAmount || 0
        totalGrandTotal += order.grandTotal || 0

        if (order.invoiceNo) {
          invoicedTotal += order.grandTotal || 0
        } else {
          pendingInvoiceTotal += order.grandTotal || 0
        }
      }

      if (order.isSynced) {
        syncedCount++
      }

      // Group by Customer
      const cId = order.customerId || 'unknown'
      const cName = order.customer?.name || 'ไม่ระบุลูกค้า'
      if (!customerMap[cId]) {
        customerMap[cId] = {
          customerId: cId,
          customerName: cName,
          orderCount: 0,
          vehicleCount: 0,
          grandTotal: 0,
          subtotal: 0,
        }
      }
      customerMap[cId].orderCount += 1
      customerMap[cId].vehicleCount += vehicleCount
      if (!isCancelled) {
        customerMap[cId].grandTotal += order.grandTotal || 0
        customerMap[cId].subtotal += order.subtotal || 0
      }

      // Group by Status
      if (statusMap[order.status]) {
        statusMap[order.status].count += 1
        if (!isCancelled) {
          statusMap[order.status].grandTotal += order.grandTotal || 0
        }
      }

      // Group by Month (using operationDate or createdAt)
      const d = order.operationDate ? new Date(order.operationDate) : new Date(order.createdAt)
      const ymKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      if (!monthMap[ymKey]) {
        monthMap[ymKey] = {
          month: `${monthNames[d.getMonth()]} ${d.getFullYear() + 543}`,
          yearMonth: ymKey,
          orderCount: 0,
          vehicleCount: 0,
          grandTotal: 0,
        }
      }
      monthMap[ymKey].orderCount += 1
      monthMap[ymKey].vehicleCount += vehicleCount
      if (!isCancelled) {
        monthMap[ymKey].grandTotal += order.grandTotal || 0
      }
    }

    const byCustomer = Object.values(customerMap).sort((a, b) => b.grandTotal - a.grandTotal)
    const byStatus = Object.values(statusMap)
    const byMonth = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v)

    return NextResponse.json({
      summary: {
        totalOrders: orders.length,
        totalVehicles,
        completedVehicles,
        inProgressVehicles,
        pendingVehicles,
        cancelledVehicles,
        totalSubtotal: Math.round(totalSubtotal * 100) / 100,
        totalVat: Math.round(totalVat * 100) / 100,
        totalGrandTotal: Math.round(totalGrandTotal * 100) / 100,
        invoicedTotal: Math.round(invoicedTotal * 100) / 100,
        pendingInvoiceTotal: Math.round(pendingInvoiceTotal * 100) / 100,
        syncedCount,
      },
      byCustomer,
      byStatus,
      byMonth,
      orders,
    })
  } catch (error: any) {
    console.error('[API] GET /api/reports/service-jobs error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

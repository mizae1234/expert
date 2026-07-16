import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: { customer: true }
    })

    if (!order) {
      return NextResponse.json({ error: 'Service order not found' }, { status: 404 })
    }

    if (order.invoiceNo) {
      return NextResponse.json({ error: 'Invoice already exists for this order' }, { status: 400 })
    }

    // Generate IVS-YYYYMMXXXXX sequence number
    const now = new Date()
    const yyyymm = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `IVS-${yyyymm}`

    const latestInvoice = await prisma.serviceOrder.findFirst({
      where: { invoiceNo: { startsWith: prefix } },
      orderBy: { invoiceNo: 'desc' }
    })

    let nextNo = 1
    if (latestInvoice && latestInvoice.invoiceNo) {
      const match = latestInvoice.invoiceNo.match(/(\d+)$/)
      if (match) {
        nextNo = parseInt(match[1], 10) + 1
      }
    }
    const invoiceNo = `${prefix}${String(nextNo).padStart(5, '0')}`

    const invoiceDate = new Date()
    const creditTermDays = order.customer.creditTermArDays || 30
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + creditTermDays)

    const updated = await prisma.serviceOrder.update({
      where: { id: params.id },
      data: {
        invoiceNo,
        invoiceDate,
        dueDate,
        status: 'COMPLETED'
      },
      include: {
        customer: true,
        vehicles: {
          include: {
            items: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

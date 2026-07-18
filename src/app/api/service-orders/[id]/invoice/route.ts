import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const order = await prisma.serviceOrder.findUnique({
      where: { id: params.id },
      include: { 
        customer: true,
        vehicles: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Service order not found' }, { status: 404 })
    }

    if (order.invoiceNo) {
      return NextResponse.json({ error: 'Invoice already exists for this order' }, { status: 400 })
    }

    const incompleteVehicles = order.vehicles.filter(v => v.status !== 'COMPLETED' && v.status !== 'CANCELLED')
    if (incompleteVehicles.length > 0) {
      return NextResponse.json({ 
        error: 'ไม่สามารถออกใบวางบิลได้ เนื่องจากยังมีรถยนต์บางคันกำลังดำเนินการอยู่ (กรุณากดเสร็จสิ้นหรือยกเลิกรถทุกคันก่อน)' 
      }, { status: 400 })
    }

    // Generate sequential invoice number in IVT-YYYYMMXXXXX format, shared with claims
    const now = new Date()
    const yyyymm = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `IVT-${yyyymm}`

    // 1. Get max sequence from InsuranceInvoice
    const resultClaim = await prisma.$queryRawUnsafe<{max_seq: number}[]>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING("invoiceNo" FROM ${prefix.length + 1}) AS INTEGER)), 0) as max_seq
       FROM "InsuranceInvoice"
       WHERE "invoiceNo" LIKE $1 AND LENGTH("invoiceNo") = $2`,
      `${prefix}%`,
      prefix.length + 5
    )
    const maxClaim = Number(resultClaim[0]?.max_seq ?? 0)

    // 2. Get max sequence from ServiceOrder
    const resultService = await prisma.$queryRawUnsafe<{max_seq: number}[]>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING("invoiceNo" FROM ${prefix.length + 1}) AS INTEGER)), 0) as max_seq
       FROM "ServiceOrder"
       WHERE "invoiceNo" LIKE $1 AND LENGTH("invoiceNo") = $2`,
      `${prefix}%`,
      prefix.length + 5
    )
    const maxService = Number(resultService[0]?.max_seq ?? 0)

    // 3. Increment the absolute maximum
    const nextNo = Math.max(maxClaim, maxService) + 1
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

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Default: last 3 months if no date filter
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : defaultFrom
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')! + 'T23:59:59') : now

  const invoices = await prisma.insuranceInvoice.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo }
    },
    include: {
      claim: {
        select: {
          id: true,
          claimNo: true,
          carPlate: true,
          insurance: { select: { id: true, name: true, creditTermArDays: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json(invoices)
}

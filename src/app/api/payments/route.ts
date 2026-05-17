import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Default: last 3 months if no date filter
  const now = new Date()
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  const dateFrom = searchParams.get('dateFrom') ? new Date(searchParams.get('dateFrom')!) : defaultFrom
  const dateTo = searchParams.get('dateTo') ? new Date(searchParams.get('dateTo')! + 'T23:59:59') : now

  const payments = await prisma.paymentRequest.findMany({
    where: {
      createdAt: { gte: dateFrom, lte: dateTo }
    },
    orderBy: { createdAt: 'desc' },
    include: {
      claim: {
        select: {
          claimNo: true,
          carPlate: true,
          insurance: { select: { name: true } }
        }
      },
      supplierInvoice: {
        select: {
          invoiceNo: true,
          pdfUrl: true,
          vendor: { select: { name: true } }
        }
      },
      garageInvoice: {
        select: {
          invoiceNo: true,
          pdfUrl: true,
          garage: { select: { name: true } }
        }
      },
      insuranceInvoice: { select: { invoiceNo: true } }
    }
  })
  
  // map to frontend expected format
  const formatted = payments.map(p => ({
    id: p.id,
    requestType: p.requestType,
    amount: p.amount,
    whtAmount: p.whtAmount,
    method: p.method,
    status: p.status,
    createdAt: p.createdAt,
    createdBy: p.createdBy,
    rejectReason: p.rejectReason,
    approvedBy: p.approvedBy,
    approvedAt: p.approvedAt,
    claimId: p.claimId,
    claimNo: p.claim?.claimNo,
    carPlate: p.claim?.carPlate,
    vendorName: p.supplierInvoice?.vendor?.name,
    garageName: p.garageInvoice?.garage?.name,
    insuranceName: p.claim?.insurance?.name,
    invoiceUrl: p.supplierInvoice?.pdfUrl || p.garageInvoice?.pdfUrl || null,
    invoiceNo: p.supplierInvoice?.invoiceNo || p.garageInvoice?.invoiceNo || null
  }))

  return NextResponse.json(formatted)
}

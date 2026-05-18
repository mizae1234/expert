import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [arInvoices, supplierInvoices, garageInvoices] = await Promise.all([
      prisma.insuranceInvoice.findMany({
        where: {
          status: { in: ['PENDING', 'SENT', 'PAID'] }
        },
        include: {
          claim: {
            include: { insurance: { select: { id: true, name: true } } }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.supplierInvoice.findMany({
        where: {
          OR: [
            { apPayment: { isNot: null } },
            { paymentRequests: { some: { status: 'APPROVED' } } }
          ]
        },
        include: {
          claim: { select: { claimNo: true } },
          vendor: { select: { name: true } },
          paymentRequests: true,
          apPayment: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.garageInvoice.findMany({
        where: {
          paymentRequests: { some: { status: 'APPROVED' } }
        },
        include: {
          claim: { select: { claimNo: true } },
          garage: { select: { name: true } },
          paymentRequests: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ])

    return NextResponse.json({
      arInvoices: arInvoices.map(inv => ({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        claimNo: inv.claim.claimNo,
        insuranceName: inv.claim.insurance.name,
        invoiceDate: inv.invoiceDate,
        grandTotal: inv.grandTotal,
        isSynced: false // Mock for now
      })),
      apInvoices: [
        ...supplierInvoices.map(inv => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          claimNo: inv.claim.claimNo,
          vendorName: inv.vendor.name,
          invoiceDate: inv.invoiceDate,
          totalAmount: inv.totalAmount,
          isSynced: false,
          type: 'SUPPLIER'
        })),
        ...garageInvoices.map(inv => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          claimNo: inv.claim.claimNo,
          vendorName: inv.garage?.name || 'อู่ซ่อม',
          invoiceDate: inv.createdAt,
          totalAmount: inv.totalAmount,
          isSynced: false,
          type: 'GARAGE'
        }))
      ].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime())
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

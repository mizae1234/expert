import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const [arInvoices, supplierInvoices, garageInvoices, expenses] = await Promise.all([
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
      }),
      prisma.claimExpense.findMany({
        include: {
          claim: { select: { claimNo: true } }
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
        isSynced: inv.isSynced,
        syncedAt: inv.syncedAt
      })),
      apInvoices: [
        ...supplierInvoices.map(inv => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          claimNo: inv.claim.claimNo,
          vendorName: inv.vendor.name,
          invoiceDate: inv.invoiceDate,
          totalAmount: inv.totalAmount,
          isSynced: inv.isSynced,
          syncedAt: inv.syncedAt,
          type: 'SUPPLIER'
        })),
        ...garageInvoices.map(inv => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          claimNo: inv.claim.claimNo,
          vendorName: inv.garage?.name || 'อู่ซ่อม',
          invoiceDate: inv.createdAt,
          totalAmount: inv.totalAmount,
          isSynced: inv.isSynced,
          syncedAt: inv.syncedAt,
          type: 'GARAGE'
        }))
      ].sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()),
      expenses: expenses.map(exp => ({
        id: exp.id,
        claimNo: exp.claim.claimNo,
        category: exp.category,
        description: exp.description,
        amount: exp.amount,
        date: exp.date,
        createdBy: exp.createdBy,
        isSynced: exp.isSynced,
        syncedAt: exp.syncedAt
      }))
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

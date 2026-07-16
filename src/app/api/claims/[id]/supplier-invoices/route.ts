import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoices = await prisma.supplierInvoice.findMany({
      where: { claimId: params.id },
      include: { vendor: true, items: true, apPayment: true }
    })
    return NextResponse.json(invoices)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const subtotal = (body.items || []).reduce((s: number, item: any) => s + (item.totalPrice || 0), 0)
    const vatAmount = body.vatAmount ?? (Math.round(subtotal * 0.07 * 100) / 100)
    const totalAmount = Math.round((subtotal + vatAmount) * 100) / 100

    // Auto-generate sequential invoice number if not provided
    let invoiceNo = body.invoiceNo
    if (!invoiceNo) {
      const year = new Date().getFullYear()
      const count = await prisma.supplierInvoice.count({
        where: { invoiceNo: { startsWith: `SINV-${year}-` } }
      })
      invoiceNo = `SINV-${year}-${String(count + 1).padStart(6, '0')}`
    }

    // Check if invoiceNo already exists
    const existingInvoice = await prisma.supplierInvoice.findUnique({
      where: { invoiceNo },
      include: { items: true }
    })

    let invoiceResult
    if (existingInvoice) {
      if (existingInvoice.claimId !== params.id || existingInvoice.vendorId !== body.vendorId) {
        return NextResponse.json({
          error: `เลขที่ใบวางบิล/Invoice "${invoiceNo}" นี้ถูกใช้งานในระบบแล้ว (โดยคู่ค้าอื่นหรือเคลมอื่น)`
        }, { status: 400 })
      }

      // Update existing supplier invoice: append new items and sum totals
      invoiceResult = await prisma.supplierInvoice.update({
        where: { id: existingInvoice.id },
        data: {
          pdfUrl: body.pdfUrl || existingInvoice.pdfUrl,
          subtotal: existingInvoice.subtotal + subtotal,
          vatAmount: existingInvoice.vatAmount + vatAmount,
          totalAmount: existingInvoice.totalAmount + totalAmount,
          whtAmount: existingInvoice.whtAmount + (body.whtAmount || 0),
          whtPct: body.whtPct !== undefined ? body.whtPct : existingInvoice.whtPct,
          items: {
            create: (body.items || []).map((item: any) => ({
              poItemId: item.poItemId || null,
              claimPartId: item.claimPartId || null,
              claimLaborId: item.claimLaborId || null,
              partNo: item.partNo || '',
              description: item.description || '',
              quantity: Number(item.quantity || 1),
              unitPrice: Number(item.unitPrice || 0),
              totalPrice: Number(item.totalPrice || 0)
            }))
          }
        },
        include: { vendor: true, items: true, apPayment: true }
      })
    } else {
      // Create new supplier invoice
      invoiceResult = await prisma.supplierInvoice.create({
        data: {
          claimId: params.id,
          vendorId: body.vendorId,
          invoiceNo,
          invoiceDate: new Date(body.invoiceDate || new Date()),
          subtotal,
          vatAmount,
          totalAmount,
          whtAmount: body.whtAmount || 0,
          whtPct: body.whtPct || 0,
          pdfUrl: body.pdfUrl || null,
          items: {
            create: (body.items || []).map((item: any) => ({
              poItemId: item.poItemId || null,
              claimPartId: item.claimPartId || null,
              claimLaborId: item.claimLaborId || null,
              partNo: item.partNo || '',
              description: item.description || '',
              quantity: Number(item.quantity || 1),
              unitPrice: Number(item.unitPrice || 0),
              totalPrice: Number(item.totalPrice || 0)
            }))
          }
        },
        include: { vendor: true, items: true, apPayment: true }
      })
    }

    // Update paymentStatus of the related ClaimParts to 'INVOICED'
    const partIds = (body.items || []).map((item: any) => item.claimPartId).filter(Boolean)
    if (partIds.length > 0) {
      await prisma.claimPart.updateMany({
        where: { id: { in: partIds } },
        data: { paymentStatus: 'INVOICED' }
      })
    }

    // Also mark labors as INVOICED (when unified invoice covers both parts + labors)
    const laborIds = body.laborIds || (body.items || []).map((item: any) => item.claimLaborId).filter(Boolean)
    if (laborIds.length > 0) {
      await prisma.claimLabor.updateMany({
        where: { id: { in: laborIds } },
        data: { paymentStatus: 'INVOICED' }
      })
    }

    return NextResponse.json(invoiceResult, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create supplier invoice:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const invoiceId = searchParams.get('invoiceId')
    if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

    // Get the invoice with items to find related claimPartIds
    const inv = await prisma.supplierInvoice.findUnique({
      where: { id: invoiceId },
      include: { items: true }
    })
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    // Reset related claimParts back to PENDING
    const partIds = inv.items.map(item => item.claimPartId).filter(Boolean) as string[]
    if (partIds.length > 0) {
      await prisma.claimPart.updateMany({
        where: { id: { in: partIds } },
        data: { paymentStatus: 'PENDING' }
      })
    }

    // Reset related claimLabors back to PENDING
    const laborIds = inv.items.map(item => item.claimLaborId).filter(Boolean) as string[]
    if (laborIds.length > 0) {
      await prisma.claimLabor.updateMany({
        where: { id: { in: laborIds } },
        data: { paymentStatus: 'PENDING' }
      })
    }

    // Delete related payment requests
    await prisma.paymentRequest.deleteMany({ where: { supplierInvoiceId: invoiceId } })

    // Delete items first, then invoice
    await prisma.supplierInvoiceItem.deleteMany({ where: { supplierInvoiceId: invoiceId } })
    await prisma.supplierInvoice.delete({ where: { id: invoiceId } })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Failed to delete supplier invoice:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

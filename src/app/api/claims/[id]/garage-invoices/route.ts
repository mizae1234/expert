import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoices = await prisma.garageInvoice.findMany({
      where: { claimId: params.id },
      include: { garage: true, items: true }
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
      const count = await prisma.garageInvoice.count({
        where: { invoiceNo: { startsWith: `GINV-${year}-` } }
      })
      invoiceNo = `GINV-${year}-${String(count + 1).padStart(6, '0')}`
    }

    const newInvoice = await prisma.garageInvoice.create({
      data: {
        claimId: params.id,
        garageId: body.garageId,
        invoiceNo,
        invoiceDate: new Date(body.invoiceDate || new Date()),
        subtotal,
        vatAmount,
        totalAmount,
        pdfUrl: body.pdfUrl || null,
        items: {
          create: (body.items || []).map((item: any) => ({
            claimLaborId: item.claimLaborId || null,
            description: item.description || '',
            unitPrice: Number(item.unitPrice || 0),
            totalPrice: Number(item.totalPrice || 0)
          }))
        }
      },
      include: { garage: true, items: true }
    })

    // Update paymentStatus of the related ClaimLabors to 'INVOICED'
    const laborIds = (body.items || []).map((item: any) => item.claimLaborId).filter(Boolean)
    if (laborIds.length > 0) {
      await prisma.claimLabor.updateMany({
        where: { id: { in: laborIds } },
        data: { paymentStatus: 'INVOICED' }
      })
    }

    return NextResponse.json(newInvoice, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create garage invoice:', error)
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

    const inv = await prisma.garageInvoice.findUnique({
      where: { id: invoiceId },
      include: { items: true }
    })
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    // Reset related claimLabors back to PENDING
    const laborIds = inv.items.map(item => item.claimLaborId).filter(Boolean) as string[]
    if (laborIds.length > 0) {
      await prisma.claimLabor.updateMany({
        where: { id: { in: laborIds } },
        data: { paymentStatus: 'PENDING' }
      })
    }

    await prisma.garageInvoiceItem.deleteMany({ where: { garageInvoiceId: invoiceId } })
    await prisma.garageInvoice.delete({ where: { id: invoiceId } })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('Failed to delete garage invoice:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

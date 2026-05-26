import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const claim = await prisma.claim.findUnique({
      where: { id: params.id },
      include: { parts: true, labors: true, insurance: true }
    })
    
    if (!claim) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await request.json()
    
    // Check if one already exists
    const existing = await prisma.insuranceInvoice.findUnique({
      where: { claimId: params.id }
    })
    
    if (existing) {
      return NextResponse.json({ error: 'มีใบวางบิลอยู่แล้ว กรุณาลบใบเดิมก่อนสร้างใหม่' }, { status: 400 })
    }

    // Generate readable sequential invoice number in IVT-YYYYMMXXXXX format
    const now = new Date()
    const yyyymm = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0')
    const prefix = `IVT-${yyyymm}`
    const count = await prisma.insuranceInvoice.count({
      where: { invoiceNo: { startsWith: 'IVT-' } }
    })
    const nextNo = 226 + count
    const seqNo = String(nextNo).padStart(5, '0')
    const invoiceNo = body.invoiceNo || `${prefix}${seqNo}`

    const invoiceDate = new Date(body.invoiceDate || Date.now())
    const creditTermDays = claim.insurance?.creditTermArDays ?? 30
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + creditTermDays)

    const newInvoice = await prisma.insuranceInvoice.create({
      data: {
        claimId: params.id,
        invoiceNo,
        invoiceDate,
        dueDate,
        laborTotal: body.laborTotal,
        partsTotal: body.partsTotal,
        subtotal: body.subtotal,
        vatAmount: body.vatAmount,
        grandTotal: body.grandTotal,
        status: 'PENDING'
      }
    })
    
    return NextResponse.json(newInvoice, { status: 201 })
  } catch (err: any) {
    console.error('Create Insurance Invoice Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = await prisma.insuranceInvoice.findUnique({
      where: { claimId: params.id }
    })
    
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบใบวางบิลที่ต้องการลบ' }, { status: 404 })
    }
    
    await prisma.insuranceInvoice.delete({
      where: { claimId: params.id }
    })
    
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Delete Insurance Invoice Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

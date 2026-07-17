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

    const invoiceDate = new Date(body.invoiceDate || Date.now())
    const creditTermDays = claim.insurance?.creditTermArDays ?? 30
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(dueDate.getDate() + creditTermDays)

    // Retry loop to handle race conditions on invoiceNo
    let newInvoice
    const maxRetries = 5
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const latestInvoice = await prisma.insuranceInvoice.findFirst({
        where: { invoiceNo: { startsWith: prefix } },
        orderBy: { invoiceNo: 'desc' }
      })

      let nextNo = 1
      if (latestInvoice) {
        // Extract only the 5-digit sequence after the prefix (e.g. "IVT-202607" is 10 chars)
        const seqPart = latestInvoice.invoiceNo.slice(prefix.length)
        const parsed = parseInt(seqPart, 10)
        if (!isNaN(parsed)) {
          nextNo = parsed + 1
        }
      }
      const seqNo = String(nextNo).padStart(5, '0')
      const invoiceNo = body.invoiceNo || `${prefix}${seqNo}`

      try {
        newInvoice = await prisma.insuranceInvoice.create({
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
        break // success
      } catch (e: any) {
        // If unique constraint error on invoiceNo, retry with new sequence
        if (e.code === 'P2002' && e.meta?.target?.includes('invoiceNo') && !body.invoiceNo) {
          if (attempt === maxRetries - 1) throw e
          continue
        }
        throw e
      }
    }
    
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

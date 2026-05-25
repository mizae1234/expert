import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { id, type, invoiceNo } = await req.json()
    if (!id || !type || !invoiceNo) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const trimmedNo = invoiceNo.trim()
    if (!trimmedNo) {
      return NextResponse.json({ error: 'เลขที่เอกสารห้ามว่าง' }, { status: 400 })
    }

    if (type === 'AR') {
      // Check duplicate
      const duplicate = await prisma.insuranceInvoice.findUnique({
        where: { invoiceNo: trimmedNo }
      })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'เลขที่เอกสารนี้ซ้ำในระบบ กรุณาใช้เลขอื่น' }, { status: 400 })
      }

      await prisma.insuranceInvoice.update({
        where: { id },
        data: { invoiceNo: trimmedNo }
      })
    } else if (type === 'SUPPLIER') {
      const duplicate = await prisma.supplierInvoice.findUnique({
        where: { invoiceNo: trimmedNo }
      })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'เลขที่เอกสารนี้ซ้ำในระบบ กรุณาใช้เลขอื่น' }, { status: 400 })
      }

      await prisma.supplierInvoice.update({
        where: { id },
        data: { invoiceNo: trimmedNo }
      })
    } else if (type === 'GARAGE') {
      const duplicate = await prisma.garageInvoice.findUnique({
        where: { invoiceNo: trimmedNo }
      })
      if (duplicate && duplicate.id !== id) {
        return NextResponse.json({ error: 'เลขที่เอกสารนี้ซ้ำในระบบ กรุณาใช้เลขอื่น' }, { status: 400 })
      }

      await prisma.garageInvoice.update({
        where: { id },
        data: { invoiceNo: trimmedNo }
      })
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Update doc no error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'เลขที่เอกสารนี้ซ้ำในระบบ กรุณาใช้เลขอื่น' }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

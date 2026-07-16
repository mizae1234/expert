import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      where: { claimId: params.id },
      include: {
        vendor: true,
        items: true
      }
    })
    return NextResponse.json(pos)
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
    
    // Generate sequential PO number if not provided
    let poNo = body.poNo
    if (!poNo) {
      const poType = body.poType || 'PARTS'
      const defaultPrefix = poType === 'PARTS' ? 'PO' : 'PL'
      const now = new Date()
      const yyyymm = now.getFullYear() + String(now.getMonth() + 1).padStart(2, '0')
      const prefix = `${defaultPrefix}-${yyyymm}`

      const latestPO = await prisma.purchaseOrder.findFirst({
        where: { poNo: { startsWith: prefix } },
        orderBy: { poNo: 'desc' }
      })

      let nextNo = 1
      if (latestPO) {
        const match = latestPO.poNo.match(/(\d+)$/)
        if (match) {
          nextNo = parseInt(match[1], 10) + 1
        }
      }
      
      const seqNo = String(nextNo).padStart(5, '0')
      poNo = `${prefix}${seqNo}`
    }

    // Calculate total with configurable VAT
    const subtotal = (body.items || []).reduce((sum: number, item: any) => sum + (item.totalPrice || 0), 0)
    const totalAmount = body.totalAmount !== undefined 
      ? Number(body.totalAmount) 
      : (subtotal + (body.includeVat !== false ? Math.round(subtotal * ((body.vatPct ?? 7) / 100) * 100) / 100 : 0))
    
    const newPO = await prisma.purchaseOrder.create({
      data: {
        poNo,
        claimId: params.id,
        vendorId: body.vendorId,
        poType: body.poType || 'PARTS',
        deliveryMode: body.deliveryMode || 'DIRECT_TO_GARAGE',
        deliveryAddress: body.deliveryAddress || null,
        status: body.status || 'DRAFT',
        totalAmount,
        items: {
          create: (body.items || []).map((item: any) => ({
            partNo: item.partNo || '',
            description: item.description || '',
            quantity: Number(item.quantity || 1),
            unitPrice: Number(item.unitPrice || 0),
            totalPrice: Number(item.totalPrice || 0)
          }))
        }
      },
      include: {
        vendor: true,
        items: true
      }
    })
    
    return NextResponse.json(newPO, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create PO:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

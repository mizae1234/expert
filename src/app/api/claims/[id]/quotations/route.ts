import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { laborItems, partItems, ...quotationData } = body

    const newQt = await prisma.quotation.create({
      data: {
        claimId: params.id,
        quotationNo: quotationData.quotationNo,
        quotationDate: quotationData.quotationDate ? new Date(quotationData.quotationDate) : new Date(),
        validUntil: quotationData.validUntil ? new Date(quotationData.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        laborTotal: Number(quotationData.laborTotal || 0),
        partsTotal: Number(quotationData.partsTotal || 0),
        subtotal: Number(quotationData.subtotal || 0),
        vatAmount: Number(quotationData.vatAmount || 0),
        grandTotal: Number(quotationData.grandTotal || 0),
        note: quotationData.note,
        status: quotationData.status || 'DRAFT',
        createdBy: quotationData.createdBy || 'Admin',
        laborItems: {
          create: (laborItems || []).map((l: any) => ({
            description: l.description || '',
            damageLevel: l.damageLevel,
            discountPct: Number(l.discountPct || 0),
            unitPrice: Number(l.unitPrice || 0),
            totalPrice: Number(l.totalPrice || 0)
          }))
        },
        partItems: {
          create: (partItems || []).map((p: any) => ({
            partNo: p.partNo,
            partName: p.partName || '',
            quantity: Number(p.quantity || 1),
            unitPrice: Number(p.unitPrice || 0),
            discountPct: Number(p.discountPct || 0),
            totalPrice: Number(p.totalPrice || 0)
          }))
        }
      },
      include: {
        laborItems: true,
        partItems: true
      }
    })

    return NextResponse.json(newQt)
  } catch (error: any) {
    console.error('Failed to create quotation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { id: qtId, status, approvedBy } = body

    if (!qtId) {
      return NextResponse.json({ error: 'Quotation ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (approvedBy) {
      updateData.approvedBy = approvedBy
      updateData.approvedAt = new Date()
    }

    const updated = await prisma.quotation.update({
      where: { id: qtId },
      data: updateData,
      include: { laborItems: true, partItems: true }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update quotation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
